#!/bin/bash

# Run tests for AI Agents Webapp
# This script runs unit tests and integration tests

echo "Running tests for AI Agents Webapp..."

# Activate virtual environment
source venv/bin/activate

# Run integration tests
echo "Running integration tests..."
python integration_test.py

# Check if any tests failed
if [ $? -ne 0 ]; then
    echo "Integration tests failed!"
    exit 1
fi

echo "All tests passed!"
