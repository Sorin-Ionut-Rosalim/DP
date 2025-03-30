package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
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
	fmt.Println("Connected to the database!")

	// 4. Create a Gin router
	r := gin.Default()

	// 5. Session secret from .env
	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		log.Fatal("SESSION_SECRET environment variable is not set. Please set it in .env or environment.")
	}

	// 6. Setup session middleware
	store := cookie.NewStore([]byte(sessionSecret))
	r.Use(sessions.Sessions("mysession", store))

	// 7. Routes
	r.GET("/", func(c *gin.Context) {
		c.String(200, "Hello from Go + Gin!")
	})

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
