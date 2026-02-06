#!/bin/bash

#############################################
#      DFDS - One-Click Deployment Script   #
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Project specific variables
PROJECT_NAME="razvoj-softvera" # Default compose project name (directory name) or override here.
NETWORK_NAME="razvoj-softvera_dfds-network" # Likely mismatch if directory is not dfds.
# We will detect network dynamically in functions.

# Functions
print_banner() {
  echo -e "${PURPLE}"
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║                                                                           ║"
  echo "║      ██████╗ ███████╗██████╗ ███████╗    ████████╗██╗████████╗███╗        ║"
  echo "║      ██╔══██╗██╔════╝██╔══██╗██╔════╝    ╚══██╔══╝██║╚══██╔══╝████╗       ║"
  echo "║      ██║  ██║█████╗  ██║  ██║███████╗       ██║   ██║   ██║   ██╔██╗      ║"
  echo "║      ██║  ██║██╔══╝  ██║  ██║╚════██║       ██║   ██║   ██║   ██║╚██╗     ║"
  echo "║      ██████╔╝██║     ██████╔╝███████║       ██║   ██║   ██║   ██║ ╚██╗    ║"
  echo "║      ╚═════╝ ╚═╝     ╚═════╝ ╚══════╝       ╚═╝   ╚═╝   ╚═╝   ╚═╝  ╚═╝    ║"
  echo "║                                                                           ║"
  echo "║                         DFDS SYSTEM MONITOR                               ║"
  echo "║                    Deployment Script v3.0 (Team Cloudzz)                  ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
  if [[ $EUID -eq 0 ]]; then
    log_warning "Running as root. Some operations may require this."
  fi
}

# Check if a command exists
command_exists() {
  command -v "$1" &>/dev/null
}

# Detect OS
detect_os() {
  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
  elif [[ -f /etc/debian_version ]]; then
    OS="debian"
  elif [[ -f /etc/redhat-release ]]; then
    OS="rhel"
  elif [[ -f /etc/arch-release ]]; then
    OS="arch"
  else
    OS="unknown"
  fi
  log_info "Detected OS: $OS"
}

# Install Docker
install_docker() {
  if command_exists docker; then
    log_success "Docker is already installed: $(docker --version)"
    return 0
  fi

  log_info "Installing Docker..."

  case $OS in
  ubuntu | debian)
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    ;;
  centos | rhel | fedora)
    sudo yum install -y yum-utils
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    ;;
  arch | manjaro)
    sudo pacman -Syu --noconfirm docker docker-compose
    ;;
  *)
    log_error "Unsupported OS for automatic Docker installation. Please install Docker manually."
    exit 1
    ;;
  esac

  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker $USER

  log_success "Docker installed successfully!"
}

# Install Docker Compose
install_docker_compose() {
  if command_exists docker-compose || docker compose version &>/dev/null; then
    log_success "Docker Compose is available"
    return 0
  fi

  log_info "Installing Docker Compose..."

  COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
  sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose

  log_success "Docker Compose installed: $(docker-compose --version)"
}

# Install NVM and Node.js
install_nvm() {
  if [ -d "$HOME/.nvm" ]; then
    log_success "NVM is already installed"
  else
    log_info "Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    log_success "NVM installed successfully!"
  fi

  # Load NVM
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  # Install and use Node 22
  log_info "Installing Node.js 22..."
  nvm install 22
  nvm use 22
  nvm alias default 22

  log_success "Node.js $(node -v) installed and active!"
}

# Install Git
install_git() {
  if command_exists git; then
    log_success "Git is already installed: $(git --version)"
    return 0
  fi

  log_info "Installing Git..."

  case $OS in
  ubuntu | debian)
    sudo apt-get update && sudo apt-get install -y git
    ;;
  centos | rhel | fedora)
    sudo yum install -y git
    ;;
  arch | manjaro)
    sudo pacman -Syu --noconfirm git
    ;;
  *)
    log_error "Please install Git manually."
    exit 1
    ;;
  esac

  log_success "Git installed successfully!"
}

# Setup environment file
setup_env() {
  # Variables to preserve across redeployments
  local EXISTING_DB_PASSWORD=""
  local EXISTING_DB_USER=""
  local EXISTING_DB_NAME=""
  local EXISTING_OPENAI_KEY=""
  local EXISTING_GITHUB_ID=""
  local EXISTING_GITHUB_SECRET=""
  local EXISTING_GOOGLE_ID=""
  local EXISTING_GOOGLE_SECRET=""
  local EXISTING_RESEND_KEY=""

  # Check if .env exists and extract existing values
  if [[ -f .env ]]; then
    log_info "Existing .env found. Preserving database credentials..."

    # Extract existing values (preserve DB credentials and user-provided keys)
    EXISTING_DB_USER=$(grep "^DB_USER=" .env 2>/dev/null | cut -d'=' -f2)
    EXISTING_DB_PASSWORD=$(grep "^DB_PASSWORD=" .env 2>/dev/null | cut -d'=' -f2)
    EXISTING_DB_NAME=$(grep "^DB_NAME=" .env 2>/dev/null | cut -d'=' -f2)
    EXISTING_OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env 2>/dev/null | cut -d'=' -f2-)
    EXISTING_GITHUB_ID=$(grep "^GITHUB_ID=" .env 2>/dev/null | cut -d'=' -f2)
    EXISTING_GITHUB_SECRET=$(grep "^GITHUB_SECRET=" .env 2>/dev/null | cut -d'=' -f2)
    EXISTING_GOOGLE_ID=$(grep "^GOOGLE_CLIENT_ID=" .env 2>/dev/null | cut -d'=' -f2)
    EXISTING_GOOGLE_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env 2>/dev/null | cut -d'=' -f2)
    EXISTING_RESEND_KEY=$(grep "^RESEND_API_KEY=" .env 2>/dev/null | cut -d'=' -f2)

    # Backup existing file
    cp .env .env.backup
  fi

  log_info "Setting up environment configuration..."

  # Generate new secrets (always regenerate for security, except DB password)
  local NEW_NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

  # Use existing DB password or generate new one (preserve across redeployments!)
  local DB_PASSWORD="${EXISTING_DB_PASSWORD:-$(openssl rand -base64 24 2>/dev/null || head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)}"
  local DB_USER="${EXISTING_DB_USER:-dfds_user}"
  local DB_NAME="${EXISTING_DB_NAME:-dfds}"

  cat >.env <<EOF
# DFDS Environment Configuration
# Generated on $(date)

# Database Configuration (PRESERVED across redeployments)
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_PORT=5432

# Prisma Database URL (auto-generated from above credentials)
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public

# Application Configuration  
APP_PORT=3753

# NextAuth Configuration (auto-generated)
NEXTAUTH_URL=http://localhost:3753
NEXTAUTH_SECRET=${NEW_NEXTAUTH_SECRET}

# OpenAI API Key (for AI features) - ADD YOUR KEY HERE
OPENAI_API_KEY=${EXISTING_OPENAI_KEY}

# OAuth Providers (optional)
GITHUB_ID=${EXISTING_GITHUB_ID}
GITHUB_SECRET=${EXISTING_GITHUB_SECRET}
GOOGLE_CLIENT_ID=${EXISTING_GOOGLE_ID}
GOOGLE_CLIENT_SECRET=${EXISTING_GOOGLE_SECRET}

# Load Balancer (optional, for clustering)
LB_PORT=80
LB_SSL_PORT=8443

# Email (Resend) - ADD YOUR RESEND API KEY HERE
RESEND_API_KEY=${EXISTING_RESEND_KEY}

# Logging
LOG_LEVEL=info
EOF

  log_success "Environment file created: .env"

  if [[ -n "$EXISTING_DB_PASSWORD" ]]; then
    log_success "Database credentials preserved from previous deployment."
  else
    log_warning "New database password generated. This is a fresh deployment."
  fi

  if [[ -z "$EXISTING_OPENAI_KEY" ]]; then
    log_warning "Please edit .env and add your OPENAI_API_KEY!"
  else
    log_success "Existing API keys preserved."
  fi

  if [[ -z "$EXISTING_RESEND_KEY" ]]; then
    log_warning "Please edit .env and add your RESEND_API_KEY!"
  fi
}

# Build and start containers
start_containers() {
  # Verify .env exists
  if [[ ! -f .env ]]; then
    log_error ".env file missing! Please run ./deploy.sh setup first."
    exit 1
  fi

  # Run build check to ensure code is valid
  log_info "Running build check..."
  npm run build || {
    log_error "Build failed! Please fix errors before deploying."
    exit 1
  }
  log_info "Building and starting containers..."

  # Load environment variables from .env if it exists
  if [[ -f .env ]]; then
    set -a
    source .env
    set +a
    log_info "Loaded environment from .env"
  else
    log_warning "No .env file found! Using defaults..."
  fi

  # Use docker compose (v2) or docker-compose (v1)
  if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
  else
    COMPOSE_CMD="docker-compose"
  fi

  # Build the app
  $COMPOSE_CMD build

  # Start the database first
  $COMPOSE_CMD up -d postgres

  log_info "Waiting for database to be ready..."
  sleep 10

  # Run database migrations and generate client
  # Get actual credentials from environment (loaded from .env)
  local ACTUAL_DB_USER="${DB_USER:-dfds}"
  local ACTUAL_DB_PASS="${DB_PASSWORD}"
  local ACTUAL_DB_NAME="${DB_NAME:-dfds}"

  if [[ -z "$ACTUAL_DB_PASS" ]]; then
    log_error "DB_PASSWORD is not set! Please run './deploy.sh setup' first or set the variable."
    exit 1
  fi


  log_info "Using database: $ACTUAL_DB_NAME with user: $ACTUAL_DB_USER"
  
  # Detect network name dynamically (project name _ network name)
  # Assuming standard docker compose behavior
  local NETWORK_ID=$($COMPOSE_CMD ps -q postgres | xargs docker inspect -f '{{range $k,$v:=.NetworkSettings.Networks}}{{$k}}{{end}}' | head -n 1)
  if [[ -z "$NETWORK_ID" ]]; then
     NETWORK_ID="dfds-network" # Fallback
  fi
  log_info "Detected Docker Network: $NETWORK_ID"

  # Run prisma db push using a temporary container with Prisma v5 and OpenSSL
  # Run prisma db push using the migrator service (reusing built layers)
  log_info "Running migrations via migrator..."
  
  # We override the command to perform the migration sequence
  $COMPOSE_CMD run --rm --entrypoint "/bin/sh -c" migrator "npx prisma generate && npx prisma db push && npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"

  # Start all services
  $COMPOSE_CMD up -d

  log_success "All containers started!"
}

# Force DB Push (Accept Data Loss)
force_db_push() {
  log_warning "Running Prisma DB Push with --accept-data-loss..."
  log_warning "This procedure may DELETE data! Proceeding in 5 seconds..."
  sleep 5

  # Load environment variables from .env if it exists
  if [[ -f .env ]]; then
    set -a
    source .env
    set +a
    log_info "Loaded environment from .env"
  else
    log_warning "No .env file found! Using defaults..."
  fi
  
  # Get actual credentials from environment (loaded from .env)
  local ACTUAL_DB_USER="${DB_USER:-dfds}"
  local ACTUAL_DB_PASS="${DB_PASSWORD}"
  local ACTUAL_DB_NAME="${DB_NAME:-dfds}"
  
  # Use docker compose (v2) or docker-compose (v1)
  if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
  else
    COMPOSE_CMD="docker-compose"
  fi

  if [[ -z "$ACTUAL_DB_PASS" ]]; then
    log_error "DB_PASSWORD is not set! Cannot proceed with database push."
    exit 1
  fi

  log_info "Using database: $ACTUAL_DB_NAME"

  # Detect network
  local NETWORK_ID=$($COMPOSE_CMD ps -q postgres | xargs docker inspect -f '{{range $k,$v:=.NetworkSettings.Networks}}{{$k}}{{end}}' | head -n 1)
  if [[ -z "$NETWORK_ID" ]]; then
     NETWORK_ID="dfds-network" # Fallback
  fi

  # Run prisma db push using a temporary container
  docker run --rm --network="$NETWORK_ID" \
    -e DATABASE_URL="postgresql://${ACTUAL_DB_USER}:${ACTUAL_DB_PASS}@postgres:5432/${ACTUAL_DB_NAME}?schema=public" \
    -v "$(pwd)/prisma:/app/prisma" \
    -w /app \
    node:22-alpine sh -c "apk add --no-cache openssl && npm install prisma@7.3.0 @prisma/client@7.3.0 --no-save && npx prisma generate && npx prisma db push --skip-generate --accept-data-loss"

  log_success "Database schema updated (forced)!"
}

# Start with load balancer for clustering
start_with_lb() {
  log_info "Starting with Nginx load balancer..."

  if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
  else
    COMPOSE_CMD="docker-compose"
  fi

  # Create SSL directory if it doesn't exist
  mkdir -p ssl

  $COMPOSE_CMD --profile with-lb up -d

  log_success "Started with load balancer on port 80!"
}

# Scale app instances
scale_app() {
  local replicas=${1:-3}

  log_info "Scaling app to $replicas instances..."

  if docker compose version &>/dev/null; then
    docker compose up -d --scale app=$replicas
  else
    docker-compose up -d --scale app=$replicas
  fi

  log_success "Scaled to $replicas app instances!"
}

# Show status
show_status() {
  echo ""
  log_info "Container Status:"
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(dfds|NAMES)"
  echo ""
}

# Stop all containers safely
stop_containers() {
  log_info "Stopping all containers..."

  # Detect COMPOSE_CMD
  if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
  else
    COMPOSE_CMD="docker-compose"
  fi

  # Stop with all possible configurations to be safe
  $COMPOSE_CMD -f docker-compose.yml -f docker-compose.dev.yml --profile with-lb down 2>/dev/null || $COMPOSE_CMD down

  log_success "All containers stopped safely!"
}

# Print usage
print_usage() {
  echo ""
  echo -e "${CYAN}Usage:${NC} ./deploy.sh [command]"
  echo ""
  echo -e "${CYAN}Core Commands:${NC}"
  echo "  install     Install all system dependencies (Docker, Compose, Git, Node.js)"
  echo "  setup       Setup or update .env configuration (preserves credentials)"
  echo "  full        Full sequence: install -> setup -> start (for fresh deploys)"
  echo ""
  echo -e "${CYAN}Lifecycle Commands:${NC}"
  echo "  start       Build images, run migrations, and launch the application"
  echo "  dev         Launch in DEVELOPMENT mode with hot-reloading (volumes)"
  echo "  stop        Stop all services related to the app safely"
  echo "  restart     Quickly restart containers without rebuilding"
  echo "  clean       REMOVE all data, containers, and volumes (destructive!)"
  echo "  force-db-push Run DB migration with --accept-data-loss (destructive!)"
  echo ""
  echo -e "${CYAN}Monitoring & Scaling:${NC}"
  echo "  status      Show health and ports of running containers"
  echo "  logs        Stream live output from ALL containers"
  echo "  web-logs    Stream live output from webapp only (dfds-app)"
  echo "  scale N     Scale web app to N instances (requires load balancer)"
  echo "  start-lb    Launch with Nginx load balancer for clustered setups"
  echo ""
}

# Main script
main() {
  print_banner
  detect_os

  case "${1:-help}" in
  install)
    install_git
    install_docker
    install_docker_compose
    install_nvm
    ;;
  setup)
    setup_env
    ;;
  start)
    start_containers
    show_status
    echo -e "${GREEN}🚀 DFDS is now running at http://localhost:3753${NC}"
    ;;
  dev)
    log_info "Starting in DEVELOPMENT mode (hot-reloading enabled)..."
    if docker compose version &>/dev/null; then
      COMPOSE_CMD="docker compose"
    else
      COMPOSE_CMD="docker-compose"
    fi
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.dev.yml up -d --build
    show_status
    echo -e "${GREEN}🚀 DFDS DEV is now running at http://localhost:3753${NC}"
    echo -e "${YELLOW}Logs are streaming below (Ctrl+C to stop logs, container will keep running):${NC}"
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.dev.yml logs -f app
    ;;
  start-lb)
    start_containers
    start_with_lb
    show_status
    echo -e "${GREEN}🚀 DFDS is now running at http://localhost${NC}"
    ;;
  force-db-push)
    force_db_push
    ;;
  stop)
    stop_containers
    ;;
  restart)
    log_info "Restarting containers..."
    docker compose restart 2>/dev/null || docker-compose restart
    show_status
    ;;
  logs)
    docker compose logs -f 2>/dev/null || docker-compose logs -f
    ;;
  web-logs)
    log_info "Streaming real-time logs from webapp (dfds-app)..."
    log_info "Press Ctrl+C to stop"
    echo ""
    docker compose logs -f app 2>/dev/null || docker-compose logs -f app
    ;;
  status)
    show_status
    ;;
  scale)
    scale_app "${2:-3}"
    show_status
    ;;
  clean)
    log_warning "This will remove all containers, networks, and volumes!"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm == [yY] ]]; then
      docker compose down -v --remove-orphans 2>/dev/null || docker-compose down -v --remove-orphans
      log_success "Cleanup complete!"
    else
      log_info "Cleanup cancelled."
    fi
    ;;
  full)
    install_git
    install_docker
    install_docker_compose
    install_nvm
    setup_env
    echo ""
    log_warning "Please edit .env file with your configuration before starting!"
    echo ""
    read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
    start_containers
    show_status
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   DFDS is now running at http://localhost:3753            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    ;;
  help | --help | -h)
    print_usage
    ;;
  *)
    log_error "Unknown command: $1"
    print_usage
    exit 1
    ;;
  esac
}

main "$@"
