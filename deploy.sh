#!/bin/bash
echo "🚀 Starting Enterprise Deployment..."
git pull origin main
npm install

echo "🔄 Restarting API and Background Worker..."
# Restarting via ecosystem handles both processes
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

echo "✅ Deployment Successful!"
