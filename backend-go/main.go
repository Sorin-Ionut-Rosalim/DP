package main

import (
	"context"
	"fmt"
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
	r.GET("/api/scan/:scanId", getScanHandler)

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
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request"})
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
	err := dbPool.QueryRow(ctx, "SELECT id FROM projects WHERE user_id = $1 AND url = $2", userID, req.RepoURL).Scan(&projectID)
	if err != nil {
		err2 := dbPool.QueryRow(ctx,
			`INSERT INTO projects (user_id, name, url) VALUES ($1, $2, $3) RETURNING id`,
			userID, projectName, req.RepoURL).Scan(&projectID)
		if err2 != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save project"})
			return
		}
	}
	detektXML, err := runAnalysisContainer(req.RepoURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Scan failed", "details": err.Error()})
		return
	}
	_, err = dbPool.Exec(ctx, `
        INSERT INTO detekt_results (project_id, detekt_xml, detected_at)
        VALUES ($1, $2, $3)
    `, projectID, detektXML, time.Now())
	if err != nil {
		log.Printf("Failed to insert detekt result: %v", err)
	}
	c.Data(http.StatusOK, "application/xml", []byte(detektXML))
}

func runAnalysisContainer(repoURL string) (string, error) {
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
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: "repo-analyzer:latest",
		Env:   []string{fmt.Sprintf("REPO_URL=%s", repoURL)},
		Tty:   false,
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
