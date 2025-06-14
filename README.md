<div align="center">

# DP - Developer Platform for Code Quality

<p><em>A scalable, web-based platform for automated Kotlin code quality assessment.</em></p>

<p>
  <img alt="last-commit" src="https://img.shields.io/github/last-commit/Sorin-Ionut-Rosalim/DP?style=flat&logo=git&logoColor=white&color=0080ff">
  <img alt="repo-top-language" src="https://img.shields.io/github/languages/top/Sorin-Ionut-Rosalim/DP?style=flat&color=0080ff">
  <img alt="repo-language-count" src="https://img.shields.io/github/languages/count/Sorin-Ionut-Rosalim/DP?style=flat&color=0080ff">
</p>

<p><em>Built with the tools and technologies:</em></p>
<p>
  <img alt="Go" src="https://img.shields.io/badge/Go-00ADD8.svg?style=flat&logo=Go&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED.svg?style=flat&logo=Docker&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1.svg?style=flat&logo=PostgreSQL&logoColor=white">
  <img alt="Gin" src="https://img.shields.io/badge/Gin-008ECF.svg?style=flat&logo=Gin&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white">
  <img alt="SonarQube" src="https://img.shields.io/badge/SonarQube-4E9BCD.svg?style=flat&logo=SonarQube&logoColor=white">
  <img alt="Zod" src="https://img.shields.io/badge/Zod-3E67B1.svg?style=flat&logo=Zod&logoColor=white">
  <img alt="GNU Bash" src="https://img.shields.io/badge/GNU%20Bash-4EAA25.svg?style=flat&logo=GNU-Bash&logoColor=white">
</p>

</div>

---

## 📖 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Usage](#usage)

---

## Overview

DP is a powerful developer tool designed to automate and visualize static code analysis for Kotlin repositories. It integrates tools like **Detekt** and **SonarQube** within a containerized environment, ensuring consistent and scalable quality assessments. The platform features a modern React and TypeScript frontend for intuitive navigation, project management, and detailed reports, all secured with robust user authentication. Whether you're tracking code health or managing team workflows, DP provides the essential features to enhance your development lifecycle.

### ✨ Why DP?

This project simplifies static code analysis and project tracking for developers. The core features include:

-   🛠️ **Automated Analysis:** A containerized environment running Detekt and SonarQube for consistent code quality checks.
-   📊 **Visual Reports:** Interactive dashboards and tables for analyzing issues from both Detekt and SonarQube.
-   🔒 **Secure User Management:** Authentication and session handling for a personalized experience.
-   🚀 **Scalable Architecture:** A modern Go backend and PostgreSQL database setup designed for reliability.
-   🎯 **Developer-Friendly UI:** A fast and responsive frontend built with React, TypeScript, and Vite.

---

## 🏛️ Architecture

The platform is built on a multi-component architecture:
-   **Frontend:** A React/TypeScript single-page application built with Vite that provides the user interface.
-   **Backend:** A Go API built with the Gin framework that handles user authentication, project management, and analysis orchestration.
-   **Database:** A PostgreSQL database for storing user data, projects, and scan results.
-   **Analysis Module:** A Dockerized environment containing Detekt and SonarScanner CLIs, invoked by the backend to perform on-demand analysis.
-   **SonarQube Server:** A separate SonarQube instance is required for SonarScanner to submit its reports to and for the backend to fetch results from.

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following software installed on your system:
-   **[Docker](https://www.docker.com/products/docker-desktop/)**: To run SonarQube, PostgreSQL, and the analysis container. (Docker Compose is recommended).
-   **[Go](https://go.dev/doc/install)**: Version 1.21 or newer.
-   **[Node.js](https://nodejs.org/)**: Version 18.x or newer (includes npm).
-   **[Git](https://git-scm.com/)**: For cloning the repository.

### Environment Setup

The application relies on several services and environment variables to run correctly.

#### 1. Docker Services Setup (SonarQube & PostgreSQL)

It is highly recommended to use Docker Compose to set up the required SonarQube and PostgreSQL services. You can create a `docker-compose.yml` file in the root of the project with the following content:

```yaml
# docker-compose.yml
version: '3.8'

services:
  sonarqube:
    image: sonarqube:community
    container_name: sonarqube
    ports:
      - "9000:9000"
    environment:
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs

  postgres:
    image: postgres:15
    container_name: postgres_db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: your_db_user
      POSTGRES_PASSWORD: your_db_password
      POSTGRES_DB: dp_database
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  postgres_data:
```

-   **Start the services:**
    ```sh
    docker-compose up -d
    ```
-   **SonarQube Setup:** Once SonarQube is running, navigate to `http://localhost:9000`. The default login is `admin` / `admin`. You will be prompted to change the password.
-   **Generate a SonarQube Token:** For the backend to communicate with SonarQube, you need an authentication token.
    1.  In SonarQube, go to **My Account** > **Security**.
    2.  Under "Tokens", generate a new token. Give it a name (e.g., `dp-backend-token`).
    3.  **Copy the generated token immediately.** ou will need it for the SONAR_API_TOKEN variable.

#### 2. Backend Environment File

-   Navigate to the `backend-go` directory.
-   Create a `.env` file (`backend-go/.env`) and add the following variables:

    ```env
    # Database URL for PostgreSQL
    DB_URL="postgres://your_db_user:your_db_password@localhost:5432/dp_database?sslmode=disable"

    # Secret key for session management
    SESSION_SECRET="your_very_secret_and_long_random_string_here"

    # Backend server port (optional, defaults to 4000)
    PORT="4000"

    # --- SonarQube Configuration ---

    # User Token for the Go backend to make API calls to SonarQube (checking status, fetching results).
    # This is the token you generated in the SonarQube UI. Tokens usually start with 'squ_'.
    SONAR_API_TOKEN="your_generated_sonarqube_user_token_here"

    # Optional: Analysis Token for the SonarScanner to submit reports.
    # Your code uses 'SONAR_LOGIN_TOKEN' for this. Tokens often start with 'sqa_'.
    # This is required if your SonarQube instance does not allow anonymous analysis.
    SONAR_LOGIN_TOKEN="your_sonarqube_analysis_token_if_needed"

    # URL for the Go backend (running on host) to connect to the SonarQube server (in Docker).
    SONAR_HOST_URL="http://localhost:9000"

    # URL for the analysis container (Docker) to connect to the SonarQube server (running on host).
    # For Docker Desktop (Windows/Mac), 'host.docker.internal' is correct.
    # For Linux, you might need to use the Docker bridge IP (e.g., 172.17.0.1) or set up a custom network.
    SONAR_SCANNER_HOST_URL="[http://host.docker.internal:9000](http://host.docker.internal:9000)"
    ```

### Installation

Now, install the dependencies for each part of the application.

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Sorin-Ionut-Rosalim/DP
    cd DP
    ```

2.  **Install Frontend Dependencies:**
    ```sh
    cd frontend
    npm install
    cd ..
    ```

3.  **Install Backend Dependencies:** The Go modules will be downloaded automatically when you build or run the backend.

4.  **Build the Analysis Docker Image:** This image contains Detekt and SonarScanner.
    ```sh
    docker build -t repo-analyzer:latest -f analysis-docker/Dockerfile.analysis ./analysis-docker
    ```
    
5. **Setup the Database Schema:**
   Connect to your PostgreSQL database (using `psql`, pgAdmin, or another tool) and execute the SQL commands from the `db_schema.txt` file to create the necessary tables (`users`, `projects`, `detekt_results`, `sonarqube_results`).


### Running the Application

You need to run the backend and frontend servers in separate terminals.

1.  **Start the Backend Server:**
    -   Navigate to the `backend-go` directory.
    -   Run the server:
    ```sh
    # From backend-go/ directory
    go run main.go
    ```
    The backend should now be running on `http://localhost:4000`.

2.  **Start the Frontend Server:**
    -   In a new terminal, navigate to the `frontend` directory.
    -   Run the development server:
    ```sh
    # From frontend/ directory
    npm run dev
    ```
    The frontend should now be running on `http://localhost:5173`.

## 💻 Usage

-    Open your browser and navigate to http://localhost:5173.
-    Register for a new account or log in with existing credentials.
-    From the "Clone" page, submit a public GitHub repository URL (e.g., https://github.com/skydoves/Pokedex).
-    The analysis will run in the background. You can monitor the logs of your Go backend to see the progress.
-    Navigate to the "Profile" page to see your list of scanned projects and view the detailed analysis reports from Detekt and SonarQube.