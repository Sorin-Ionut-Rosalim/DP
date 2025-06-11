package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
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
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

var dbPool *pgxpool.Pool

// --- STRUCTS FOR PARSING & API RESPONSES ---

type SonarQubeIssuesResponse struct {
	Issues []struct {
		Rule      string `json:"rule"`
		Component string `json:"component"`
	} `json:"issues"`
}
type SonarQubeMeasuresResponse struct {
	Component struct {
		Measures []struct {
			Metric string `json:"metric"`
			Value  string `json:"value"`
		} `json:"measures"`
	} `json:"component"`
}
type SonarMetrics struct {
	LinesOfCode, MaintainabilityRating, CognitiveComplexity             int
	BlockerIssues, CriticalIssues, MajorIssues, MinorIssues, InfoIssues int
	CodeSmells, Bugs, Vulnerabilities                                   int
}

type DetektReport struct {
	XMLName xml.Name `xml:"checkstyle"`
	Files   []struct {
		Name   string  `xml:"name,attr"`
		Errors []Error `xml:"error"`
	} `xml:"file"`
}
type Error struct {
	Severity string `xml:"severity,attr"`
	Source   string `xml:"source,attr"`
}
type DetektCounts struct {
	ErrorIssues, WarningIssues, InfoIssues int
}

type TrendData struct {
	ScanID                string    `json:"scan_id"`
	DetectedAt            time.Time `json:"detected_at"`
	MaintainabilityRating *int      `json:"maintainability_rating"`
	CognitiveComplexity   *int      `json:"cognitive_complexity"`
	TotalDetektIssues     int       `json:"total_detekt_issues"`
	TotalSonarIssues      int       `json:"total_sonar_issues"`
	BlockerIssues         int       `json:"blocker_issues"`
	CriticalIssues        int       `json:"critical_issues"`
	MajorIssues           int       `json:"major_issues"`
}
type RuleBreakdown struct {
	RuleName   string `json:"rule_name"`
	IssueCount int    `json:"issue_count"`
}
type FileBreakdown struct {
	FileName   string `json:"file_name"`
	IssueCount int    `json:"issue_count"`
}
type LatestScanDistribution struct {
	Bugs            int `json:"bugs"`
	Vulnerabilities int `json:"vulnerabilities"`
	CodeSmells      int `json:"code_smells"`
}
type AnalyticsResponse struct {
	TrendData         []TrendData            `json:"trend_data"`
	LatestScanData    LatestScanDistribution `json:"latest_scan_data"`
	LatestSonarRules  []RuleBreakdown        `json:"latest_sonar_rules"`
	LatestDetektRules []RuleBreakdown        `json:"latest_detekt_rules"`
	LatestNoisyFiles  []FileBreakdown        `json:"latest_noisy_files"`
}

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

	protected := r.Group("/")
	protected.Use(authMiddleware())
	{
		protected.GET("/api/portfolio", portfolioHandler)
		protected.POST("/api/scan", runScanHandler)
		protected.GET("/api/projects", listProjectsHandler)
		protected.GET("/api/project/:projectId/scans", listProjectScansHandler)
		protected.GET("/api/scan/:scanId/detekt", getDetektResultByScanHandler)
		protected.GET("/api/scan/:scanId/sonarqube", getSonarQubeIssuesByScanHandler)
		protected.GET("/api/projects/:id/analytics", getProjectAnalyticsHandler)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	fmt.Printf("Starting server on port %s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		userID := session.Get("userID")
		if userID == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not logged in"})
			return
		}
		c.Set("userID", userID)
		c.Next()
	}
}

func ratingToNumber(rating string) int {
	switch rating {
	case "A":
		return 1
	case "B":
		return 2
	case "C":
		return 3
	case "D":
		return 4
	case "E":
		return 5
	default:
		return 0
	}
}

func parseSonarQubeMeasures(jsonContent string) (SonarMetrics, error) {
	var response SonarQubeMeasuresResponse
	if err := json.Unmarshal([]byte(jsonContent), &response); err != nil {
		return SonarMetrics{}, fmt.Errorf("failed to unmarshal sonarqube measures: %w", err)
	}

	var metrics SonarMetrics
	for _, measure := range response.Component.Measures {
		switch measure.Metric {
		case "ncloc":
			metrics.LinesOfCode, _ = strconv.Atoi(measure.Value)
		case "sqale_rating":
			metrics.MaintainabilityRating = ratingToNumber(measure.Value)
		case "cognitive_complexity":
			metrics.CognitiveComplexity, _ = strconv.Atoi(measure.Value)
		case "blocker_violations":
			metrics.BlockerIssues, _ = strconv.Atoi(measure.Value)
		case "critical_violations":
			metrics.CriticalIssues, _ = strconv.Atoi(measure.Value)
		case "major_violations":
			metrics.MajorIssues, _ = strconv.Atoi(measure.Value)
		case "minor_violations":
			metrics.MinorIssues, _ = strconv.Atoi(measure.Value)
		case "info_violations":
			metrics.InfoIssues, _ = strconv.Atoi(measure.Value)
		case "code_smells":
			metrics.CodeSmells, _ = strconv.Atoi(measure.Value)
		case "bugs":
			metrics.Bugs, _ = strconv.Atoi(measure.Value)
		case "vulnerabilities":
			metrics.Vulnerabilities, _ = strconv.Atoi(measure.Value)
		}
	}
	return metrics, nil
}

func parseDetektReport(xmlContent string) (DetektCounts, error) {
	var report DetektReport
	if err := xml.Unmarshal([]byte(xmlContent), &report); err != nil {
		return DetektCounts{}, fmt.Errorf("failed to unmarshal detekt report: %w", err)
	}

	var counts DetektCounts
	for _, file := range report.Files {
		for _, err := range file.Errors {
			switch err.Severity {
			case "error":
				counts.ErrorIssues++
			case "warning":
				counts.WarningIssues++
			case "info":
				counts.InfoIssues++
			}
		}
	}
	return counts, nil
}

func registerHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data."})
		return
	}
	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters."})
		return
	}
	ctx := context.Background()
	var existingID string
	err := dbPool.QueryRow(ctx, "SELECT id FROM users WHERE username=$1", req.Username).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists."})
		return
	}
	hashBytes, hashErr := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if hashErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error hashing password."})
		return
	}
	_, insertErr := dbPool.Exec(ctx,
		"INSERT INTO users (username, password) VALUES ($1, $2)",
		req.Username, string(hashBytes))
	if insertErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user."})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Session save error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Logged in successfully"})
}

func logoutHandler(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Logout error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func portfolioHandler(c *gin.Context) {
	userID, _ := c.Get("userID")
	ctx := context.Background()
	var username string
	err := dbPool.QueryRow(ctx, "SELECT username FROM users WHERE id=$1", userID.(string)).Scan(&username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": userID, "username": username})
}

func createScan(ctx context.Context, projectID, userID string) (string, error) {
	var scanID string
	err := dbPool.QueryRow(ctx, `
        INSERT INTO scans (project_id, user_id, started_at) VALUES ($1, $2, NOW()) RETURNING id
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

	userID, _ := c.Get("userID")

	ctx := context.Background()
	var projectID string
	parts := strings.Split(strings.TrimSuffix(req.RepoURL, ".git"), "/")
	projectName := parts[len(parts)-1]

	err := dbPool.QueryRow(ctx, "SELECT id FROM projects WHERE user_id = $1 AND url = $2", userID.(string), req.RepoURL).Scan(&projectID)
	if err != nil {
		err2 := dbPool.QueryRow(ctx,
			`INSERT INTO projects (user_id, name, url) VALUES ($1, $2, $3) RETURNING id`,
			userID.(string), projectName, req.RepoURL).Scan(&projectID)
		if err2 != nil {
			log.Printf("Error inserting new project %s: %v", projectName, err2)
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Could not save project"})
			return
		}
	}

	scanID, err := createScan(ctx, projectID, userID.(string))
	if err != nil {
		log.Printf("Failed to create scan entry: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Could not create scan"})
		return
	}

	projectKeyForSonar := fmt.Sprintf("proj_%s_%s", userID.(string), projectID)

	detektXML, sonarIssuesJSON, sonarMeasuresJSON, err := runAnalysisContainerAndFetchResults(req.RepoURL, projectKeyForSonar)
	if err != nil {
		log.Printf("Scan failed for %s: %v", req.RepoURL, err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Analysis failed", "details": err.Error()})
		return
	}

	if detektXML != "" {
		detektCounts, detektParseErr := parseDetektReport(detektXML)
		if detektParseErr != nil {
			log.Printf("Warning: Failed to parse Detekt XML for scan %s: %v", scanID, detektParseErr)
		} else {
			_, err = dbPool.Exec(ctx, `
                INSERT INTO detekt_results (scan_id, detekt_xml, error_issues, warning_issues, info_issues)
                VALUES ($1, $2, $3, $4, $5)`,
				scanID, detektXML, detektCounts.ErrorIssues, detektCounts.WarningIssues, detektCounts.InfoIssues,
			)
			if err != nil {
				log.Printf("Failed to insert detekt result for scanID %s: %v", scanID, err)
			}
		}
	}

	if sonarMeasuresJSON != "" && sonarIssuesJSON != "" {
		sonarMetrics, sonarParseErr := parseSonarQubeMeasures(sonarMeasuresJSON)
		if sonarParseErr != nil {
			log.Printf("Warning: Failed to parse SonarQube measures for scan %s: %v", scanID, sonarParseErr)
		} else {
			_, err = dbPool.Exec(ctx, `
                INSERT INTO sonarqube_results (scan_id, sonar_json, blocker_issues, critical_issues, major_issues, minor_issues, info_issues, code_smells, bugs, vulnerabilities)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
				scanID, sonarIssuesJSON, sonarMetrics.BlockerIssues, sonarMetrics.CriticalIssues,
				sonarMetrics.MajorIssues, sonarMetrics.MinorIssues, sonarMetrics.InfoIssues, sonarMetrics.CodeSmells,
				sonarMetrics.Bugs, sonarMetrics.Vulnerabilities,
			)
			if err != nil {
				log.Printf("Failed to insert sonarqube_results for scanID %s: %v", scanID, err)
			}
			_, err = dbPool.Exec(ctx, `
                UPDATE scans SET lines_of_code = $1, maintainability_rating = $2, cognitive_complexity = $3
                WHERE id = $4`,
				sonarMetrics.LinesOfCode, sonarMetrics.MaintainabilityRating, sonarMetrics.CognitiveComplexity, scanID,
			)
			if err != nil {
				log.Printf("Failed to update scans table for scanID %s: %v", scanID, err)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"scanId": scanID})
}

func runAnalysisContainerAndFetchResults(repoURL, sonarProjectKey string) (string, string, string, error) {
	tempDir, err := os.MkdirTemp("", "scan-")
	if err != nil {
		return "", "", "", fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir)

	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return "", "", "", fmt.Errorf("docker client error: %w", err)
	}
	defer cli.Close()

	sonarScannerHostURL := os.Getenv("SONAR_HOST_URL")
	if sonarScannerHostURL == "" {
		sonarScannerHostURL = "http://host.docker.internal:9000"
	}
	sonarToken := os.Getenv("SONAR_TOKEN")

	log.Printf("Starting analysis container for project key: %s", sonarProjectKey)

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
		Mounts:     []mount.Mount{{Type: mount.TypeBind, Source: tempDir, Target: "/data"}},
		AutoRemove: true,
	}, nil, nil, "")
	if err != nil {
		return "", "", "", fmt.Errorf("failed to create container: %w", err)
	}

	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", "", "", fmt.Errorf("failed to start container: %w", err)
	}

	logReader, err := cli.ContainerLogs(ctx, resp.ID, container.LogsOptions{ShowStdout: true, ShowStderr: true, Follow: true})
	if err != nil {
		log.Printf("Error getting container logs: %v", err)
	} else {
		defer logReader.Close()
		go func() {
			stdcopy.StdCopy(os.Stdout, os.Stderr, logReader)
		}()
	}

	log.Printf("Analysis container %s started. Waiting for completion...", resp.ID[:12])
	statusCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			return "", "", "", fmt.Errorf("container execution error: %w", err)
		}
	case status := <-statusCh:
		if status.StatusCode != 0 {
			return "", "", "", fmt.Errorf("analysis container exited with non-zero status: %d", status.StatusCode)
		}
		log.Printf("Container %s finished successfully.", resp.ID[:12])
	}

	reportPath := filepath.Join(tempDir, "detekt-report.xml")
	detektBytes, err := os.ReadFile(reportPath)
	if err != nil {
		log.Printf("Warning: Could not read Detekt report file: %v", err)
	}

	sonarHostURL := "http://localhost:9000"
	apiToken := os.Getenv("SONAR_API_TOKEN")
	if apiToken == "" {
		log.Println("Warning: SONAR_API_TOKEN is not set. Falling back to SONAR_TOKEN. This may cause permission issues.")
		apiToken = sonarToken
	}

	log.Printf("Waiting for SonarQube to process analysis for %s...", sonarProjectKey)
	if err := waitForSonarQubeAnalysis(sonarProjectKey, sonarHostURL, apiToken, 90*time.Second); err != nil {
		log.Printf("Warning: %v", err)
	}

	log.Printf("Fetching SonarQube issues and measures for %s...", sonarProjectKey)
	sonarIssuesJSON, issuesErr := fetchSonarQubeAPI(sonarProjectKey, sonarHostURL, apiToken, "api/issues/search")
	sonarMeasuresJSON, measuresErr := fetchSonarQubeAPI(sonarProjectKey, sonarHostURL, apiToken, "api/measures/component")

	if issuesErr != nil {
		log.Printf("Warning: Could not fetch SonarQube issues: %v", issuesErr)
	}
	if measuresErr != nil {
		log.Printf("Warning: Could not fetch SonarQube measures: %v", measuresErr)
	}

	return string(detektBytes), sonarIssuesJSON, sonarMeasuresJSON, nil
}

func fetchSonarQubeAPI(projectKey, sonarHostURL, sonarToken, endpoint string) (string, error) {
	sonarHostURL = strings.TrimSuffix(sonarHostURL, "/")

	var apiURL string
	if endpoint == "api/issues/search" {
		apiURL = fmt.Sprintf("%s/api/issues/search?componentKeys=%s&s=FILE_LINE&resolved=false&ps=500&facets=severities,types&additionalFields=_all", sonarHostURL, projectKey)
	} else if endpoint == "api/measures/component" {
		apiURL = fmt.Sprintf("%s/api/measures/component?component=%s&metricKeys=ncloc,sqale_rating,cognitive_complexity,blocker_violations,critical_violations,major_violations,minor_violations,info_violations,code_smells,bugs,vulnerabilities", sonarHostURL, projectKey)
	} else {
		return "", fmt.Errorf("unknown sonarqube endpoint: %s", endpoint)
	}

	httpClient := &http.Client{Timeout: 45 * time.Second}
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create SonarQube API request: %w", err)
	}

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

	return string(bodyBytes), nil
}

func waitForSonarQubeAnalysis(projectKey, sonarHostURL, sonarToken string, timeout time.Duration) error {
	sonarHostURL = strings.TrimSuffix(sonarHostURL, "/")
	apiURL := fmt.Sprintf("%s/api/project_analyses/search?project=%s&ps=1", sonarHostURL, projectKey)
	start := time.Now()

	for {
		if time.Since(start) > timeout {
			return fmt.Errorf("timed out waiting for SonarQube analysis")
		}

		req, _ := http.NewRequest("GET", apiURL, nil)
		if sonarToken != "" {
			req.SetBasicAuth(sonarToken, "")
		}

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			log.Printf("waitForSonarQubeAnalysis: http error: %v, retrying...", err)
			time.Sleep(5 * time.Second)
			continue
		}

		if resp.StatusCode == http.StatusOK {
			var body struct {
				Analyses []struct {
					Date time.Time `json:"date"`
				} `json:"analyses"`
			}
			data, _ := io.ReadAll(resp.Body)
			json.Unmarshal(data, &body)
			resp.Body.Close()

			if len(body.Analyses) > 0 {
				if body.Analyses[0].Date.After(start.Add(-15 * time.Second)) {
					log.Printf("SonarQube analysis for %s detected.", projectKey)
					return nil
				}
			}
		} else {
			resp.Body.Close()
		}

		log.Printf("Waiting for new analysis for %s...", projectKey)
		time.Sleep(5 * time.Second)
	}
}

func listProjectsHandler(c *gin.Context) {
	userID, _ := c.Get("userID")
	ctx := context.Background()
	rows, err := dbPool.Query(ctx, `
        SELECT p.id, p.name, p.url, COALESCE(MAX(s.started_at), NULL) AS last_scan
        FROM projects p
        LEFT JOIN scans s ON s.project_id = p.id
        WHERE p.user_id = $1
        GROUP BY p.id
        ORDER BY last_scan DESC NULLS LAST
    `, userID.(string))
	if err != nil {
		log.Println("listProjectsHandler DB error:", err)
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
			"user_id":  userID.(string),
			"name":     name,
			"url":      url,
			"lastScan": lastScan,
		})
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

func listProjectScansHandler(c *gin.Context) {
	userID, _ := c.Get("userID")
	projectId := c.Param("projectId")

	var exists bool
	err := dbPool.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM projects WHERE id=$1 AND user_id=$2)", projectId, userID.(string)).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	query := `
		SELECT
			s.id,
			s.started_at,
			(COALESCE(dr.error_issues, 0) + COALESCE(dr.warning_issues, 0) + COALESCE(dr.info_issues, 0)) as detekt_issue_count,
			(COALESCE(sq.blocker_issues, 0) + COALESCE(sq.critical_issues, 0) + COALESCE(sq.major_issues, 0) + COALESCE(sq.minor_issues, 0) + COALESCE(sq.info_issues, 0)) as sonar_issue_count
		FROM scans s
		LEFT JOIN detekt_results dr ON s.id = dr.scan_id
		LEFT JOIN sonarqube_results sq ON s.id = sq.scan_id
		WHERE s.project_id = $1 AND s.user_id = $2
		ORDER BY s.started_at DESC;
	`
	rows, err := dbPool.Query(context.Background(), query, projectId, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch scans"})
		return
	}
	defer rows.Close()

	scans := []map[string]interface{}{}
	for rows.Next() {
		var id string
		var startedAt time.Time
		var detektIssueCount, sonarIssueCount int
		if err := rows.Scan(&id, &startedAt, &detektIssueCount, &sonarIssueCount); err != nil {
			log.Printf("Error scanning project scans row: %v", err)
			continue
		}
		scans = append(scans, map[string]interface{}{
			"id":                 id,
			"detectedAt":         startedAt.Format(time.RFC3339Nano),
			"detekt_issue_count": detektIssueCount,
			"sonar_issue_count":  sonarIssueCount,
		})
	}
	c.JSON(http.StatusOK, gin.H{"scans": scans})
}

func getDetektResultByScanHandler(c *gin.Context) {
	userID, _ := c.Get("userID")
	scanId := c.Param("scanId")
	var detektXML string
	err := dbPool.QueryRow(context.Background(),
		`SELECT dr.detekt_xml
         FROM detekt_results dr
         INNER JOIN scans s ON dr.scan_id = s.id
         WHERE dr.scan_id = $1 AND s.user_id = $2`,
		scanId, userID.(string)).Scan(&detektXML)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scan not found"})
		return
	}
	c.Data(http.StatusOK, "application/xml", []byte(detektXML))
}

func getSonarQubeIssuesByScanHandler(c *gin.Context) {
	userID, _ := c.Get("userID")
	scanId := c.Param("scanId")
	var sonarData string
	err := dbPool.QueryRow(context.Background(),
		`SELECT sr.sonar_json
         FROM sonarqube_results sr
         INNER JOIN scans s ON sr.scan_id = s.id
         WHERE sr.scan_id = $1 AND s.user_id = $2`,
		scanId, userID.(string)).Scan(&sonarData)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "SonarQube scan not found"})
		return
	}
	var sonarRaw map[string]interface{}
	if err := json.Unmarshal([]byte(sonarData), &sonarRaw); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not parse SonarQube JSON"})
		return
	}
	c.JSON(http.StatusOK, sonarRaw)
}

func getProjectAnalyticsHandler(c *gin.Context) {
	userID, _ := c.Get("userID")
	projectID := c.Param("id")
	var response AnalyticsResponse

	trendQuery := `
		SELECT
			s.id as scan_id, s.started_at as detected_at,
			s.maintainability_rating, s.cognitive_complexity,
			(COALESCE(dr.error_issues, 0) + COALESCE(dr.warning_issues, 0) + COALESCE(dr.info_issues, 0)) as total_detekt_issues,
			(COALESCE(sq.blocker_issues, 0) + COALESCE(sq.critical_issues, 0) + COALESCE(sq.major_issues, 0) + COALESCE(sq.minor_issues, 0) + COALESCE(sq.info_issues, 0)) as total_sonar_issues,
            COALESCE(sq.blocker_issues, 0) as blocker_issues,
            COALESCE(sq.critical_issues, 0) as critical_issues,
            COALESCE(sq.major_issues, 0) as major_issues
		FROM scans s
		LEFT JOIN detekt_results dr ON s.id = dr.scan_id
		LEFT JOIN sonarqube_results sq ON s.id = sq.scan_id
		WHERE s.project_id = $1 AND s.user_id = $2 ORDER BY s.started_at ASC;
	`
	rows, err := dbPool.Query(context.Background(), trendQuery, projectID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query trend data"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var scan TrendData
		err := rows.Scan(
			&scan.ScanID, &scan.DetectedAt, &scan.MaintainabilityRating, &scan.CognitiveComplexity,
			&scan.TotalDetektIssues, &scan.TotalSonarIssues,
			&scan.BlockerIssues, &scan.CriticalIssues, &scan.MajorIssues,
		)
		if err != nil {
			log.Printf("Error scanning trend data row: %v", err)
			continue
		}
		response.TrendData = append(response.TrendData, scan)
	}

	var latestSonarJson sql.NullString
	var latestDetektXml sql.NullString
	err = dbPool.QueryRow(context.Background(), `
        SELECT sq.sonar_json, dr.detekt_xml,
               COALESCE(sq.bugs, 0), COALESCE(sq.vulnerabilities, 0), COALESCE(sq.code_smells, 0)
        FROM scans s
        LEFT JOIN sonarqube_results sq on s.id = sq.scan_id
        LEFT JOIN detekt_results dr on s.id = dr.scan_id
        WHERE s.project_id = $1 AND s.user_id = $2 ORDER BY s.started_at DESC LIMIT 1
    `, projectID, userID.(string)).Scan(
		&latestSonarJson, &latestDetektXml,
		&response.LatestScanData.Bugs, &response.LatestScanData.Vulnerabilities, &response.LatestScanData.CodeSmells,
	)

	if err != nil && err != pgx.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query latest scan data"})
		return
	}

	if latestSonarJson.Valid {
		response.LatestSonarRules, response.LatestNoisyFiles = parseSonarIssuesForTop5(latestSonarJson.String)
	}
	if latestDetektXml.Valid {
		response.LatestDetektRules, _ = parseDetektReportForTop5(latestDetektXml.String)
	}

	c.JSON(http.StatusOK, response)
}

func parseSonarIssuesForTop5(jsonContent string) ([]RuleBreakdown, []FileBreakdown) {
	var response SonarQubeIssuesResponse
	json.Unmarshal([]byte(jsonContent), &response)

	ruleCounts := make(map[string]int)
	fileCounts := make(map[string]int)

	for _, issue := range response.Issues {
		ruleCounts[issue.Rule]++
		fileCounts[issue.Component]++
	}

	var sonarRules []RuleBreakdown
	for rule, count := range ruleCounts {
		sonarRules = append(sonarRules, RuleBreakdown{RuleName: rule, IssueCount: count})
	}
	sort.Slice(sonarRules, func(i, j int) bool { return sonarRules[i].IssueCount > sonarRules[j].IssueCount })
	if len(sonarRules) > 5 {
		sonarRules = sonarRules[:5]
	}

	var noisyFiles []FileBreakdown
	for file, count := range fileCounts {
		parts := strings.Split(file, ":")
		cleanName := file
		if len(parts) > 1 {
			cleanName = parts[1]
		}
		noisyFiles = append(noisyFiles, FileBreakdown{FileName: cleanName, IssueCount: count})
	}
	sort.Slice(noisyFiles, func(i, j int) bool { return noisyFiles[i].IssueCount > noisyFiles[j].IssueCount })
	if len(noisyFiles) > 5 {
		noisyFiles = noisyFiles[:5]
	}

	return sonarRules, noisyFiles
}

func parseDetektReportForTop5(xmlContent string) ([]RuleBreakdown, []FileBreakdown) {
	var report DetektReport
	xml.Unmarshal([]byte(xmlContent), &report)

	ruleCounts := make(map[string]int)
	for _, file := range report.Files {
		for _, err := range file.Errors {
			ruleCounts[err.Source]++
		}
	}

	var detektRules []RuleBreakdown
	for rule, count := range ruleCounts {
		cleanRule := strings.Replace(rule, "detekt.", "", 1)
		detektRules = append(detektRules, RuleBreakdown{RuleName: cleanRule, IssueCount: count})
	}
	sort.Slice(detektRules, func(i, j int) bool { return detektRules[i].IssueCount > detektRules[j].IssueCount })
	if len(detektRules) > 5 {
		detektRules = detektRules[:5]
	}
	return detektRules, []FileBreakdown{}
}
