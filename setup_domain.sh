#!/bin/bash

# Domain and SSL setup script for AI Agents Webapp
# This script configures a custom domain and SSL certificate for the application

set -e

echo "Starting domain and SSL setup..."

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

# Prompt for domain name
echo "Please enter your custom domain name (e.g., ai-agents.example.com):"
read domain_name

# Validate domain format
if [[ ! $domain_name =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
  echo "Invalid domain format. Please enter a valid domain name."
  exit 1
fi

# Check if domain is already set up
echo "Checking if domain is already configured..."
if wrangler pages domain list --project-name=ai-agents-webapp | grep -q "$domain_name"; then
  echo "Domain $domain_name is already configured for this project."
else
  # Add custom domain to Cloudflare Pages
  echo "Adding custom domain to Cloudflare Pages..."
  wrangler pages domain add --project-name=ai-agents-webapp "$domain_name"
  
  echo "Domain added to Cloudflare Pages. Please follow these steps to complete the setup:"
  echo ""
  echo "1. Log in to your Cloudflare account"
  echo "2. Add the domain to your Cloudflare account if it's not already there"
  echo "3. Update your domain's nameservers to point to Cloudflare"
  echo "4. Create a CNAME record pointing $domain_name to ai-agents-webapp.pages.dev"
  echo ""
  echo "SSL certificate will be automatically provisioned by Cloudflare once DNS is configured correctly."
fi

# Set up custom domain for the Worker API
echo "Setting up custom domain for the API..."
api_subdomain="api.$domain_name"

echo "Would you like to set up the API at $api_subdomain? (y/n)"
read setup_api_domain

if [[ $setup_api_domain == "y" ]]; then
  # Add custom domain to Cloudflare Worker
  echo "Adding custom domain to Cloudflare Worker..."
  wrangler route add "$api_subdomain/*" ai-agents-webapp-worker
  
  echo "API domain setup complete. Please create a CNAME record pointing $api_subdomain to ai-agents-webapp-worker.workers.dev"
fi

echo "Domain and SSL setup complete!"
echo "Your application will be available at: https://$domain_name"
if [[ $setup_api_domain == "y" ]]; then
  echo "Your API will be available at: https://$api_subdomain"
fi
echo ""
echo "Note: It may take up to 24 hours for DNS changes to propagate and SSL certificates to be issued."
