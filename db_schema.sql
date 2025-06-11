-- Enable UUID support in Postgres if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE: Stores user credentials and information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    signup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROJECTS TABLE: Stores information about the repositories a user has scanned
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, url) -- A user can only have one project per unique URL
);

-- SCANS TABLE: Records each analysis event for a project
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- SonarQube summary metrics that will be updated after analysis
    lines_of_code INTEGER,
    maintainability_rating INTEGER, -- e.g., A=1, B=2, C=3, D=4, E=5
    cognitive_complexity INTEGER
);

-- DETEKT RESULTS TABLE: Stores the raw XML output from a Detekt scan
CREATE TABLE detekt_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    detekt_xml TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Aggregated issue counts for quick lookups
    error_issues INTEGER,
    warning_issues INTEGER,
    info_issues INTEGER
);

-- SONARQUBE RESULTS TABLE: Stores the raw JSON output from a SonarQube scan
CREATE TABLE sonarqube_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    sonar_json TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Aggregated issue counts by severity
    blocker_issues INTEGER,
    critical_issues INTEGER,
    major_issues INTEGER,
    minor_issues INTEGER,
    info_issues INTEGER,
    -- Aggregated issue counts by type
    code_smells INTEGER,
    bugs INTEGER,
    vulnerabilities INTEGER
);

-- INDEXES: Add indexes to foreign keys and frequently queried columns to improve performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_scans_project_id ON scans(project_id);
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_detekt_results_scan_id ON detekt_results(scan_id);
CREATE INDEX idx_sonarqube_results_scan_id ON sonarqube_results(scan_id);
