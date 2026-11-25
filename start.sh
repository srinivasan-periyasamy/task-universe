#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting Task Universe..."
pm2 start server.js --name "task-universe"
pm2 status
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "✅ Open: http://$LOCAL_IP:3000"