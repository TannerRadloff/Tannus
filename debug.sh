#!/bin/bash

# Debug script for AI Agents Webapp
# This script helps identify and fix common issues

echo "Running debug checks for AI Agents Webapp..."

# Activate virtual environment
source venv/bin/activate

# Check Python version
echo "Checking Python version..."
python_version=$(python --version)
echo "Using $python_version"

# Check if required directories exist
echo "Checking required directories..."
required_dirs=("plans" "agent_states" "agent_workspace" "static/js" "static/css" "templates")
for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "Creating missing directory: $dir"
        mkdir -p "$dir"
    fi
done

# Check if required files exist
echo "Checking required files..."
required_files=("app.py" "requirements.txt" ".env")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Required file missing: $file"
    fi
done

# Check if OpenAI API key is set
echo "Checking OpenAI API key..."
if grep -q "your_openai_api_key_here" .env; then
    echo "WARNING: OpenAI API key not set in .env file"
fi

# Check if all controllers are present
echo "Checking controllers..."
controller_files=(
    "controllers/planning_controller.py"
    "controllers/tracking_controller.py"
    "controllers/updater_controller.py"
    "controllers/handoff_controller.py"
    "controllers/computer_controller.py"
    "controllers/input_controller.py"
    "controllers/indefinite_controller.py"
)
for file in "${controller_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Controller file missing: $file"
    fi
done

# Check if all utility modules are present
echo "Checking utility modules..."
util_files=(
    "utils/agent_manager.py"
    "utils/plan_manager.py"
    "utils/markdown_tracker.py"
    "utils/plan_updater.py"
    "utils/handoff_manager.py"
    "utils/computer_tool_manager.py"
    "utils/indefinite_runner.py"
)
for file in "${util_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Utility file missing: $file"
    fi
done

# Check if all model files are present
echo "Checking model files..."
model_files=(
    "models/planning_system.py"
    "models/planning_agent.py"
)
for file in "${model_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Model file missing: $file"
    fi
done

# Check if frontend files are present
echo "Checking frontend files..."
frontend_files=(
    "templates/index.html"
    "static/css/styles.css"
    "static/js/app.js"
)
for file in "${frontend_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Frontend file missing: $file"
    fi
done

# Check if all dependencies are installed
echo "Checking dependencies..."
pip freeze > installed_packages.txt
missing_packages=()
while IFS= read -r package; do
    if ! grep -q "$package" installed_packages.txt; then
        missing_packages+=("$package")
    fi
done < <(grep -v "^#" requirements.txt)

if [ ${#missing_packages[@]} -gt 0 ]; then
    echo "WARNING: Missing packages:"
    for package in "${missing_packages[@]}"; do
        echo "  - $package"
    done
    echo "Run 'pip install -r requirements.txt' to install missing packages"
fi

rm installed_packages.txt

# Run a simple Flask app check
echo "Checking Flask application..."
if ! python -c "from app import app; print('Flask app check passed')" 2>/dev/null; then
    echo "ERROR: Flask application check failed"
fi

echo "Debug checks completed!"
