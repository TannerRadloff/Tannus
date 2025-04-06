#!/bin/bash

# Production deployment script for AI Agents Webapp
# This script builds and deploys the application for production use

set -e

echo "Starting production deployment..."

# Set environment to production
export NODE_ENV=production

# Directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install --production
fi

# Build frontend
echo "Building frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi
npm run build
cd ..

# Create necessary directories
mkdir -p data/plans data/storage logs

# Set proper permissions
chmod -R 755 data
chmod -R 755 logs

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  echo "NODE_ENV=production" > .env
  echo "PORT=5000" >> .env
  echo "HOST=0.0.0.0" >> .env
  echo "LOG_LEVEL=info" >> .env
  
  # Prompt for OpenAI API key if not set
  if [ -z "$OPENAI_API_KEY" ]; then
    echo "Please enter your OpenAI API key:"
    read -s api_key
    echo "OPENAI_API_KEY=$api_key" >> .env
  else
    echo "OPENAI_API_KEY=$OPENAI_API_KEY" >> .env
  fi
fi

# Create config.json file if it doesn't exist
if [ ! -f "config.json" ]; then
  echo "Creating config.json file..."
  cat > config.json << EOF
{
  "server": {
    "port": 5000,
    "host": "0.0.0.0",
    "environment": "production",
    "cors": true,
    "corsOrigins": ["*"],
    "bodyLimit": "10mb",
    "compression": true,
    "helmet": true,
    "sessionSecret": "$(openssl rand -hex 32)",
    "sessionExpiry": 86400000
  },
  "logging": {
    "level": "info",
    "format": "json",
    "console": true,
    "requests": true,
    "colors": false,
    "file": "./logs/app.log",
    "rotation": {
      "maxSize": 10485760,
      "maxFiles": 10,
      "compress": true
    }
  },
  "agent": {
    "enablePlanCreation": true,
    "enableIndefiniteRunning": true,
    "defaultCheckpointInterval": 300000,
    "maxRuntime": 3600000,
    "enableMemory": true,
    "maxMemoryTokens": 10000,
    "enableTools": true,
    "availableTools": ["web-search", "file-system", "code-execution"],
    "enableHandoff": true
  }
}
EOF
fi

# Setup process manager (PM2)
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2 process manager..."
  npm install -g pm2
fi

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ai-agents-webapp',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true
  }]
};
EOF

# Start or restart the application with PM2
if pm2 list | grep -q "ai-agents-webapp"; then
  echo "Restarting application with PM2..."
  pm2 restart ai-agents-webapp
else
  echo "Starting application with PM2..."
  pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
echo "Setting up PM2 to start on system boot..."
pm2 startup

echo "Deployment complete! The application is running at http://localhost:5000"
echo "To monitor the application, use: pm2 monit"
echo "To view logs, use: pm2 logs ai-agents-webapp"
