package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

var dbPool *pgxpool.Pool

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error loading .env:", err)
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL environment variable is not set.")
	}

	dbPool, err = pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer dbPool.Close()

	err = dbPool.Ping(context.Background())
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	fmt.Println("Connected to the database!")

	r := gin.Default()

	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		log.Fatal("SESSION_SECRET environment variable is not set.")
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	store := cookie.NewStore([]byte(sessionSecret))
	r.Use(sessions.Sessions("mysession", store))

	r.GET("/", func(c *gin.Context) {
		c.String(200, "Hello from Go + Gin!")
	})

	r.POST("/api/register", registerHandler)
	r.POST("/api/login", loginHandler)
	r.POST("/api/logout", logoutHandler)
	r.GET("/api/profile", profileHandler)

	// Detekt
	r.POST("/api/clone", cloneHandler)
	r.GET("/api/projects", listProjectsHandler)
	r.GET("/api/project/:projectId/scans", listProjectScansHandler)
	r.GET("/api/scan/:scanId/sonarqube", getSonarQubeResultsForDetektScanHandler)
	r.GET("/api/scan/:scanId/detekt", getScanHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	fmt.Printf("Starting server on port %s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

// ------------------- User Auth ----------------------

func registerHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	// Parse JSON body
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("Register: Bad request JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data."})
		return
	}

	// Validate password
	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters."})
		return
	}

	ctx := context.Background()

	// Check if username exists
	var existingID string
	err := dbPool.QueryRow(ctx, "SELECT id FROM users WHERE username=$1", req.Username).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists."})
		return
	}

	// Hash password
	hashBytes, hashErr := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if hashErr != nil {
		log.Println("Register: bcrypt error:", hashErr)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error."})
		return
	}

	// Insert new user
	_, insertErr := dbPool.Exec(ctx,
		"INSERT INTO users (username, password) VALUES ($1, $2)",
		req.Username, string(hashBytes))
	if insertErr != nil {
		log.Println("Register: DB insert error:", insertErr)
		c.JSON(http.StatusInternalServerError, gin.H{"error": insertErr.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

func loginHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}
	ctx := context.Background()
	var userID, hashedPassword string
	err := dbPool.QueryRow(ctx, "SELECT id, password FROM users WHERE username=$1", req.Username).Scan(&userID, &hashedPassword)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}
	session := sessions.Default(c)
	session.Set("userID", userID)
	if saveErr := session.Save(); saveErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Session save error", "error": saveErr.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Logged in successfully"})
}

func logoutHandler(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Logout error", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func profileHandler(c *gin.Context) {
	session := sessions.Default(c)
	userID := session.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in"})
		return
	}
	ctx := context.Background()
	var username string
	err := dbPool.QueryRow(ctx, "SELECT username FROM users WHERE id=$1", userID).Scan(&username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":       userID,
		"username": username,
	})
}

// --------------- Detekt (scan and results) ------------

func cloneHandler(c *gin.Context) {
	var req struct {
		RepoURL string `json:"repoUrl" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.RepoURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request: repoUrl is required."})
		return
	}

	session := sessions.Default(c)
	userID := session.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in"})
		return
	}

	ctx := context.Background()
	var projectID string
	parts := strings.Split(strings.TrimSuffix(req.RepoURL, ".git"), "/")
	projectName := parts[len(parts)-1]

	// Find or create project
	err := dbPool.QueryRow(ctx, "SELECT id FROM projects WHERE user_id = $1 AND url = $2", userID, req.RepoURL).Scan(&projectID)
	if err != nil { // Assuming pgx.ErrNoRows if not found
		err2 := dbPool.QueryRow(ctx,
			`INSERT INTO projects (user_id, name, url) VALUES ($1, $2, $3) RETURNING id`,
			userID, projectName, req.RepoURL).Scan(&projectID)
		if err2 != nil {
			log.Printf("Error inserting new project %s: %v", projectName, err2)
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Could not save project"})
			return
		}
		log.Printf("Created new project %s with ID: %s", projectName, projectID)
	} else {
		log.Printf("Found existing project %s with ID: %s", projectName, projectID)
	}

	projectKeyForSonar := fmt.Sprintf("proj_%s_%s", userID, projectID)

	// Run Analysis
	detektXML, err := runAnalysisContainer(req.RepoURL, projectKeyForSonar)
	if err != nil {
		log.Printf("Scan failed (runAnalysisContainer) for %s: %v", req.RepoURL, err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Detekt scan failed", "details": err.Error()})
		return
	}

	// Store Detekt Results
	_, err = dbPool.Exec(ctx, `
        INSERT INTO detekt_results (project_id, detekt_xml, detected_at)
        VALUES ($1, $2, $3)
    `, projectID, detektXML, time.Now())
	if err != nil {
		log.Printf("Failed to insert detekt result for projectID %s: %v", projectID, err)
		// Decide if this is critical enough to stop. For now, we log and continue to SonarQube.
	} else {
		log.Printf("Successfully stored Detekt results for projectID %s", projectID)
	}

	// --- New: Fetch and Store SonarQube Results ---
	sonarHostURL := os.Getenv("SONAR_HOST_URL")
	if sonarHostURL == "" {
		sonarHostURL = "http://localhost:9000"
	}

	log.Printf("Attempting to fetch SonarQube results for projectKey: '%s' from host: %s", projectKeyForSonar, sonarHostURL)
	sonarIssuesJSON, sonarErr := fetchSonarQubeIssues(projectKeyForSonar, sonarHostURL)
	if sonarErr != nil {
		log.Printf("Failed to fetch SonarQube issues for projectID %s (SonarKey '%s'): %v", projectID, projectKeyForSonar, sonarErr)
		// Not treating this as a fatal error for the clone operation itself; Detekt XML will still be returned.
		// The frontend will simply not find SonarQube data for this scan attempt.
	} else if sonarIssuesJSON != "" {
		_, sonarStoreErr := storeSonarQubeResults(ctx, projectID, sonarIssuesJSON)
		if sonarStoreErr != nil {
			log.Printf("Failed to store SonarQube results for projectID %s: %v", projectID, sonarStoreErr)
		} else {
			log.Printf("Successfully fetched and stored SonarQube results for projectID %s related to SonarKey '%s'", projectID, projectKeyForSonar)
		}
	}
	// --- End of New SonarQube Logic ---

	// The cloneHandler currently returns Detekt XML directly.
	// We will keep this behavior for now to minimize immediate changes to the useCloneMutation hook.
	// The Profile page will be responsible for fetching SonarQube data separately using a new hook.
	c.Data(http.StatusOK, "application/xml", []byte(detektXML))
}

func runAnalysisContainer(repoURL string, sonarProjectKey string) (string, error) {
	tempDir, err := os.MkdirTemp("", "scan-")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir)
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		return "", fmt.Errorf("docker client error: %w", err)
	}

	sonarHostURL := os.Getenv("SONAR_HOST_URL")
	if sonarHostURL == "" {
		sonarHostURL = "http://localhost:9000"
	}

	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: "repo-analyzer:latest",
		Env: []string{
			fmt.Sprintf("REPO_URL=%s", repoURL),
			fmt.Sprintf("SONAR_PROJECT_KEY=%s", sonarProjectKey),
			fmt.Sprintf("SONAR_HOST_URL=%s", sonarHostURL),
		},
		Tty: false,
	}, &container.HostConfig{
		Mounts: []mount.Mount{
			{
				Type:   mount.TypeBind,
				Source: tempDir,
				Target: "/data",
			},
		},
		AutoRemove: true,
	}, nil, nil, "")
	if err != nil {
		return "", fmt.Errorf("failed to create container: %w", err)
	}
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", fmt.Errorf("failed to start container: %w", err)
	}
	statusCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			return "", fmt.Errorf("container wait error: %w", err)
		}
	case <-statusCh:
	}
	reportPath := filepath.Join(tempDir, "detekt-report.xml")
	reportBytes, err := os.ReadFile(reportPath)
	if err != nil {
		return "", fmt.Errorf("failed to read report: %w", err)
	}
	return string(reportBytes), nil
}

func listProjectsHandler(c *gin.Context) {
	session := sessions.Default(c)
	userID := session.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in"})
		return
	}
	ctx := context.Background()
	rows, err := dbPool.Query(ctx, `
        SELECT p.id, p.name, p.url, COALESCE(MAX(dr.detected_at), NULL) AS last_scan
        FROM projects p
        LEFT JOIN detekt_results dr ON dr.project_id = p.id
        WHERE p.user_id = $1
        GROUP BY p.id
        ORDER BY last_scan DESC NULLS LAST
    `, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch projects"})
		return
	}
	defer rows.Close()
	var projects []map[string]interface{}
	for rows.Next() {
		var id, name, url string
		var lastScan *time.Time
		if err := rows.Scan(&id, &name, &url, &lastScan); err != nil {
			continue
		}
		projects = append(projects, map[string]interface{}{
			"id":       id,
			"user_id":  userID,
			"name":     name,
			"url":      url,
			"lastScan": lastScan,
		})
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

func listProjectScansHandler(c *gin.Context) {
	session := sessions.Default(c)
	userID := session.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in"})
		return
	}
	projectId := c.Param("projectId")
	var exists bool
	err := dbPool.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM projects WHERE id=$1 AND user_id=$2)", projectId, userID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	rows, err := dbPool.Query(context.Background(),
		`SELECT id, detected_at FROM detekt_results WHERE project_id = $1 ORDER BY detected_at DESC`, projectId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch scans"})
		return
	}
	defer rows.Close()
	scans := []map[string]interface{}{}
	for rows.Next() {
		var id string
		var detectedAt time.Time
		if err := rows.Scan(&id, &detectedAt); err != nil {
			continue
		}
		scans = append(scans, map[string]interface{}{
			"id":         id,
			"detectedAt": detectedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{"scans": scans})
}

func getScanHandler(c *gin.Context) {
	session := sessions.Default(c)
	userID := session.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in"})
		return
	}
	scanId := c.Param("scanId")
	var detektXML string
	err := dbPool.QueryRow(context.Background(),
		`SELECT dr.detekt_xml
         FROM detekt_results dr
         INNER JOIN projects p ON dr.project_id = p.id
         WHERE dr.id = $1 AND p.user_id = $2`,
		scanId, userID).Scan(&detektXML)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scan not found"})
		return
	}
	c.Data(http.StatusOK, "application/xml", []byte(detektXML))
}

func fetchSonarQubeIssues(projectKey string, sonarHostURL string) (string, error) {
	// Ensure sonarHostURL does not have a trailing slash for clean joining
	sonarHostURL = strings.TrimSuffix(sonarHostURL, "/")

	// The SonarQube API call might take a few moments after the scanner finishes
	// Consider adding a small delay or a more robust polling mechanism if needed.
	// For now, we'll proceed directly. If scans appear empty, a delay might be needed here.
	time.Sleep(10 * time.Second) // Example: uncomment and adjust if needed

	// Construct the API URL for fetching issues.
	// This projectKey MUST match the one used in analyze.sh's sonar-scanner command.
	// Currently, analyze.sh uses "-Dsonar.projectKey=project"
	apiURL := fmt.Sprintf("%s/api/issues/search?componentKeys=%s&resolved=false&ps=500", sonarHostURL, projectKey) // ps=500 to get up to 500 issues
	log.Printf("Fetching SonarQube issues from: %s", apiURL)

	httpClient := &http.Client{Timeout: 45 * time.Second} // Increased timeout
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create SonarQube API request: %w", err)
	}

	// If your SonarQube instance requires authentication (e.g., for private projects or API access)
	sonarToken := os.Getenv("SONAR_API_TOKEN") // Example environment variable for a token
	if sonarToken != "" {
		req.SetBasicAuth(sonarToken, "") // Or req.Header.Set("Authorization", "Bearer " + sonarToken)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute SonarQube API request to %s: %w", apiURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("SonarQube API request to %s failed with status %d: %s", apiURL, resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read SonarQube API response body: %w", err)
	}

	log.Printf("Successfully fetched SonarQube data, length: %d", len(bodyBytes))
	return string(bodyBytes), nil
}

func storeSonarQubeResults(ctx context.Context, projectID string, sonarJSON string) (string, error) {
	var sonarResultID string
	// Storing JSON data in the sonar_xml column
	err := dbPool.QueryRow(ctx,
		`INSERT INTO sonarqube_results (project_id, sonar_xml, detected_at)
         VALUES ($1, $2, $3) RETURNING id`,
		projectID, sonarJSON, time.Now()).Scan(&sonarResultID)
	if err != nil {
		return "", fmt.Errorf("failed to insert SonarQube result into DB: %w", err)
	}
	log.Printf("Stored SonarQube results with ID: %s for project ID: %s", sonarResultID, projectID)
	return sonarResultID, nil
}

// New Handler function:
func getSonarQubeResultsForDetektScanHandler(c *gin.Context) {
	session := sessions.Default(c)
	userIDRaw := session.Get("userID")
	if userIDRaw == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in"})
		return
	}
	userID := userIDRaw.(string)
	scanId := c.Param("scanId")

	var projectID string
	var detektDetectedAt time.Time

	// Step 1: Get the project_id and detected_at for the given detektScanID, ensuring the user owns the project.
	err := dbPool.QueryRow(context.Background(), `
        SELECT dr.project_id, dr.detected_at
        FROM detekt_results dr
        JOIN projects p ON dr.project_id = p.id
        WHERE dr.id = $1 AND p.user_id = $2`, scanId, userID).Scan(&projectID, &detektDetectedAt)

	if err != nil {
		if err.Error() == "no rows in result set" { // pgx.ErrNoRows might not be directly comparable
			c.JSON(http.StatusNotFound, gin.H{"error": "Detekt scan not found or access denied"})
		} else {
			log.Printf("Error fetching detekt scan details for detektScanID %s: %v", scanId, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching detekt scan details"})
		}
		return
	}

	// Step 2: Find a sonarqube_result for that project_id around the same time as the Detekt scan.
	// This heuristic is used because the current schema links sonarqube_results directly to projects,
	// not to a specific detekt_results entry. We look for the closest SonarQube scan.
	var sonarData string
	err = dbPool.QueryRow(context.Background(), `
        SELECT sr.sonar_xml 
        FROM sonarqube_results sr
        WHERE sr.project_id = $1 
          AND sr.detected_at BETWEEN $2::timestamp - interval '15 minutes' AND $2::timestamp + interval '15 minutes' -- Wider window
        ORDER BY ABS(EXTRACT(EPOCH FROM (sr.detected_at - $2::timestamp))) -- Closest one in time
        LIMIT 1`, projectID, detektDetectedAt).Scan(&sonarData)

	if err != nil {
		if err.Error() == "no rows in result set" {
			log.Printf("No corresponding SonarQube scan data found for detektScanID %s (projectID %s, detektTime %s)", scanId, projectID, detektDetectedAt)
			c.JSON(http.StatusNotFound, gin.H{"error": "Corresponding SonarQube scan data not found for this analysis run."})
		} else {
			log.Printf("Error fetching SonarQube data for projectID %s (related to detektScanID %s): %v", projectID, scanId, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch SonarQube scan data"})
		}
		return
	}

	// SonarQube issues data is JSON.
	c.Data(http.StatusOK, "application/json", []byte(sonarData))
}
