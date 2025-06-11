#!/bin/bash
set -e

# Check if REPO_URL is provided
if [[ -z "$REPO_URL" ]]; then
  echo "Error: REPO_URL environment variable not set."
  exit 1
fi

# Check if SONAR_PROJECT_KEY is provided
if [[ -z "$SONAR_PROJECT_KEY" ]]; then
  echo "Error: SONAR_PROJECT_KEY environment variable not set."
  exit 1
fi

# Check if SONAR_ANALYSIS_VERSION is provided
if [[ -z "$SONAR_ANALYSIS_VERSION" ]]; then
  echo "Error: SONAR_ANALYSIS_VERSION environment variable not set."
  exit 1
fi

# Check if SONAR_TOKEN is provided
if [[ -z "$SONAR_TOKEN" ]]; then
  echo "Warning: SONAR_TOKEN environment variable not set."
fi

WORKDIR="/data/repo"

# Clean up any previous data
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"

echo "Cloning repository: $REPO_URL"
git clone "$REPO_URL" "$WORKDIR"

echo "Running detekt static analysis..."
detekt --input "$WORKDIR" \
  --report xml:/data/detekt-report.xml \
  --parallel \
  --excludes '**/build/**,**/generated/**,**/out/**' ||
  true

echo "Running SonarScanner analysis..."
cd "$WORKDIR"

# Build SonarScanner command dynamically
SCANNER_CMD="sonar-scanner \
  -Dsonar.projectBaseDir=$WORKDIR \
  -Dsonar.projectKey=$SONAR_PROJECT_KEY \
  -Dsonar.projectVersion=$SONAR_ANALYSIS_VERSION \
  -Dsonar.sources=. \
  -Dsonar.host.url=$SONAR_HOST_URL"

if [[ -n "$SONAR_TOKEN" ]]; then
  SCANNER_CMD="$SCANNER_CMD -Dsonar.token=$SONAR_TOKEN"
fi

# Optional: uncomment to debug
# SCANNER_CMD="$SCANNER_CMD -X"

echo "Executing SonarScanner with command:"
echo "$SCANNER_CMD"
eval $SCANNER_CMD || true # Do not exit on error for scanner

echo "Analysis finished. Reports should be in /data/"
