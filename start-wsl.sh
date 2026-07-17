#!/bin/bash
# start-wsl.sh
# Starts BikitaIT platform using PM2 on WSL.
#
# WARNING: Removed the destructive `git reset --hard origin/main`.
# That command was wiping out local fixes every time you ran this script.
# If you want to update from GitHub, run manually:
#   git pull origin main
# then run this script again.

set -e

handle_error() {
    echo ""
    echo "❌ ERROR: The script failed to execute a command."
    echo "Please check the logs above to see what went wrong."
    exit 1
}
trap 'handle_error' ERR

echo "============================================="
echo "   BikitaIT  Start Script (WSL) "
echo "============================================="

# ── Ensure .env files exist ───────────────────────
echo "[1/4] 📁 Checking environment files..."

# API .env
if [ ! -f apps/api/.env ]; then
  cat > apps/api/.env << 'EOF'
DATABASE_URL="postgresql://xiphos:xiphos_password@localhost:5432/xiphos_db?schema=public"
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
EOF
  echo "   Created apps/api/.env with defaults."
fi

# Web .env
if [ ! -f apps/web/.env ]; then
  cat > apps/web/.env << 'EOF'
API_INTERNAL_URL=http://127.0.0.1:3001
NEXT_PUBLIC_API_URL=/api
EOF
  echo "   Created apps/web/.env with defaults."
fi

# ── Install dependencies (cached) ────────────────
echo "[2/4] 📦 Installing dependencies..."
npm ci --prefer-offline 2>/dev/null || npm install
(cd apps/api && npm ci --prefer-offline 2>/dev/null || npm install)
(cd apps/web && npm ci --prefer-offline 2>/dev/null || npm install)

# ── Build ─────────────────────────────────────────
echo "[3/4] 🏗️ Building project..."
cd apps/api
npx prisma generate --no-hints 2>/dev/null || npx prisma generate
npx prisma db push --accept-data-loss 2>/dev/null || echo "   ⚠️  DB push failed — check Postgres is running"
cd ../..

npm run build 2>/dev/null || {
  echo "   ⚠️  Root build skipped (workspaces may handle this)."
  (cd apps/api && npm run build)
  (cd apps/web && npm run build)
}

# ── Start with PM2 ────────────────────────────────
echo "[4/4] 🚀 Starting services via PM2..."
command -v pm2 &>/dev/null || npm install -g pm2

pm2 delete bikita-api bikita-web 2>/dev/null || true

cd apps/api
pm2 start npm --name "bikita-api" -- run start:prod
cd ../..

cd apps/web
pm2 start npm --name "bikita-web" -- run start
cd ../..

pm2 save

WSL_IP=$(ip -4 addr show eth0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || echo "localhost")

echo ""
echo "============================================="
echo "✅ BikitaIT is running!"
echo "🌐 Web UI:  http://$WSL_IP:3000"
echo "📊 API:     http://$WSL_IP:3001/api"
echo "============================================="
echo "📋 Logs: pm2 logs"
echo "🛑 Stop:  pm2 delete all"
