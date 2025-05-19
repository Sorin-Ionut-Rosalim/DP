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

// GLOBAL
var dbPool *pgxpool.Pool // database

func main() {

	// 1. Load .env if present
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error loading .env:", err)
	}

	// 2. Get environment variables
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL environment variable is not set. Please set it in .env or environment.")
	}

	// 3. Connect to the PostgreSQL database
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

	// 4. Create a Gin router
	r := gin.Default()

	// 5. Session secret from .env
	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		log.Fatal("SESSION_SECRET environment variable is not set. Please set it in .env or environment.")
	}

	// 6.1 CORS & cookie middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 6.2 Setup session middleware
	store := cookie.NewStore([]byte(sessionSecret))
	r.Use(sessions.Sessions("mysession", store))

	// 7. Routes
	r.GET("/", func(c *gin.Context) {
		c.String(200, "Hello from Go + Gin!")
	})

	// Register user
	r.POST("/api/register", registerHandler)

	// Login user
	r.POST("/api/login", loginHandler)

	// Logout user
	r.POST("/api/logout", logoutHandler)

	// Protected profile route
	r.GET("/api/profile", profileHandler)

	// Scan endpoint using Docker!
	r.POST("/api/clone", cloneHandler)

	// 8. Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	// 8. Run the server
	fmt.Printf("Starting server on port %s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func registerHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username and password are required."})
		return
	}

	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters long."})
		return
	}

	ctx := context.Background()
	var existingID int
	err := dbPool.QueryRow(ctx, "SELECT id FROM users WHERE username=$1", req.Username).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists."})
		return
	}

	hashBytes, hashErr := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if hashErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error hashing password."})
		fmt.Println(hashErr.Error())
		return
	}

	_, insertErr := dbPool.Exec(ctx, "INSERT INTO users (username, password) VALUES ($1, $2)", req.Username, string(hashBytes))
	if insertErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error inserting user into the database."})
		fmt.Println(insertErr.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully."})
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

	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username and password are required."})
		return
	}

	start := time.Now()

	ctx := context.Background()
	var userID int
	var hashedPassword string
	err := dbPool.QueryRow(ctx, "SELECT id, password FROM users WHERE username=$1", req.Username).Scan(&userID, &hashedPassword)
	elapsed := time.Since(start)
	log.Printf("Binomial took %s", elapsed)
	if err != nil {
		// user not found or DB error
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password."})
		return
	}
	log.Printf("AICI!")

	if bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)) != nil {
		// incorrect password
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password."})
		return
	}

	session := sessions.Default(c)
	session.Set("userID", userID)
	if saveErr := session.Save(); saveErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Session save error", "error": saveErr.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged in successfully."})
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
	userIDval := session.Get("userID")
	if userIDval == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in"})
		return
	}

	userID := userIDval.(int)

	ctx := context.Background()
	var username string
	err := dbPool.QueryRow(ctx, "SELECT username FROM users WHERE id=$1", userID).Scan(&username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile data",
		"user": gin.H{
			"id":       userID,
			"username": username,
		},
	})

}

// --- THIS IS THE DOCKER-POWERED SCAN ENDPOINT ---
func cloneHandler(c *gin.Context) {
	var req struct {
		RepoURL string `json:"repoUrl" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.RepoURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request format or missing repoUrl"})
		return
	}

	// Validate GitHub URL
	if !strings.HasPrefix(req.RepoURL, "https://github.com/") {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Only GitHub repository URLs are supported"})
		return
	}

	// Run the analysis in a Docker container
	detektXML, err := runAnalysisContainer(req.RepoURL)
	if err != nil {
		log.Println("Scan error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Scan failed", "details": err.Error()})
		return
	}

	// Respond with the XML as string (optionally: parse and return a summary)
	c.Data(http.StatusOK, "application/xml", []byte(detektXML))
}

// --- Function to run the analysis container and fetch the detekt results ---
func runAnalysisContainer(repoURL string) (string, error) {
	tempDir, err := os.MkdirTemp("", "scan-")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir) // Clean up after scan

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
