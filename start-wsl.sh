#!/bin/bash
# start-wsl.sh
# This script pulls the latest code, installs dependencies, builds, and starts the apps using PM2.

echo "============================================="
echo "   BikitaIT Auto-Update & Start Script (WSL) "
echo "============================================="

echo "[1/4] 🔄 Pulling latest changes from GitHub..."
git fetch origin main
git reset --hard origin/main

echo "[2/4] 📦 Installing dependencies..."
npm install

echo "[3/4] 🏗️ Building the project..."
# Push schema and generate Prisma client
cd apps/api
if [ ! -f .env ]; then
  echo "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/bikitait?schema=public\"" > .env
  echo "Created default .env for Prisma."
fi
npx prisma db push --accept-data-loss
npx prisma generate
cd ../..
npm run build

echo "[4/4] 🚀 Starting BikitaIT platform via PM2..."

# Check if PM2 is installed, if not, install it globally
if ! command -v pm2 &> /dev/null
then
    echo "PM2 could not be found, installing globally..."
    npm install -g pm2
fi

# Restart processes if they exist, or start them
pm2 delete bikita-api 2>/dev/null || true
pm2 delete bikita-web 2>/dev/null || true

# Start NestJS API
cd apps/api
pm2 start npm --name "bikita-api" -- run start:prod
cd ../..

# Start Next.js Web App
cd apps/web
pm2 start npm --name "bikita-web" -- run start
cd ../..

# Save PM2 state to resurrect on boot
pm2 save

# Get the WSL host IP
WSL_IP=$(ip -4 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')

echo "============================================="
echo "✅ BikitaIT is running successfully!"
echo "🌐 Access the Web UI from any PC on your network:"
echo "   http://$WSL_IP:3000"
echo ""
echo "📊 Access the API at:"
echo "   http://$WSL_IP:3001/api"
echo "============================================="
echo "To view live logs, run: pm2 logs"
