# GitHub Actions CI/CD Workflow

This file contains the GitHub Actions workflow configuration for continuous integration and continuous deployment of the Tannus AI Agents Webapp.

## Workflow Overview

The workflow consists of two main jobs:

1. **build-and-test**: Builds the application and runs tests
2. **deploy**: Deploys the application to Cloudflare (only on main branch)

## How to Use

To use this workflow, you need to add it to your GitHub repository by creating a file at `.github/workflows/ci-cd.yml` with the following content:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install backend dependencies
      run: npm ci
    
    - name: Install frontend dependencies
      working-directory: ./frontend
      run: npm ci
    
    - name: Build frontend
      working-directory: ./frontend
      run: npm run build
    
    - name: Run tests
      run: npm test
      
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Wrangler
      run: npm install -g wrangler
    
    - name: Deploy to Cloudflare
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      run: |
        # Deploy frontend to Cloudflare Pages
        cd frontend
        npm ci
        npm run build
        wrangler pages deploy build --project-name=ai-agents-webapp
        
        # Deploy worker to Cloudflare Workers
        cd ../worker
        npm ci
        npm run build:worker
        wrangler deploy
```

## Required Secrets

To use this workflow, you need to add the following secret to your GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with permissions to deploy to Pages and Workers

## Adding the Workflow Manually

Since the current GitHub token doesn't have the 'workflow' scope, you'll need to add this file manually through the GitHub web interface:

1. Go to your repository on GitHub
2. Click on the "Add file" dropdown and select "Create new file"
3. Enter `.github/workflows/ci-cd.yml` as the file name
4. Paste the YAML content above
5. Commit the file

## Troubleshooting

If you encounter issues with the workflow:

1. Check that your Cloudflare API token has the correct permissions
2. Verify that the project names match your Cloudflare configuration
3. Ensure all dependencies are correctly specified in package.json files
