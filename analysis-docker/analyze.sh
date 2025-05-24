#!/bin/bash
set -e

# Check if REPO_URL is provided
if [[ -z "$REPO_URL" ]]; then
  echo "Error: REPO_URL environment variable not set."
  exit 1
fi

if [[ -z "$SONAR_PROJECT_KEY" ]]; then
  echo "Error: SONAR_PROJECT_KEY environment variable not set."
fi

WORKDIR="/data/repo"

# Clean up any previous data
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"

echo "Cloning repository: $REPO_URL"
git clone "$REPO_URL" "$WORKDIR"

# --- Add debug lines here ---
echo "Listing files in /opt/detekt/detekt-cli-1.23.0/bin/:"
ls -l /opt/detekt/detekt-cli-1.23.0/bin/
echo "Symlink in /usr/local/bin:"
ls -l /usr/local/bin/detekt

echo "Running detekt static analysis..."
detekt --input "$WORKDIR" \
  --report xml:/data/detekt-report.xml \
  --parallel \
  --excludes '**/build/**,**/generated/**,**/out/**' \
  || true

echo "Running SonarScanner analysis..."
cd "$WORKDIR"
sonar-scanner \
  -Dsonar.projectBaseDir="$WORKDIR" \
  -Dsonar.projectKey="$SONAR_PROJECT_KEY"  \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://host.docker.internal:9000 \
  || true

echo "Analysis finished. Reports should be in /data/"
