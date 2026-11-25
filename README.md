# 🎯 Task Universe

> Colorful To-Do Dashboard — runs on Raspberry Pi!
> Access from anywhere in the world via your own domain!

![Task Universe](https://img.shields.io/badge/Task-Universe-FF6B6B?style=for-the-badge&logo=raspberry-pi)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-Database-blue?style=for-the-badge&logo=sqlite)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Tunnel-orange?style=for-the-badge&logo=cloudflare)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 Colorful Dashboard | Beautiful animated dark theme UI |
| 🕐 Analog Clock | Live analog + digital clock |
| 👤 Personal Tasks | Your own personal tasks |
| 💼 Office Tasks | Work related tasks |
| 📚 Education Tasks | Learning tasks with subtasks |
| 📋 Sub-tasks Tree | Sub-tasks visible below each task |
| ✅ One Click Complete | Circle button to complete task |
| ✏️ Edit Tasks | Edit title, description, status, priority |
| ⏰ Task Alarm | Alarm with sound notification |
| 🔔 Browser Notification | Desktop popup notification |
| 🔊 Complete Sound | Beep sound when task done |
| 👥 Multi-User | 2-3 people can share and see tasks |
| 🎨 Color Identity | Each user has their own color |
| 🔁 Daily Recurring | Lunch, Dinner, Water daily tasks |
| 📱 Mobile Friendly | Works on phone and tablet |
| 🌍 Public Access | Access from anywhere via domain |
| 🔒 Secure Login | JWT token authentication |
| 🔄 Auto Refresh | Tasks refresh every 30 seconds |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Hardware | Raspberry Pi 3 (ARM64) |
| OS | Debian GNU Linux 13 Trixie |
| Backend | Node.js 20 + Express |
| Database | SQLite3 (no setup needed!) |
| Frontend | Pure HTML + CSS + JavaScript |
| Process Manager | PM2 (auto restart) |
| Tunnel | Cloudflare Tunnel (free) |
| Domain | Hostinger |
| SSL | Cloudflare (free HTTPS) |

---

## 🚀 One Click Install

```bash
cd ~
git clone https://github.com/srinivasan-periyasamy/task-universe.git
cd task-universe
bash install.sh
```

---

## 📋 Manual Step by Step Install

### STEP 1 — Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git curl wget -y
```

### STEP 2 — Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
node --version
npm --version
```

### STEP 3 — Install PM2
```bash
sudo npm install -g pm2
```

### STEP 4 — Clone Repository
```bash
cd ~
git clone https://github.com/srinivasan-periyasamy/task-universe.git
cd task-universe
```

### STEP 5 — Install Packages
```bash
npm install
```

### STEP 6 — Create .env File
```bash
cp .env.example .env
```

Edit .env and change secret:
```bash
nano .env
```
```
JWT_SECRET=YourOwnSecretKeyHere2024
PORT=3000
```

### STEP 7 — Start App
```bash
pm2 start server.js --name "task-universe"
pm2 save
pm2 startup
```

> ⚠️ Copy the command pm2 startup gives you and run it!

```bash
# Example (your command will be different):
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u srinivasan --hp /home/srinivasan
pm2 save
```

### STEP 8 — Open in Browser
```
Local:        http://localhost:3000
Network:      http://192.168.0.101:3000
```

---

## 🌍 Public Access Setup (Cloudflare Tunnel)

### STEP 1 — Buy Domain
```
Go to → https://www.hostinger.com
Buy your domain → example: taskuniverse.com
```

### STEP 2 — Create Cloudflare Account
```
Go to → https://cloudflare.com
Sign up FREE account
Add your domain
Copy the 2 nameservers Cloudflare gives you
```

### STEP 3 — Update Hostinger Nameservers
```
Hostinger → Domains → Manage → Nameservers
Change to Custom Nameservers
Add Cloudflare nameservers
Save → Wait 10-30 minutes
```

### STEP 4 — Install Cloudflare Tunnel on Pi
```bash
cd ~
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb
cloudflared --version
```

### STEP 5 — Login to Cloudflare
```bash
cloudflared tunnel login
```
```
Copy the URL it shows
Open in browser
Select your domain
Click Authorize
```

### STEP 6 — Create Tunnel
```bash
cloudflared tunnel create task-universe
```
```
Copy the Tunnel ID it shows!
Example: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### STEP 7 — Create Config File
```bash
nano ~/.cloudflared/config.yml
```

Paste this (replace YOUR values):
```yaml
tunnel: YOUR-TUNNEL-ID-HERE
credentials-file: /home/srinivasan/.cloudflared/YOUR-TUNNEL-ID-HERE.json

ingress:
  - hostname: yourdomain.com
    service: http://localhost:3000
  - hostname: www.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Save: `Ctrl+X` → `Y` → `Enter`

### STEP 8 — Add DNS Routes
```bash
cloudflared tunnel route dns task-universe yourdomain.com
cloudflared tunnel route dns task-universe www.yourdomain.com
```

### STEP 9 — Test Tunnel
```bash
cloudflared tunnel run task-universe
```
```
Open browser → yourdomain.com
If Task Universe shows = ✅ Working!
Press Ctrl+C to stop test
```

### STEP 10 — Make Tunnel Auto Start
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
sudo systemctl status cloudflared
```

---

## 🔄 Auto Start on Reboot

Both PM2 and Cloudflare Tunnel auto start when Pi reboots!

```bash
# Verify PM2 auto start
pm2 list
pm2 save

# Verify Cloudflare auto start
sudo systemctl is-enabled cloudflared
# Should show → enabled ✅
```

### Test Reboot
```bash
sudo reboot
# Wait 1-2 minutes
# Open your domain → should work! ✅
```

---

## 📋 Daily Commands

```bash
# Check everything running
pm2 status
sudo systemctl status cloudflared

# Restart app
pm2 restart task-universe

# Restart tunnel
sudo systemctl restart cloudflared

# Restart both
pm2 restart task-universe && sudo systemctl restart cloudflared

# View app logs
pm2 logs task-universe

# View tunnel logs
sudo journalctl -u cloudflared -f

# Stop app
pm2 stop task-universe

# Stop tunnel
sudo systemctl stop cloudflared
```

---

## 🔄 Update App from GitHub

```bash
cd ~/task-universe && git pull && npm install && pm2 restart task-universe
```

Or use the update script:
```bash
bash update.sh
```

---

## 👥 Multi User Setup

```
1. Open your domain in browser
2. Click "Register"
3. Each person creates their own account
4. Pick different colors to identify each other

Person 1 → Username: srinivasan  Color: 🔴 Red
Person 2 → Username: friend1     Color: 🔵 Blue
Person 3 → Username: friend2     Color: 🟢 Green

All users can:
✅ See ALL tasks from everyone
✅ Add their own tasks
✅ Edit their own tasks
✅ Delete their own tasks
✅ See who owns which task (by color)
✅ Add sub-tasks to their tasks
✅ Set alarms on tasks
✅ Create daily recurring tasks
```

---

## 🗂️ Project Structure

```
task-universe/
├── server.js          ← Backend API (Node.js + Express)
├── database.js        ← SQLite database setup
├── package.json       ← Node.js dependencies
├── .env.example       ← Environment variables template
├── .env               ← Your actual config (not in git!)
├── .gitignore         ← Files to ignore in git
├── install.sh         ← One click install script
├── update.sh          ← Update from GitHub script
├── start.sh           ← Start app script
├── stop.sh            ← Stop app script
├── README.md          ← This file!
└── public/
    └── index.html     ← Frontend (full dashboard UI)
```

---

## 🗄️ Database Tables

```
users          → Login accounts + color
tasks          → All tasks (personal/office/education)
subtasks       → Sub-tasks under each task
recurring_tasks → Daily task templates
recurring_log  → Daily task completion log
```

---

## 🔒 Security

```
✅ Passwords hashed with bcryptjs (12 rounds)
✅ JWT tokens (30 day expiry)
✅ HTTPS via Cloudflare SSL (free)
✅ .env file never pushed to GitHub
✅ Database file never pushed to GitHub
```

---

## ❓ Troubleshooting

### App not starting?
```bash
pm2 logs task-universe
cd ~/task-universe && npm install
pm2 restart task-universe
```

### Can't login / delete / edit?
```bash
# Clear browser storage
# Open browser console (F12) → Console tab → type:
localStorage.clear()
# Press F5 and login again
```

### Domain not working?
```bash
sudo systemctl status cloudflared
sudo systemctl restart cloudflared
sudo journalctl -u cloudflared -f
```

### Database issues?
```bash
cd ~/task-universe
sqlite3 todos.db "SELECT id, username FROM users;"
sqlite3 todos.db ".tables"
```

### Port already in use?
```bash
sudo lsof -i :3000
pm2 delete task-universe
pm2 start server.js --name "task-universe"
```

---

## 🌐 Access URLs

```
Local (Pi itself):     http://localhost:3000
Local Network (WiFi):  http://192.168.0.101:3000
Public (anywhere):     https://yourdomain.com
```

---

## 📱 Works On

```
✅ Desktop Browser (Chrome, Firefox, Edge)
✅ Mobile Browser (Android, iPhone)
✅ Tablet
✅ Any device with a browser!
```

---

## 🙏 Credits

Built with ❤️ by Srinivasan Periyasamy
Running on Raspberry Pi 3 — Debian GNU Linux 13 Trixie ARM64

---

## 📄 License

MIT License — Free to use and modify!
