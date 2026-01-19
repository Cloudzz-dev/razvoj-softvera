<#
.SYNOPSIS
    DFDS.io - One-Click Deployment Script for Windows
.DESCRIPTION
    PowerShell port of the deploy.sh script.
    Handles installation of dependencies, environment setup, and container management.
#>

param (
    [string]$Command = "help",
    [string]$Arg1 = ""
)

$ErrorActionPreference = "Stop"

# Colors mapping for Write-Host
$ColorRed = "Red"
$ColorGreen = "Green"
$ColorYellow = "Yellow"
$ColorBlue = "Cyan"
$ColorPurple = "Magenta"
$ColorCyan = "Cyan"

# --- Helper Functions ---

function Print-Banner {
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor $ColorPurple
    Write-Host "║                                                                           ║" -ForegroundColor $ColorPurple
    Write-Host "║   ███████╗████████╗ █████╗ ██████╗ ████████╗██╗████████╗    ██╗ ██████╗   ║" -ForegroundColor $ColorPurple
    Write-Host "║   ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██║╚══██╔══╝    ██║██╔═══██╗  ║" -ForegroundColor $ColorPurple
    Write-Host "║   ███████╗   ██║   ███████║██████╔╝   ██║   ██║   ██║       ██║██║   ██║  ║" -ForegroundColor $ColorPurple
    Write-Host "║   ╚════██║   ██║   ██╔══██║██╔══██╗   ██║   ██║   ██║       ██║██║   ██║  ║" -ForegroundColor $ColorPurple
    Write-Host "║   ███████║   ██║   ██║  ██║██║  ██║   ██║   ██║   ██║    ██╗██║╚██████╔╝  ║" -ForegroundColor $ColorPurple
    Write-Host "║   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝   ╚═╝    ╚═╝╚═╝ ╚═════╝   ║" -ForegroundColor $ColorPurple
    Write-Host "║                                                                           ║" -ForegroundColor $ColorPurple
    Write-Host "║                               Internal Tools                              ║" -ForegroundColor $ColorPurple
    Write-Host "║                        Windows Deployment Script v1.0                     ║" -ForegroundColor $ColorPurple
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor $ColorPurple
    Write-Host ""
}

function Log-Info ($msg) { Write-Host "[INFO] $msg" -ForegroundColor $ColorBlue }
function Log-Success ($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor $ColorGreen }
function Log-Warning ($msg) { Write-Host "[WARNING] $msg" -ForegroundColor $ColorYellow }
function Log-Error ($msg) { Write-Host "[ERROR] $msg" -ForegroundColor $ColorRed }

function Check-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Log-Warning "Not running as Administrator. Installation commands may fail."
    }
}

function Command-Exists ($cmd) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) { return $true }
    return $false
}

# --- Installation Functions ---

function Install-Docker {
    if (Command-Exists docker) {
        $v = docker --version
        Log-Success "Docker is already installed: $v"
        return
    }

    Log-Info "Installing Docker Desktop via Winget..."
    try {
        winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
        Log-Warning "Docker installed. A SYSTEM RESTART is likely required."
        Log-Warning "Please restart your computer, then run this script again."
    } catch {
        Log-Error "Failed to install Docker. Please install Docker Desktop manually."
        exit 1
    }
}

function Install-Git {
    if (Command-Exists git) {
        $v = git --version
        Log-Success "Git is already installed: $v"
        return
    }

    Log-Info "Installing Git via Winget..."
    try {
        winget install -e --id Git.Git --accept-package-agreements --accept-source-agreements
        Log-Success "Git installed successfully!"
        # Refresh env vars for current session if possible, though strict refresh often needs restart/new shell
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } catch {
        Log-Error "Failed to install Git manually."
        exit 1
    }
}

function Install-Node {
    if (Command-Exists node) {
        $v = node -v
        Log-Success "Node.js is already installed: $v"
        return
    }

    Log-Info "Installing Node.js LTS via Winget..."
    try {
        winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        Log-Success "Node.js installed successfully!"
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } catch {
        Log-Error "Failed to install Node.js manually."
        exit 1
    }
}

# --- Setup Function ---

function Get-EnvVar {
    param($content, $key)
    $match = $content | Select-String "^$key=(.*)"
    if ($match) {
        return $match.Matches.Groups[1].Value.Trim()
    }
    return $null
}

function Generate-Secret {
    param($length)
    $bytes = New-Object byte[] $length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

function Setup-Env {
    $envFile = ".env"
    $existingContent = @()
    
    $DB_USER = "startit"
    $DB_PASSWORD = ""
    $DB_NAME = "startit"
    $OPENAI_KEY = ""
    $GITHUB_ID = ""
    $GITHUB_SECRET = ""
    $GOOGLE_ID = ""
    $GOOGLE_SECRET = ""
    $RESEND_KEY = ""

    if (Test-Path $envFile) {
        Log-Info "Existing .env found. Preserving credentials..."
        $existingContent = Get-Content $envFile
        
        $val = Get-EnvVar $existingContent "DB_USER"; if ($val) { $DB_USER = $val }
        $val = Get-EnvVar $existingContent "DB_PASSWORD"; if ($val) { $DB_PASSWORD = $val }
        $val = Get-EnvVar $existingContent "DB_NAME"; if ($val) { $DB_NAME = $val }
        $val = Get-EnvVar $existingContent "OPENAI_API_KEY"; if ($val) { $OPENAI_KEY = $val }
        $val = Get-EnvVar $existingContent "GITHUB_ID"; if ($val) { $GITHUB_ID = $val }
        $val = Get-EnvVar $existingContent "GITHUB_SECRET"; if ($val) { $GITHUB_SECRET = $val }
        $val = Get-EnvVar $existingContent "GOOGLE_CLIENT_ID"; if ($val) { $GOOGLE_ID = $val }
        $val = Get-EnvVar $existingContent "GOOGLE_CLIENT_SECRET"; if ($val) { $GOOGLE_SECRET = $val }
        $val = Get-EnvVar $existingContent "RESEND_API_KEY"; if ($val) { $RESEND_KEY = $val }

        Copy-Item $envFile ".env.backup" -Force
    } else {
        Log-Info "Creating new .env file..."
    }

    if ([string]::IsNullOrEmpty($DB_PASSWORD)) {
        $DB_PASSWORD = Generate-Secret 16
        Log-Info "Generated new DB password."
    } else {
        Log-Success "Preserved existing DB password."
    }

    $NEXTAUTH_SECRET = Generate-Secret 32
    $DATE = Get-Date

    $NewContent = @"
# DFDS.io Environment Configuration
# Generated on $DATE (Windows)

# Database Configuration (PRESERVED across redeployments)
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=5432

# Prisma Database URL
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public

# Application Configuration
APP_PORT=3753

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3753
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# OpenAI API Key
OPENAI_API_KEY=$OPENAI_KEY

# OAuth Providers
GITHUB_ID=$GITHUB_ID
GITHUB_SECRET=$GITHUB_SECRET
GOOGLE_CLIENT_ID=$GOOGLE_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_SECRET

# Load Balancer
LB_PORT=80
LB_SSL_PORT=8443

# Email (Resend)
RESEND_API_KEY=$RESEND_KEY

# Logging
LOG_LEVEL=info
"@

    Set-Content -Path $envFile -Value $NewContent -Encoding UTF8
    Log-Success "Environment file created: .env"
    
    if ([string]::IsNullOrEmpty($OPENAI_KEY)) {
        Log-Warning "Please edit .env and add your OPENAI_API_KEY!"
    }
}

# --- Container Management ---

function Start-Containers {
    Log-Info "Building and starting containers..."
    
    if (-not (Test-Path ".env")) {
        Log-Warning "No .env file found! Using defaults or failing..."
    } else {
        Log-Info "Loaded environment from .env"
        # PowerShell doesn't auto-export to child processes easily like 'set -a', but compose reads .env automatically
    }

    $composeCmd = "docker-compose"
    if (Command-Exists "docker") {
        # Check if 'docker compose' subcommand works
        $proc = Start-Process -FilePath "docker" -ArgumentList "compose", "version" -NoNewWindow -PassThru -Wait
        if ($proc.ExitCode -eq 0) {
            $composeCmd = "docker compose"
        }
    }

    Invoke-Expression "$composeCmd build"
    if ($LASTEXITCODE -ne 0) { Log-Error "Build failed"; exit 1 }

    Invoke-Expression "$composeCmd up -d postgres"
    
    Log-Info "Waiting 10s for database..."
    Start-Sleep -Seconds 10

    Log-Info "Running migrations..."
    
    # Need to extract DB creds for the migration container command
    $envContent = Get-Content ".env"
    $d_user = Get-EnvVar $envContent "DB_USER"
    $d_pass = Get-EnvVar $envContent "DB_PASSWORD"
    $d_name = Get-EnvVar $envContent "DB_NAME"
    if (-not $d_user) { $d_user = "startit" }
    if (-not $d_name) { $d_name = "startit" }
    
    # Construct DB URL specifically for the runner
    $db_url = "postgresql://${d_user}:${d_pass}@postgres:5432/${d_name}?schema=public"
    
    # Path handling for volume
    $currentDir = $PWD.Path
    # Docker on Windows usually accepts "C:\Users\..." or "/c/Users/..."
    # We will try standard string first. Quotes are critical.
    
    $dockerRunCmd = "docker run --rm --network=startit_startit-network " + `
                    "-e DATABASE_URL=""${db_url}"" " + `
                    "-v ""${currentDir}\prisma:/app/prisma"" " + `
                    "-w /app " + `
                    "node:20-alpine sh -c ""apk add --no-cache openssl && npm install prisma@5 --no-save && npx prisma@5 generate && npx prisma@5 db push --skip-generate"""
    
    Log-Info "Executing migration container..."
    Invoke-Expression $dockerRunCmd
    if ($LASTEXITCODE -ne 0) { Log-Error "Migrations failed"; exit 1 }

    Invoke-Expression "$composeCmd up -d"
    
    Log-Success "All containers started!"
}

function Start-With-LB {
    Log-Info "Starting with Nginx load balancer..."
    if (-not (Test-Path "ssl")) { New-Item -ItemType Directory -Force -Path "ssl" | Out-Null }
    
    $composeCmd = "docker compose" # assume check done in Start-Containers if called first, but better safe
    # Re-check simplified
    if (Command-Exists "docker") { $composeCmd = "docker compose" } # simplistic fallback
    
    Invoke-Expression "$composeCmd --profile with-lb up -d"
    Log-Success "Started with load balancer on port 80!"
}

function Stop-Containers {
    Log-Info "Stopping containers..."
    # Try both just in case
    docker compose down 2>$null
    if ($LASTEXITCODE -ne 0) { docker-compose down 2>$null }
    Log-Success "Containers stopped!"
}

function Show-Status {
    Write-Host ""
    Log-Info "Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String "startit|NAMES"
    Write-Host ""
}

function Print-Usage {
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [command]" -ForegroundColor $ColorCyan
    Write-Host ""
    Write-Host "Core Commands:" -ForegroundColor $ColorCyan
    Write-Host "  install     Install dependencies (Docker, Git, Node) via Winget"
    Write-Host "  setup       Setup .env configuration"
    Write-Host "  full        install -> setup -> start"
    Write-Host ""
    Write-Host "Lifecycle Commands:" -ForegroundColor $ColorCyan
    Write-Host "  start       Build, migrate, and launch"
    Write-Host "  stop        Stop containers"
    Write-Host "  restart     Restart containers"
    Write-Host "  clean       Remove all data/containers"
    Write-Host ""
    Write-Host "Monitoring:" -ForegroundColor $ColorCyan
    Write-Host "  status      Show health"
    Write-Host "  logs        Stream logs"
    Write-Host "  scale N     Scale app (requires LB)"
    Write-Host "  start-lb    Launch with LB"
    Write-Host ""
}

# --- Main ---

Print-Banner
Check-Admin

switch ($Command) {
    "install" {
        Install-Git
        Install-Node
        Install-Docker
    }
    "setup" {
        Setup-Env
    }
    "start" {
        Start-Containers
        Show-Status
        Write-Host "🚀 DFDS.io is now running at http://localhost:3753" -ForegroundColor $ColorGreen
    }
    "start-lb" {
        Start-Containers
        Start-With-LB
        Show-Status
        Write-Host "🚀 DFDS.io is now running at http://localhost" -ForegroundColor $ColorGreen
    }
    "stop" {
        Stop-Containers
    }
    "restart" {
        docker compose restart 2>$null; if ($LASTEXITCODE -ne 0) { docker-compose restart }
        Show-Status
    }
    "logs" {
        docker compose logs -f 2>$null; if ($LASTEXITCODE -ne 0) { docker-compose logs -f }
    }
    "status" {
        Show-Status
    }
    "scale" {
        $replicas = if ($Arg1) { $Arg1 } else { 3 }
        Log-Info "Scaling to $replicas instances..."
        docker compose up -d --scale app=$replicas 2>$null
        if ($LASTEXITCODE -ne 0) { docker-compose up -d --scale app=$replicas }
        Show-Status
    }
    "clean" {
        Log-Warning "This will remove all containers, networks, and volumes!"
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -match "^[yY]$") {
            docker compose down -v --remove-orphans 2>$null
            if ($LASTEXITCODE -ne 0) { docker-compose down -v --remove-orphans }
            Log-Success "Cleanup complete!"
        } else {
            Log-Info "Cleanup cancelled."
        }
    }
    "full" {
        Install-Git
        Install-Node
        Install-Docker
        Setup-Env
        Write-Host ""
        Log-Warning "Please edit .env file with your configuration!"
        Read-Host "Press Enter to continue..."
        Start-Containers
        Show-Status
        Write-Host "🚀 DFDS.io is now running at http://localhost:3753" -ForegroundColor $ColorGreen
    }
    Default {
        Print-Usage
    }
}
