#!/bin/bash

# Start script for AI Agents Webapp
# This script starts the Flask application

echo "Starting AI Agents Webapp..."

# Activate virtual environment
source venv/bin/activate

# Set Flask environment variables
export FLASK_APP=app.py
export FLASK_ENV=development

# Start the application
echo "Starting Flask application on http://localhost:5000"
python app.py
