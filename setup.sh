#!/bin/bash

# Setup script for AI Agents Webapp
# This script installs dependencies and prepares the environment

echo "Setting up AI Agents Webapp..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p plans
mkdir -p agent_states
mkdir -p agent_workspace
mkdir -p static/js
mkdir -p static/css
mkdir -p templates

# Set up environment variables
echo "Setting up environment variables..."
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    echo "SECRET_KEY=$(python3 -c 'import os; print(os.urandom(24).hex())')" > .env
    echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env
    echo "Please update the OPENAI_API_KEY in the .env file"
fi

echo "Setup complete! Run the application with: python app.py"
