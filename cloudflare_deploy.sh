#!/bin/bash

# Cloudflare deployment script for AI Agents Webapp
# This script deploys the application to Cloudflare Pages and Workers

set -e

echo "Starting Cloudflare deployment..."

# Directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "Installing Wrangler CLI..."
  npm install -g wrangler
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  echo "NODE_ENV=production" > .env
  
  # Prompt for OpenAI API key if not set
  if [ -z "$OPENAI_API_KEY" ]; then
    echo "Please enter your OpenAI API key:"
    read -s api_key
    echo "OPENAI_API_KEY=$api_key" >> .env
  else
    echo "OPENAI_API_KEY=$OPENAI_API_KEY" >> .env
  fi
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

# Build worker
echo "Building worker..."
cd worker
if [ ! -d "node_modules" ]; then
  echo "Installing worker dependencies..."
  npm install
fi
npm run build:worker
cd ..

# Login to Cloudflare if not already logged in
echo "Checking Cloudflare login status..."
if ! wrangler whoami &> /dev/null; then
  echo "Please login to Cloudflare:"
  wrangler login
fi

# Create D1 database if it doesn't exist
echo "Setting up D1 database..."
if ! wrangler d1 list | grep -q "ai_agents_db"; then
  echo "Creating D1 database..."
  wrangler d1 create ai_agents_db
  
  # Update wrangler.toml with database ID
  DB_ID=$(wrangler d1 list | grep ai_agents_db | awk '{print $1}')
  sed -i "s/database_id = \"\"/database_id = \"$DB_ID\"/g" worker/wrangler.toml
  sed -i "s/database_id = \"\"/database_id = \"$DB_ID\"/g" cloudflare.toml
  
  # Apply migrations
  echo "Applying database migrations..."
  wrangler d1 migrations apply ai_agents_db --local
fi

# Create KV namespaces if they don't exist
echo "Setting up KV namespaces..."
if ! wrangler kv:namespace list | grep -q "PLANS_STORAGE"; then
  echo "Creating PLANS_STORAGE namespace..."
  wrangler kv:namespace create PLANS_STORAGE
  
  # Update wrangler.toml with namespace ID
  PLANS_ID=$(wrangler kv:namespace list | grep PLANS_STORAGE | awk '{print $1}')
  sed -i "s/id = \"\"/id = \"$PLANS_ID\"/g" worker/wrangler.toml
  sed -i "s/id = \"\"/id = \"$PLANS_ID\"/g" cloudflare.toml
fi

if ! wrangler kv:namespace list | grep -q "AGENT_STORAGE"; then
  echo "Creating AGENT_STORAGE namespace..."
  wrangler kv:namespace create AGENT_STORAGE
  
  # Update wrangler.toml with namespace ID
  AGENT_ID=$(wrangler kv:namespace list | grep AGENT_STORAGE | awk '{print $1}')
  sed -i "s/id = \"\"/id = \"$AGENT_ID\"/g" worker/wrangler.toml
  sed -i "s/id = \"\"/id = \"$AGENT_ID\"/g" cloudflare.toml
fi

# Deploy worker
echo "Deploying worker..."
cd worker
wrangler deploy
cd ..

# Deploy frontend to Cloudflare Pages
echo "Deploying frontend to Cloudflare Pages..."
wrangler pages deploy frontend/build --project-name=ai-agents-webapp

echo "Deployment complete!"
echo "Your application is now available at the following URLs:"
echo "Frontend: https://ai-agents-webapp.pages.dev"
echo "API: https://ai-agents-webapp-worker.workers.dev"
echo ""
echo "To set up a custom domain, run: ./setup_domain.sh"
echo "To set up monitoring, run: ./setup_monitoring.sh"
