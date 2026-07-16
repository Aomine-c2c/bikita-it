#!/bin/bash
# start-wsl.sh
# This script pulls the latest code, installs dependencies, builds, and starts the apps using PM2.

echo "============================================="
echo "   BikitaIT Auto-Update & Start Script (WSL) "
echo "============================================="

echo "[1/4] 🔄 Pulling latest changes from GitHub..."
git pull origin main

echo "[2/4] 📦 Installing dependencies..."
npm install

echo "[3/4] 🏗️ Building the project..."
npm run build

echo "[4/4] 🚀 Starting BikitaIT platform via PM2..."

# Check if PM2 is installed, if not, install it globally
if ! command -v pm2 &> /dev/null
then
    echo "PM2 could not be found, installing globally..."
    sudo npm install -g pm2
fi

# Restart processes if they exist, or start them
pm2 delete bikita-api 2>/dev/null || true
pm2 delete bikita-web 2>/dev/null || true

# Start NestJS API
pm2 start npm --name "bikita-api" -- run start:prod --workspace=apps/api

# Start Next.js Web App
pm2 start npm --name "bikita-web" -- run start --workspace=apps/web

# Save PM2 state to resurrect on boot
pm2 save

# Get the WSL host IP
WSL_IP=$(hostname -I | awk '{print $1}')

echo "============================================="
echo "✅ BikitaIT is running successfully!"
echo "🌐 Access the Web UI from any PC on your network:"
echo "   http://$WSL_IP:3000"
echo ""
echo "📊 Access the API at:"
echo "   http://$WSL_IP:3001/api"
echo "============================================="
echo "To view live logs, run: pm2 logs"
