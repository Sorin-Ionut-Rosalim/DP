package main

import (
	"context"
	"encoding/json"
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
	"github.com/docker/docker/pkg/stdcopy"
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
	r.POST("/api/scan", runScanHandler)
	r.GET("/api/projects", listProjectsHandler)
	r.GET("/api/project/:projectId/scans", listProjectScansHandler)
	r.GET("/api/scan/:scanId/detekt", getDetektResultByScanHandler)
	r.GET("/api/scan/:scanId/sonarqube", getSonarQubeResultByScanHandler)

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

// --------------- (scan and results) ------------

func createScan(ctx context.Context, projectID, userID string) (string, error) {
	var scanID string
	err := dbPool.QueryRow(ctx, `
		INSERT INTO scans (project_id, user_id) VALUES ($1, $2) RETURNING id
	`, projectID, userID).Scan(&scanID)
	return scanID, err
}

func runScanHandler(c *gin.Context) {
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
	if err != nil {
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

	// Create a scan entry (this is the unique "run" id)
	scanID, err := createScan(ctx, projectID, userID.(string))
	if err != nil {
		log.Printf("Failed to create scan entry: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Could not create scan"})
		return
	}

	projectKeyForSonar := fmt.Sprintf("proj_%s_%s", userID, projectID)

	// Run Analysis
	detektXML, err := runAnalysisContainer(req.RepoURL, projectKeyForSonar)
	if err != nil {
		log.Printf("Scan failed (runAnalysisContainer) for %s: %v", req.RepoURL, err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Detekt scan failed", "details": err.Error()})
		return
	}

	// Store Detekt Results for this scan
	_, err = dbPool.Exec(ctx, `
        INSERT INTO detekt_results (scan_id, detekt_xml, detected_at)
        VALUES ($1, $2, $3)
    `, scanID, detektXML, time.Now())
	if err != nil {
		log.Printf("Failed to insert detekt result for scanID %s: %v", scanID, err)
	} else {
		log.Printf("Successfully stored Detekt results for scanID %s", scanID)
	}

	// --- Fetch and Store SonarQube Results ---
	sonarHostURL := os.Getenv("SONAR_HOST_URL")
	if sonarHostURL == "" {
		sonarHostURL = "http://localhost:9000"
	}

	log.Printf("Attempting to fetch SonarQube results for projectKey: '%s' from host: %s", projectKeyForSonar, sonarHostURL)
	sonarIssuesJSON, sonarErr := fetchSonarQubeIssues(projectKeyForSonar, sonarHostURL)
	if sonarErr != nil {
		log.Printf("Failed to fetch SonarQube issues for scanID %s: %v", scanID, sonarErr)
	} else if sonarIssuesJSON != "" {
		_, sonarStoreErr := dbPool.Exec(ctx, `
			INSERT INTO sonarqube_results (scan_id, sonar_xml, detected_at)
			VALUES ($1, $2, $3)
		`, scanID, sonarIssuesJSON, time.Now())
		if sonarStoreErr != nil {
			log.Printf("Failed to store SonarQube results for scanID %s: %v", scanID, sonarStoreErr)
		} else {
			log.Printf("Successfully fetched and stored SonarQube results for scanID %s", scanID)
		}
	}

	// Return the scan id so the frontend can fetch both results
	c.JSON(http.StatusOK, gin.H{"scanId": scanID})
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

	sonarScannerHostURL := os.Getenv("SONAR_HOST_URL")
	if sonarScannerHostURL == "" {
		sonarScannerHostURL = "http://host.docker.internal:9000"
	}

	sonarToken := os.Getenv("SONAR_TOKEN")

	// Get the SonarQube token for the scanner
	sonarScannerToken := os.Getenv("SONAR_LOGIN_TOKEN") // From backend's environment
	if sonarScannerToken == "" {
		log.Println("Warning: SONAR_LOGIN_TOKEN is not set in the backend environment. SonarScanner might fail if authentication is required.")
	}

	log.Printf("Starting analysis container with SONAR_PROJECT_KEY: %s and target Sonar Host for scanner: %s", sonarProjectKey, sonarScannerHostURL)

	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: "repo-analyzer:latest",
		Env: []string{
			fmt.Sprintf("REPO_URL=%s", repoURL),
			fmt.Sprintf("SONAR_PROJECT_KEY=%s", sonarProjectKey),
			fmt.Sprintf("SONAR_HOST_URL=%s", sonarScannerHostURL),
			fmt.Sprintf("SONAR_TOKEN=%s", sonarToken),
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

	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", fmt.Errorf("failed to start container: %w", err)
	}

	// --- Add Log Reading ---
	logReader, errLog := cli.ContainerLogs(ctx, resp.ID, container.LogsOptions{ShowStdout: true, ShowStderr: true, Follow: false, Timestamps: false})
	if errLog != nil {
		log.Printf("Error setting up container log reader for %s: %v", resp.ID, errLog)
		// Continue without live log streaming if setup fails, will attempt to read after stop
	}
	if logReader != nil { // Close it eventually
		defer logReader.Close()
	}

	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		// If start fails, attempt to remove the container to prevent orphans
		_ = cli.ContainerRemove(context.Background(), resp.ID, container.RemoveOptions{Force: true})
		return "", fmt.Errorf("failed to start container %s: %w", resp.ID, err)
	}

	log.Printf("Analysis container %s started. Waiting for completion...", resp.ID)

	statusCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
	var statusCode int64 = -1 // Default to error status

	select {
	case errWait := <-errCh:
		if errWait != nil {
			log.Printf("Container %s wait error: %v", resp.ID, errWait)
			// Attempt to get logs even on wait error
			// Note: logReader might be nil if errLog above was not nil
			if logReader != nil {
				logBufferOut := new(strings.Builder)
				logBufferErr := new(strings.Builder)
				_, _ = stdcopy.StdCopy(logBufferOut, logBufferErr, logReader) // Drain logs
				if logBufferOut.Len() > 0 {
					log.Printf("Container %s Stdout on WaitError:\n%s", resp.ID, logBufferOut.String())
				}
				if logBufferErr.Len() > 0 {
					log.Printf("Container %s Stderr on WaitError:\n%s", resp.ID, logBufferErr.String())
				}
			}
			return "", fmt.Errorf("container %s execution error: %w", resp.ID, errWait)
		}
		log.Printf("Container %s finished (error channel indicated completion without error, but check status code)", resp.ID)
		// This path might be taken if an error occurred but was not a 'wait' error.
		// We need the actual status from statusCh.
	case status := <-statusCh:
		statusCode = status.StatusCode
		log.Printf("Container %s finished with status code: %d", resp.ID, statusCode)
		// Read logs after successful completion or known exit code
		if logReader != nil {
			logBufferOut := new(strings.Builder)
			logBufferErr := new(strings.Builder)
			_, errCopy := stdcopy.StdCopy(logBufferOut, logBufferErr, logReader)
			if errCopy != nil && errCopy != io.EOF { // EOF is expected
				log.Printf("Error copying container %s logs: %v", resp.ID, errCopy)
			}
			if logBufferOut.Len() > 0 {
				log.Printf("Container %s Stdout:\n%s", resp.ID, logBufferOut.String())
			}
			if logBufferErr.Len() > 0 {
				log.Printf("Container %s Stderr:\n%s", resp.ID, logBufferErr.String())
			}
		}
		if statusCode != 0 {
			return "", fmt.Errorf("analysis container %s exited with non-zero status: %d", resp.ID, statusCode)
		}
	}
	// Ensure the file exists and handle errors before reading
	reportPath := filepath.Join(tempDir, "detekt-report.xml")
	if _, errStat := os.Stat(reportPath); os.IsNotExist(errStat) {
		log.Printf("Detekt report file not found at %s after container run.", reportPath)
		return "", fmt.Errorf("detekt report file not found at %s", reportPath)
	}

	reportBytes, errRead := os.ReadFile(reportPath)
	if errRead != nil {
		return "", fmt.Errorf("failed to read detekt report from %s: %w", reportPath, errRead)
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

	// Check ownership
	var exists bool
	err := dbPool.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM projects WHERE id=$1 AND user_id=$2)", projectId, userID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	rows, err := dbPool.Query(context.Background(),
		`SELECT id, started_at FROM scans WHERE project_id = $1 ORDER BY started_at DESC`, projectId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch scans"})
		return
	}
	defer rows.Close()
	scans := []map[string]interface{}{}
	for rows.Next() {
		var id string
		var startedAt time.Time
		if err := rows.Scan(&id, &startedAt); err != nil {
			continue
		}
		scans = append(scans, map[string]interface{}{
			"id":        id,
			"startedAt": startedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{"scans": scans})
}

func getDetektResultByScanHandler(c *gin.Context) {
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
         INNER JOIN scans s ON dr.scan_id = s.id
         WHERE dr.scan_id = $1 AND s.user_id = $2`,
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
	apiURL := fmt.Sprintf(
		"%s/api/issues/search?componentKeys=%s&resolved=false&ps=500&s=FILE_LINE&asc=true&f=key,rule,severity,component,project,line,message,status,creationDate,type",
		sonarHostURL,
		projectKey,
	)
	log.Printf("Fetching SonarQube issues from (enhanced URL): %s", apiURL)

	httpClient := &http.Client{Timeout: 45 * time.Second} // Increased timeout
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create SonarQube API request: %w", err)
	}

	sonarToken := os.Getenv("SONAR_API_TOKEN")
	if sonarToken != "" {
		req.SetBasicAuth(sonarToken, "")
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
func getSonarQubeResultByScanHandler(c *gin.Context) {
	session := sessions.Default(c)
	userID := session.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in"})
		return
	}
	scanId := c.Param("scanId")
	var sonarData string
	err := dbPool.QueryRow(context.Background(),
		`SELECT sr.sonar_xml
         FROM sonarqube_results sr
         INNER JOIN scans s ON sr.scan_id = s.id
         WHERE sr.scan_id = $1 AND s.user_id = $2`,
		scanId, userID).Scan(&sonarData)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SonarQube scan not found"})
		return
	}
	c.Data(http.StatusOK, "application/json", []byte(sonarData))
}

func waitForSonarAnalysis(projectKey string, sonarHostURL string, timeout time.Duration) error {
	startTime := time.Now()
	sonarHostURL = strings.TrimSuffix(sonarHostURL, "/")
	// This API endpoint shows the latest analyses for a project.
	analysisStatusURL := fmt.Sprintf("%s/api/project_analyses/search?project=%s&ps=1", sonarHostURL, projectKey)
	scanSubmissionTime := time.Now().Add(-15 * time.Second) // Estimate submission time slightly before polling starts

	log.Printf("Waiting up to %v for SonarQube analysis to complete for projectKey: %s", timeout, projectKey)

	for {
		if time.Since(startTime) > timeout {
			return fmt.Errorf("timeout waiting for SonarQube analysis to complete for projectKey %s after %v", projectKey, timeout)
		}

		time.Sleep(8 * time.Second) // Poll every 8 seconds

		httpClient := &http.Client{Timeout: 20 * time.Second}
		req, err := http.NewRequest("GET", analysisStatusURL, nil)
		if err != nil {
			log.Printf("Error creating request for SonarQube analysis status: %v", err)
			continue
		}

		sonarToken := os.Getenv("SONAR_API_TOKEN")
		if sonarToken != "" {
			req.SetBasicAuth(sonarToken, "")
		}

		resp, err := httpClient.Do(req)
		if err != nil {
			log.Printf("Error polling SonarQube analysis status for %s: %v", projectKey, err)
			continue
		}

		bodyBytes, readErr := io.ReadAll(resp.Body)
		resp.Body.Close() // Ensure body is closed

		if readErr != nil {
			log.Printf("Error reading SonarQube analysis status response body for %s: %v", projectKey, readErr)
			continue
		}

		if resp.StatusCode == http.StatusOK {
			var result struct {
				Analyses []struct {
					Date time.Time `json:"date"`
				} `json:"analyses"`
			}
			if err := json.Unmarshal(bodyBytes, &result); err == nil && len(result.Analyses) > 0 {
				latestAnalysisDate := result.Analyses[0].Date
				log.Printf("Polling SonarQube: Latest analysis for %s dated %s. Scan submitted around %s.", projectKey, latestAnalysisDate, scanSubmissionTime)
				// Check if the latest analysis is recent enough
				if latestAnalysisDate.After(scanSubmissionTime) {
					log.Printf("SonarQube analysis for projectKey %s appears to be complete.", projectKey)
					// Add a small extra delay for issues to be fully processed and available via API
					time.Sleep(5 * time.Second)
					return nil
				}
			} else if err != nil {
				log.Printf("Error unmarshalling SonarQube analysis status for %s: %v. Body: %s", projectKey, err, string(bodyBytes))
			} else {
				log.Printf("SonarQube analysis status for %s: No analyses found yet or empty response. Body: %s", projectKey, string(bodyBytes))
			}
		} else {
			log.Printf("SonarQube analysis status API for %s returned status %d. Body: %s", projectKey, resp.StatusCode, string(bodyBytes))
		}
	}
}
