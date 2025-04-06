#!/bin/bash

# Fix script for AI Agents Webapp
# This script fixes common issues identified by the debug script

echo "Running fixes for AI Agents Webapp..."

# Activate virtual environment
source venv/bin/activate

# Fix permissions for script files
echo "Fixing script permissions..."
chmod +x setup.sh
chmod +x start.sh
chmod +x run_tests.sh
chmod +x debug.sh

# Create __init__.py files in all directories to ensure proper Python package structure
echo "Creating __init__.py files for proper package structure..."
touch controllers/__init__.py
touch utils/__init__.py
touch models/__init__.py

# Fix any import issues in the main app.py
echo "Checking for import issues in app.py..."
if ! python -c "import app" 2>/dev/null; then
    echo "Fixing import issues in app.py..."
    # This would contain specific fixes based on the errors encountered
    # For now, we'll just ensure the directory structure is correct
    mkdir -p controllers utils models
fi

# Install any missing dependencies
echo "Installing missing dependencies..."
pip install -r requirements.txt

# Fix any file path issues
echo "Fixing file path issues..."
# Ensure the plans directory exists and has correct permissions
mkdir -p plans
chmod 755 plans

# Ensure the agent_states directory exists and has correct permissions
mkdir -p agent_states
chmod 755 agent_states

# Ensure the agent_workspace directory exists and has correct permissions
mkdir -p agent_workspace
chmod 755 agent_workspace

# Fix any static file issues
echo "Fixing static file issues..."
mkdir -p static/js
mkdir -p static/css
mkdir -p templates

# Copy any missing static files from backups if they exist
if [ -f "static/js/app.js.bak" ] && [ ! -f "static/js/app.js" ]; then
    cp static/js/app.js.bak static/js/app.js
fi

if [ -f "static/css/styles.css.bak" ] && [ ! -f "static/css/styles.css" ]; then
    cp static/css/styles.css.bak static/css/styles.css
fi

if [ -f "templates/index.html.bak" ] && [ ! -f "templates/index.html" ]; then
    cp templates/index.html.bak templates/index.html
fi

# Create a .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    echo "SECRET_KEY=$(python3 -c 'import os; print(os.urandom(24).hex())')" > .env
    echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env
    echo "Please update the OPENAI_API_KEY in the .env file"
fi

echo "Fixes completed! Run debug.sh again to verify all issues are resolved."
