#!/bin/bash
# ════════════════════════════════════════════════════
#  TASK UNIVERSE - ONE CLICK INSTALLER
#  Works on: Raspberry Pi, Debian, Ubuntu
#  Usage: curl -fsSL https://raw.githubusercontent.com/
#         YOURUSERNAME/task-universe/main/install.sh | bash
# ════════════════════════════════════════════════════

set -e  # Stop on any error

# ── COLORS ──────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── BANNER ──────────────────────────────────
echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   🎯  TASK UNIVERSE INSTALLER  🎯        ║${NC}"
echo -e "${PURPLE}║   Raspberry Pi To-Do Dashboard           ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── DETECT USER & HOME ──────────────────────
INSTALL_USER=${SUDO_USER:-$USER}
INSTALL_HOME=$(eval echo "~$INSTALL_USER")
APP_DIR="$INSTALL_HOME/task-universe"
echo -e "${CYAN}📁 Install directory: $APP_DIR${NC}"
echo -e "${CYAN}👤 Running as user:   $INSTALL_USER${NC}"
echo ""

# ── STEP 1: UPDATE SYSTEM ───────────────────
echo -e "${YELLOW}[1/7] 🔄 Updating system packages...${NC}"
sudo apt-get update -qq
sudo apt-get install -y curl wget git nano ufw 2>/dev/null
echo -e "${GREEN}      ✅ System updated!${NC}"

# ── STEP 2: INSTALL NODE.JS ─────────────────
echo -e "${YELLOW}[2/7] 📦 Installing Node.js 20...${NC}"
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  echo -e "${GREEN}      ✅ Node.js already installed: $NODE_VER${NC}"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null
  sudo apt-get install -y nodejs 2>/dev/null
  echo -e "${GREEN}      ✅ Node.js $(node --version) installed!${NC}"
fi

# ── STEP 3: INSTALL PM2 ─────────────────────
echo -e "${YELLOW}[3/7] ⚙️  Installing PM2 (process manager)...${NC}"
if command -v pm2 &>/dev/null; then
  echo -e "${GREEN}      ✅ PM2 already installed!${NC}"
else
  sudo npm install -g pm2 --silent
  echo -e "${GREEN}      ✅ PM2 installed!${NC}"
fi

# ── STEP 4: CLONE OR UPDATE REPO ────────────
echo -e "${YELLOW}[4/7] 📥 Getting Task Universe code...${NC}"
if [ -d "$APP_DIR" ]; then
  echo -e "${CYAN}      📂 Directory exists — pulling latest code...${NC}"
  cd "$APP_DIR"
  git pull origin main
else
  git clone https://github.com/YOURUSERNAME/task-universe.git "$APP_DIR"
  cd "$APP_DIR"
fi
echo -e "${GREEN}      ✅ Code ready!${NC}"

# ── STEP 5: INSTALL NODE PACKAGES ───────────
echo -e "${YELLOW}[5/7] 📦 Installing Node.js packages...${NC}"
cd "$APP_DIR"
npm install --silent
echo -e "${GREEN}      ✅ Packages installed!${NC}"

# ── STEP 6: SETUP .ENV ──────────────────────
echo -e "${YELLOW}[6/7] 🔐 Setting up environment...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
  # Generate a random secret key
  RANDOM_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 48 | head -n 1)
  cat > "$APP_DIR/.env" << EOF
JWT_SECRET=${RANDOM_SECRET}
PORT=3000
EOF
  echo -e "${GREEN}      ✅ .env created with random secret key!${NC}"
else
  echo -e "${GREEN}      ✅ .env already exists — keeping it!${NC}"
fi

# ── STEP 7: START WITH PM2 ──────────────────
echo -e "${YELLOW}[7/7] 🚀 Starting Task Universe...${NC}"
cd "$APP_DIR"

# Stop old instance if running
pm2 stop task-universe 2>/dev/null || true
pm2 delete task-universe 2>/dev/null || true

# Start fresh
pm2 start server.js --name "task-universe"
pm2 save

# Setup auto-start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $INSTALL_USER --hp $INSTALL_HOME 2>/dev/null || true
pm2 save

echo -e "${GREEN}      ✅ App started!${NC}"

# ── GET IP ADDRESS ───────────────────────────
LOCAL_IP=$(hostname -I | awk '{print $1}')

# ── DONE BANNER ─────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉  INSTALLATION COMPLETE!  🎉         ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║  🌐 Open in your browser:                ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║  📍 This device:                         ║${NC}"
echo -e "${GREEN}║     http://localhost:3000                ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║  📱 From any device on WiFi:             ║${NC}"
echo -e "${GREEN}║     http://${LOCAL_IP}:3000              ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║  📋 Useful commands:                     ║${NC}"
echo -e "${GREEN}║     pm2 status                           ║${NC}"
echo -e "${GREEN}║     pm2 logs task-universe               ║${NC}"
echo -e "${GREEN}║     pm2 restart task-universe            ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""