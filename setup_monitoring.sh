#!/bin/bash

# Monitoring and logging setup script for AI Agents Webapp
# This script configures monitoring and logging for the application

set -e

echo "Setting up monitoring and logging for AI Agents Webapp..."

# Directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "Installing Wrangler CLI..."
  npm install -g wrangler
fi

# Login to Cloudflare if not already logged in
echo "Checking Cloudflare login status..."
if ! wrangler whoami &> /dev/null; then
  echo "Please login to Cloudflare:"
  wrangler login
fi

# Enable Cloudflare Analytics
echo "Enabling Cloudflare Analytics..."
echo "Please follow these steps to enable analytics:"
echo "1. Log in to your Cloudflare dashboard"
echo "2. Select your domain"
echo "3. Go to Analytics & Logs > Web Analytics"
echo "4. Enable Web Analytics for your domain"
echo ""
echo "For Workers analytics:"
echo "1. Go to Workers & Pages"
echo "2. Select your worker (ai-agents-webapp-worker)"
echo "3. Go to Analytics tab"
echo "4. View request statistics and performance metrics"

# Set up error tracking with Sentry
echo "Would you like to set up error tracking with Sentry? (y/n)"
read setup_sentry

if [[ $setup_sentry == "y" ]]; then
  # Check if Sentry CLI is installed
  if ! command -v sentry-cli &> /dev/null; then
    echo "Installing Sentry CLI..."
    npm install -g @sentry/cli
  fi
  
  echo "Please enter your Sentry DSN:"
  read sentry_dsn
  
  # Add Sentry to frontend
  echo "Adding Sentry to frontend..."
  cd frontend
  npm install @sentry/react @sentry/tracing
  
  # Create Sentry configuration file
  cat > src/sentry.js << EOF
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: "${sentry_dsn}",
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.5,
  environment: process.env.NODE_ENV
});

export default Sentry;
EOF
  
  # Update index.js to import Sentry
  sed -i '1s/^/import ".\/sentry";\n/' src/index.tsx
  
  # Rebuild frontend
  npm run build
  cd ..
  
  # Add Sentry to worker
  echo "Adding Sentry to worker..."
  cd worker
  npm install @sentry/node
  
  # Create Sentry configuration file
  mkdir -p src/utils
  cat > src/utils/sentry.js << EOF
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: "${sentry_dsn}",
  tracesSampleRate: 0.5,
  environment: process.env.ENVIRONMENT || 'production'
});

export default Sentry;
EOF
  
  # Update index.js to import Sentry
  sed -i '1s/^/import Sentry from ".\/utils\/sentry";\n/' src/index.js
  
  # Add error reporting to API endpoints
  sed -i 's/catch (error) {/catch (error) {\n    Sentry.captureException(error);/g' src/index.js
  
  # Rebuild worker
  npm run build:worker
  cd ..
  
  echo "Sentry error tracking has been set up successfully!"
fi

# Set up logging with Cloudflare Logpush
echo "Would you like to set up Cloudflare Logpush for centralized logging? (y/n)"
read setup_logpush

if [[ $setup_logpush == "y" ]]; then
  echo "Please follow these steps to set up Logpush:"
  echo "1. Log in to your Cloudflare dashboard"
  echo "2. Select your domain"
  echo "3. Go to Analytics & Logs > Logpush"
  echo "4. Click 'Create a job'"
  echo "5. Select the data sets you want to push (HTTP requests, Workers, etc.)"
  echo "6. Choose your destination (e.g., AWS S3, Google Cloud Storage, Sumo Logic)"
  echo "7. Follow the prompts to complete the setup"
  echo ""
  echo "For more information, visit: https://developers.cloudflare.com/logs/logpush/"
fi

# Set up uptime monitoring
echo "Setting up uptime monitoring with Cloudflare Health Checks..."
echo "Please follow these steps to set up Health Checks:"
echo "1. Log in to your Cloudflare dashboard"
echo "2. Select your domain"
echo "3. Go to Traffic > Health Checks"
echo "4. Click 'Create'"
echo "5. Configure a health check for your frontend (https://your-domain.com)"
echo "6. Configure a health check for your API (https://api.your-domain.com/api/health)"
echo "7. Set up notifications for when health checks fail"

# Set up performance monitoring
echo "Setting up performance monitoring..."
echo "Cloudflare Web Analytics provides performance monitoring for your frontend."
echo "For more detailed monitoring, consider setting up:"
echo "1. Cloudflare Page Shield for frontend security monitoring"
echo "2. Cloudflare Workers Traces for backend performance monitoring"

echo "Monitoring and logging setup complete!"
echo "Your application now has:"
echo "- Analytics through Cloudflare Web Analytics"
if [[ $setup_sentry == "y" ]]; then
  echo "- Error tracking through Sentry"
fi
if [[ $setup_logpush == "y" ]]; then
  echo "- Centralized logging through Cloudflare Logpush"
fi
echo "- Uptime monitoring through Cloudflare Health Checks"
echo "- Performance monitoring through Cloudflare Web Analytics"
echo ""
echo "To view your analytics and monitoring data, visit your Cloudflare dashboard."
