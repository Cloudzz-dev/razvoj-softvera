#!/bin/bash

# DFDS Smoke Test Script
# Verifies that the application is running and the database is reachable.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default target URL
TARGET_URL=${1:-"http://localhost:3753"}
HEALTH_ENDPOINT="$TARGET_URL/api/health"

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}       DFDS Smoke Test Starting        ${NC}"
echo -e "${YELLOW}=======================================${NC}"

# 1. Check if the home page is reachable
log_info "Testing application reachability at $TARGET_URL..."
if curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL" | grep -q "200"; then
  log_success "Application home page is reachable (HTTP 200)."
else
  log_error "Application home page is NOT reachable or returned a non-200 status."
  exit 1
fi

# 2. Check the API health endpoint
log_info "Testing API health endpoint at $HEALTH_ENDPOINT..."
HEALTH_RESPONSE=$(curl -s "$HEALTH_ENDPOINT")

if echo "$HEALTH_RESPONSE" | grep -q "\"status\":\"healthy\""; then
  log_success "API Health Check: Healthy."
else
  log_error "API Health Check: FAILED."
  echo -e "Response: $HEALTH_RESPONSE"
  exit 1
fi

# 3. Check for database connectivity in the health response (if it reports it)
if echo "$HEALTH_RESPONSE" | grep -q "\"database\":\"up\"" || echo "$HEALTH_RESPONSE" | grep -q "\"db\":\"connected\""; then
  log_success "Database connectivity verified via health endpoint."
fi

echo -e "${YELLOW}=======================================${NC}"
echo -e "${GREEN}       Smoke Test PASSED!              ${NC}"
echo -e "${YELLOW}=======================================${NC}"
