#!/bin/bash
# ── UPDATE SCRIPT ────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${YELLOW}🔄 Pulling latest code from GitHub...${NC}"
cd "$APP_DIR"
git pull origin main

echo -e "${YELLOW}📦 Installing any new packages...${NC}"
npm install --silent

echo -e "${YELLOW}🔁 Restarting app...${NC}"
pm2 restart task-universe

echo -e "${GREEN}✅ Update complete!${NC}"
pm2 status