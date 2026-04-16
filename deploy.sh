#!/bin/bash
# ===================================================
# CloudVault EC2 Deployment Script
# Run on a fresh Ubuntu 22.04 EC2 instance
# ===================================================

set -e

echo "🚀 CloudVault Deployment Script"
echo "================================"

# --- Update system ---
echo "📦 Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# --- Install Docker ---
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# --- Install Docker Compose ---
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully"
else
    echo "Docker Compose already installed"
fi

# --- Setup project ---
echo "📂 Setting up project..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║  IMPORTANT: Edit .env with your credentials!  ║"
    echo "║  nano .env                                    ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "Required values to update:"
    echo "  - AWS_ACCESS_KEY_ID"
    echo "  - AWS_SECRET_ACCESS_KEY"
    echo "  - AWS_S3_BUCKET"
    echo "  - JWT_SECRET (change to a random string)"
    echo "  - DB_PASSWORD (change for production)"
    echo ""
    read -p "Press Enter after editing .env to continue..."
fi

# --- Build and start ---
echo "🔨 Building containers..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "================================"
echo "✅ CloudVault is deployed!"
echo ""
echo "🌐 Frontend:  http://$(curl -s ifconfig.me)"
echo "📡 Backend:   http://$(curl -s ifconfig.me):5000"
echo "🏥 Health:    http://$(curl -s ifconfig.me):5000/health"
echo ""
echo "📋 Useful commands:"
echo "   docker-compose logs -f        # View logs"
echo "   docker-compose ps             # Check status"
echo "   docker-compose down           # Stop services"
echo "   docker-compose up -d --build  # Rebuild & restart"
echo "================================"
