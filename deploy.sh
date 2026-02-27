#!/bin/bash
echo "🚀 Starting Deployment..."
git pull origin main
npm install
pm2 restart billing-prod
echo "✅ Deployment Successful!"
