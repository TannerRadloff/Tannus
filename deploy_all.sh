#!/bin/bash

# Main deployment script for AI Agents Webapp
# This script runs all the necessary steps to deploy the application to Cloudflare

set -e

echo "Starting AI Agents Webapp deployment process..."

# Directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Make all scripts executable
chmod +x cloudflare_deploy.sh
chmod +x setup_domain.sh
chmod +x setup_monitoring.sh

# Step 1: Deploy to Cloudflare
echo "Step 1: Deploying to Cloudflare..."
./cloudflare_deploy.sh

# Step 2: Set up custom domain and SSL
echo "Step 2: Setting up custom domain and SSL..."
./setup_domain.sh

# Step 3: Set up monitoring and logging
echo "Step 3: Setting up monitoring and logging..."
./setup_monitoring.sh

echo "Deployment process complete!"
echo ""
echo "Your AI Agents Webapp is now permanently deployed with:"
echo "- Frontend and backend on Cloudflare"
echo "- Custom domain and SSL"
echo "- Monitoring and logging"
echo ""
echo "You can access your application at:"
echo "- Frontend: https://ai-agents-webapp.pages.dev"
echo "- API: https://ai-agents-webapp-worker.workers.dev"
echo ""
echo "If you configured a custom domain, you can also access it at your domain once DNS propagation is complete."
echo ""
echo "Thank you for using AI Agents Webapp!"
