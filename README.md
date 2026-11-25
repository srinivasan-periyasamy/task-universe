# 🎯 Task Universe

> Colorful To-Do Dashboard — runs on Raspberry Pi!
> Access from anywhere on your network.

## ✨ Features
- 🎨 Colorful animated dashboard
- 👤 Personal / 💼 Office / 📚 Education tasks
- 📋 Sub-tasks (e.g. Linux → Disk, File, Network)
- ⏰ Task alarms with browser notifications
- 👥 Multi-user (2-3 people can share)
- 📱 Mobile friendly
- 🔒 Secure login with JWT

## 🚀 One-Click Install

```bash
curl -fsSL https://raw.githubusercontent.com/YOURUSERNAME/task-universe/main/install.sh | bash
```

## 📋 Manual Install

```bash
git clone https://github.com/YOURUSERNAME/task-universe.git
cd task-universe
bash install.sh
```

## 🌐 Access

After install, open browser:
```
http://192.168.0.101:3000
```

## 📋 Commands

```bash
pm2 status                    # Check if running
pm2 logs task-universe        # See logs
pm2 restart task-universe     # Restart
bash update.sh                # Update from GitHub
bash stop.sh                  # Stop
bash start.sh                 # Start
```

## 🛠️ Tech Stack
- **Backend**: Node.js + Express
- **Database**: SQLite (no setup needed!)
- **Frontend**: Pure HTML/CSS/JS
- **Process**: PM2
- **Hardware**: Raspberry Pi 3