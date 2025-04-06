#!/bin/bash

# Docker deployment script for AI Agents Webapp
# This script builds and deploys the application using Docker

set -e

echo "Starting Docker deployment..."

# Directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  echo "NODE_ENV=production" > .env
  echo "PORT=5000" >> .env
  
  # Prompt for OpenAI API key if not set
  if [ -z "$OPENAI_API_KEY" ]; then
    echo "Please enter your OpenAI API key:"
    read -s api_key
    echo "OPENAI_API_KEY=$api_key" >> .env
  else
    echo "OPENAI_API_KEY=$OPENAI_API_KEY" >> .env
  fi
fi

# Create Docker Compose file
cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    env_file:
      - .env
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
EOF

# Create Dockerfile
cat > Dockerfile << EOF
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy frontend files
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend and server files
COPY --from=builder /app/frontend/build ./frontend/build
COPY --from=builder /app/app.js ./
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/models ./models
COPY --from=builder /app/services ./services
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/interfaces ./interfaces
COPY --from=builder /app/config ./config
COPY --from=builder /app/types.ts ./
COPY --from=builder /app/container.ts ./

# Create necessary directories
RUN mkdir -p data/plans data/storage logs

# Set proper permissions
RUN chmod -R 755 data logs

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["node", "app.js"]
EOF

# Create .dockerignore file
cat > .dockerignore << EOF
node_modules
frontend/node_modules
npm-debug.log
.git
.gitignore
.env
data
logs
*.md
EOF

# Build and start Docker containers
echo "Building and starting Docker containers..."
docker-compose up -d --build

echo "Deployment complete! The application is running at http://localhost:5000"
echo "To view logs, use: docker-compose logs -f"
echo "To stop the application, use: docker-compose down"
