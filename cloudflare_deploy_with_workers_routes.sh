#!/bin/bash

# Workers Routes Deployment Script for Tannus AI Agents Webapp to airountable.com
# This script uses Workers Routes instead of CNAMEs to avoid cross-account issues

set -e

echo "Starting Workers Routes deployment for airountable.com..."

# Cloudflare API tokens
WORKER_TOKEN="YhDmpPUzI2jx3S2Rcc67mV2qPM3Gd87czuVZvuNI"
DNS_TOKEN="ixky2ZncB1a-aW5Z7qIjG5SdUVxhMQsNr2mCq2OC"
TOKEN_MGMT_TOKEN="v6Put9Nd80CHE7Q_lcFgc1FLK1qnBORhXquoNqDn"
D1_TOKEN="fz8B-rsbvPPUAoRmGBGjbVy_u39H7g3W_0QMIsud"

# Domain configuration
DOMAIN="airountable.com"
API_PATH="api"  # We'll use a path-based approach instead of subdomain
WORKER_NAME="airountable-api"
PAGES_PROJECT="airountable"
DB_NAME="ai_agents_db"
KV_PLANS="PLANS_STORAGE"
KV_AGENTS="AGENT_STORAGE"

# Get account ID
echo "Retrieving account information..."
ACCOUNT_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json")

if echo "$ACCOUNT_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error retrieving account information:"
  echo "$ACCOUNT_RESPONSE" | jq .
  exit 1
fi

ACCOUNT_ID=$(echo "$ACCOUNT_RESPONSE" | jq -r '.result[0].id')
echo "Using Cloudflare account ID: $ACCOUNT_ID"

# Get zone ID for the domain
echo "Retrieving zone information for $DOMAIN..."
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
     -H "Authorization: Bearer $DNS_TOKEN" \
     -H "Content-Type: application/json")

if echo "$ZONE_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error retrieving zone information:"
  echo "$ZONE_RESPONSE" | jq .
  exit 1
fi

ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id')
echo "Using zone ID: $ZONE_ID for domain $DOMAIN"

# Create D1 database - using D1 specific token
echo "Creating D1 database: $DB_NAME..."
DB_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database" \
     -H "Authorization: Bearer $D1_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{\"name\":\"$DB_NAME\"}")

if echo "$DB_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error creating D1 database (it may already exist):"
  echo "$DB_RESPONSE" | jq .
  
  # Try to get existing database ID
  DB_LIST_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database" \
       -H "Authorization: Bearer $D1_TOKEN" \
       -H "Content-Type: application/json")
  
  if echo "$DB_LIST_RESPONSE" | grep -q "\"success\":true"; then
    DB_ID=$(echo "$DB_LIST_RESPONSE" | jq -r ".result[] | select(.name==\"$DB_NAME\") | .uuid")
    if [ -n "$DB_ID" ]; then
      echo "Found existing D1 database with ID: $DB_ID"
    else
      echo "Could not find existing database with name $DB_NAME"
      exit 1
    fi
  else
    echo "Error listing D1 databases:"
    echo "$DB_LIST_RESPONSE" | jq .
    exit 1
  fi
else
  DB_ID=$(echo "$DB_RESPONSE" | jq -r '.result.uuid')
  echo "Created D1 database with ID: $DB_ID"
fi

# Create KV namespaces
echo "Creating KV namespace: $KV_PLANS..."
KV_PLANS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{\"title\":\"$KV_PLANS\"}")

if echo "$KV_PLANS_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error creating KV namespace (it may already exist):"
  echo "$KV_PLANS_RESPONSE" | jq .
  
  # Try to get existing namespace ID
  KV_LIST_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
       -H "Authorization: Bearer $WORKER_TOKEN" \
       -H "Content-Type: application/json")
  
  if echo "$KV_LIST_RESPONSE" | grep -q "\"success\":true"; then
    KV_PLANS_ID=$(echo "$KV_LIST_RESPONSE" | jq -r ".result[] | select(.title==\"$KV_PLANS\") | .id")
    if [ -n "$KV_PLANS_ID" ]; then
      echo "Found existing KV namespace with ID: $KV_PLANS_ID"
    else
      echo "Could not find existing KV namespace with name $KV_PLANS"
      exit 1
    fi
  else
    echo "Error listing KV namespaces:"
    echo "$KV_LIST_RESPONSE" | jq .
    exit 1
  fi
else
  KV_PLANS_ID=$(echo "$KV_PLANS_RESPONSE" | jq -r '.result.id')
  echo "Created KV namespace with ID: $KV_PLANS_ID"
fi

echo "Creating KV namespace: $KV_AGENTS..."
KV_AGENTS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{\"title\":\"$KV_AGENTS\"}")

if echo "$KV_AGENTS_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error creating KV namespace (it may already exist):"
  echo "$KV_AGENTS_RESPONSE" | jq .
  
  # Try to get existing namespace ID
  KV_LIST_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
       -H "Authorization: Bearer $WORKER_TOKEN" \
       -H "Content-Type: application/json")
  
  if echo "$KV_LIST_RESPONSE" | grep -q "\"success\":true"; then
    KV_AGENTS_ID=$(echo "$KV_LIST_RESPONSE" | jq -r ".result[] | select(.title==\"$KV_AGENTS\") | .id")
    if [ -n "$KV_AGENTS_ID" ]; then
      echo "Found existing KV namespace with ID: $KV_AGENTS_ID"
    else
      echo "Could not find existing KV namespace with name $KV_AGENTS"
      exit 1
    fi
  else
    echo "Error listing KV namespaces:"
    echo "$KV_LIST_RESPONSE" | jq .
    exit 1
  fi
else
  KV_AGENTS_ID=$(echo "$KV_AGENTS_RESPONSE" | jq -r '.result.id')
  echo "Created KV namespace with ID: $KV_AGENTS_ID"
fi

# Create SQL migration file
echo "Creating database migrations..."
mkdir -p migrations
cat > migrations/0001_initial.sql << EOF
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
EOF

# Apply migrations to D1 database - using D1 specific token
echo "Applying database migrations..."
MIGRATION_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database/$DB_ID/query" \
     -H "Authorization: Bearer $D1_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{\"sql\":\"$(cat migrations/0001_initial.sql | tr '\n' ' ')\"}")

if echo "$MIGRATION_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error applying migrations (tables may already exist):"
  echo "$MIGRATION_RESPONSE" | jq .
else
  echo "Successfully applied database migrations"
fi

# Create worker script - modified to handle path-based routing
echo "Creating worker script..."
mkdir -p worker/src
cat > worker/src/index.js << EOF
import { Router } from 'itty-router';
import { createCors } from 'itty-cors';

// Create CORS handlers
const { preflight, corsify } = createCors({
  origins: ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
});

// Create a new router
const router = Router();

// CORS preflight requests
router.options('*', preflight);

// Health check endpoint
router.get('/api/health', () => {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

// Plans API
router.get('/api/plans', async (request, env) => {
  try {
    const plans = await env.DB.prepare('SELECT * FROM plans ORDER BY created_at DESC').all();
    return new Response(JSON.stringify({
      status: 'success',
      data: plans.results,
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: {
        message: error.message,
        code: 500
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

router.get('/api/plans/:id', async (request, env) => {
  try {
    const { id } = request.params;
    const plan = await env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(id).first();
    
    if (!plan) {
      return new Response(JSON.stringify({
        status: 'error',
        error: {
          message: \`Plan with ID \${id} not found\`,
          code: 404
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    return new Response(JSON.stringify({
      status: 'success',
      data: plan,
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: {
        message: error.message,
        code: 500
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

router.post('/api/plans', async (request, env) => {
  try {
    const { title, description, steps } = await request.json();
    
    if (!title || !description) {
      return new Response(JSON.stringify({
        status: 'error',
        error: {
          message: 'Title and description are required',
          code: 400
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await env.DB.prepare(
      'INSERT INTO plans (id, title, description, steps, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, title, description, JSON.stringify(steps || []), 'active', now, now).run();
    
    return new Response(JSON.stringify({
      status: 'success',
      data: {
        id,
        title,
        description,
        steps: steps || [],
        status: 'active',
        created_at: now,
        updated_at: now
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: {
        message: error.message,
        code: 500
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

// Tasks API
router.get('/api/tasks', async (request, env) => {
  try {
    const tasks = await env.DB.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    return new Response(JSON.stringify({
      status: 'success',
      data: tasks.results,
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: {
        message: error.message,
        code: 500
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

router.post('/api/tasks', async (request, env) => {
  try {
    const { description } = await request.json();
    
    if (!description) {
      return new Response(JSON.stringify({
        status: 'error',
        error: {
          message: 'Description is required',
          code: 400
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await env.DB.prepare(
      'INSERT INTO tasks (id, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, description, 'pending', now, now).run();
    
    return new Response(JSON.stringify({
      status: 'success',
      data: {
        id,
        description,
        status: 'pending',
        created_at: now,
        updated_at: now
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: {
        message: error.message,
        code: 500
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

// Catch-all for 404s
router.all('*', () => new Response('Not Found', { status: 404 }));

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx).then(corsify);
  }
};
EOF

# Create package.json for worker
cat > worker/package.json << EOF
{
  "name": "$WORKER_NAME",
  "version": "1.0.0",
  "description": "API backend for Tannus AI Agents Webapp",
  "main": "src/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "itty-router": "^4.0.23",
    "itty-cors": "^0.3.6"
  }
}
EOF

# Create wrangler.toml for worker
cat > worker/wrangler.toml << EOF
name = "$WORKER_NAME"
main = "src/index.js"
compatibility_date = "2023-12-01"

[vars]
ENVIRONMENT = "production"
API_PATH = "$API_PATH"
FRONTEND_DOMAIN = "$DOMAIN"

[[d1_databases]]
binding = "DB"
database_name = "$DB_NAME"
database_id = "$DB_ID"

[[kv_namespaces]]
binding = "$KV_PLANS"
id = "$KV_PLANS_ID"

[[kv_namespaces]]
binding = "$KV_AGENTS"
id = "$KV_AGENTS_ID"

[triggers]
crons = ["*/5 * * * *"]
EOF

# Create a simple frontend for testing - updated to use path-based API
mkdir -p frontend/build
cat > frontend/build/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tannus AI Agents Webapp</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .card {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #2980b9;
        }
        input, textarea {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .status {
            margin-top: 20px;
            padding: 10px;
            background: #e8f4f8;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>Tannus AI Agents Webapp</h1>
    
    <div class="card">
        <h2>Create New Task</h2>
        <form id="taskForm">
            <label for="taskDescription">Task Description:</label>
            <textarea id="taskDescription" rows="4" placeholder="Describe your task here..."></textarea>
            <button type="submit">Submit Task</button>
        </form>
    </div>
    
    <div class="card">
        <h2>API Status</h2>
        <button id="checkStatus">Check API Status</button>
        <div id="apiStatus" class="status">API status will appear here...</div>
    </div>
    
    <div class="card">
        <h2>Tasks</h2>
        <button id="loadTasks">Load Tasks</button>
        <div id="tasksList"></div>
    </div>

    <script>
        // Using path-based API on the same domain
        const API_URL = '/api';
        
        document.getElementById('checkStatus').addEventListener('click', async () => {
            try {
                const response = await fetch(\`\${API_URL}/health\`);
                const data = await response.json();
                document.getElementById('apiStatus').innerHTML = \`
                    <p>Status: \${data.status}</p>
                    <p>Timestamp: \${data.timestamp}</p>
                    <p>Version: \${data.version}</p>
                \`;
            } catch (error) {
                document.getElementById('apiStatus').innerHTML = \`Error: \${error.message}\`;
            }
        });
        
        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const description = document.getElementById('taskDescription').value;
            if (!description) {
                alert('Please enter a task description');
                return;
            }
            
            try {
                const response = await fetch(\`\${API_URL}/tasks\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ description })
                });
                
                const data = await response.json();
                if (data.status === 'success') {
                    alert('Task created successfully!');
                    document.getElementById('taskDescription').value = '';
                    loadTasks();
                } else {
                    alert(\`Error: \${data.error.message}\`);
                }
            } catch (error) {
                alert(\`Error: \${error.message}\`);
            }
        });
        
        document.getElementById('loadTasks').addEventListener('click', loadTasks);
        
        async function loadTasks() {
            try {
                const response = await fetch(\`\${API_URL}/tasks\`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    const tasksList = document.getElementById('tasksList');
                    if (data.data.length === 0) {
                        tasksList.innerHTML = '<p>No tasks found</p>';
                        return;
                    }
                    
                    let html = '<ul>';
                    data.data.forEach(task => {
                        html += \`
                            <li>
                                <strong>\${task.description}</strong>
                                <br>
                                Status: \${task.status}
                                <br>
                                Created: \${new Date(task.created_at).toLocaleString()}
                            </li>
                        \`;
                    });
                    html += '</ul>';
                    tasksList.innerHTML = html;
                } else {
                    document.getElementById('tasksList').innerHTML = \`Error: \${data.error.message}\`;
                }
            } catch (error) {
                document.getElementById('tasksList').innerHTML = \`Error: \${error.message}\`;
            }
        }
    </script>
</body>
</html>
EOF

# Upload worker script
echo "Uploading worker script..."
WORKER_SCRIPT=$(cat worker/src/index.js | base64 -w 0)
WORKER_METADATA=$(cat << EOF
{
  "main_module": "index.js",
  "bindings": [
    {
      "type": "d1_database",
      "name": "DB",
      "database_id": "$DB_ID"
    },
    {
      "type": "kv_namespace",
      "name": "$KV_PLANS",
      "namespace_id": "$KV_PLANS_ID"
    },
    {
      "type": "kv_namespace",
      "name": "$KV_AGENTS",
      "namespace_id": "$KV_AGENTS_ID"
    }
  ],
  "compatibility_date": "2023-12-01",
  "usage_model": "bundled",
  "compatibility_flags": []
}
EOF
)

WORKER_UPLOAD_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/javascript+module" \
     -F "metadata=$WORKER_METADATA" \
     -F "script=@worker/src/index.js")

if echo "$WORKER_UPLOAD_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error uploading worker script:"
  echo "$WORKER_UPLOAD_RESPONSE" | jq .
  exit 1
else
  echo "Successfully uploaded worker script"
fi

# Create Pages project
echo "Creating Pages project: $PAGES_PROJECT..."
PAGES_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{
       \"name\": \"$PAGES_PROJECT\",
       \"production_branch\": \"main\"
     }")

if echo "$PAGES_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error creating Pages project (it may already exist):"
  echo "$PAGES_RESPONSE" | jq .
  
  # Check if project already exists
  PAGES_LIST_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects" \
       -H "Authorization: Bearer $WORKER_TOKEN" \
       -H "Content-Type: application/json")
  
  if echo "$PAGES_LIST_RESPONSE" | grep -q "\"success\":true"; then
    if echo "$PAGES_LIST_RESPONSE" | jq -r '.result[].name' | grep -q "^$PAGES_PROJECT$"; then
      echo "Found existing Pages project: $PAGES_PROJECT"
    else
      echo "Could not find existing Pages project with name $PAGES_PROJECT"
      exit 1
    fi
  else
    echo "Error listing Pages projects:"
    echo "$PAGES_LIST_RESPONSE" | jq .
    exit 1
  fi
else
  echo "Successfully created Pages project: $PAGES_PROJECT"
fi

# Deploy to Pages
echo "Deploying to Pages..."
# Create a deployment
DEPLOYMENT_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJECT/deployments" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json")

if echo "$DEPLOYMENT_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error creating deployment:"
  echo "$DEPLOYMENT_RESPONSE" | jq .
  exit 1
fi

DEPLOYMENT_ID=$(echo "$DEPLOYMENT_RESPONSE" | jq -r '.result.id')
echo "Created deployment with ID: $DEPLOYMENT_ID"

# Upload files
echo "Uploading files to deployment..."
cd frontend/build
for file in $(find . -type f); do
  echo "Uploading $file..."
  UPLOAD_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJECT/deployments/$DEPLOYMENT_ID/files$file" \
       -H "Authorization: Bearer $WORKER_TOKEN" \
       --data-binary "@$file")
  
  if echo "$UPLOAD_RESPONSE" | grep -q "\"success\":false"; then
    echo "Error uploading file $file:"
    echo "$UPLOAD_RESPONSE" | jq .
    exit 1
  fi
done
cd ../../

# Complete the deployment
echo "Completing deployment..."
COMPLETE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJECT/deployments/$DEPLOYMENT_ID/phases/deployment/done" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json")

if echo "$COMPLETE_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error completing deployment:"
  echo "$COMPLETE_RESPONSE" | jq .
  exit 1
else
  echo "Successfully completed deployment"
fi

# Configure custom domain for Pages
echo "Configuring custom domain for Pages..."
DOMAIN_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJECT/domains" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{
       \"name\": \"$DOMAIN\"
     }")

if echo "$DOMAIN_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error configuring custom domain (it may already be configured):"
  echo "$DOMAIN_RESPONSE" | jq .
else
  echo "Successfully configured custom domain: $DOMAIN"
fi

# Add www subdomain as well
WWW_DOMAIN_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJECT/domains" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{
       \"name\": \"www.$DOMAIN\"
     }")

if echo "$WWW_DOMAIN_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error configuring www subdomain (it may already be configured):"
  echo "$WWW_DOMAIN_RESPONSE" | jq .
else
  echo "Successfully configured www subdomain: www.$DOMAIN"
fi

# Create Worker route for path-based API
echo "Creating Worker route for path-based API..."
ROUTE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{
       \"pattern\": \"$DOMAIN/$API_PATH/*\",
       \"script\": \"$WORKER_NAME\"
     }")

if echo "$ROUTE_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error creating Worker route (it may already exist):"
  echo "$ROUTE_RESPONSE" | jq .
  
  # Check if route already exists
  ROUTE_LIST_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
       -H "Authorization: Bearer $WORKER_TOKEN" \
       -H "Content-Type: application/json")
  
  if echo "$ROUTE_LIST_RESPONSE" | grep -q "\"success\":true"; then
    if echo "$ROUTE_LIST_RESPONSE" | jq -r ".result[] | select(.pattern==\"$DOMAIN/$API_PATH/*\") | .id" | grep -q "."; then
      echo "Found existing Worker route for $DOMAIN/$API_PATH/*"
    else
      echo "Could not find existing Worker route for $DOMAIN/$API_PATH/*"
      exit 1
    fi
  else
    echo "Error listing Worker routes:"
    echo "$ROUTE_LIST_RESPONSE" | jq .
    exit 1
  fi
else
  echo "Successfully created Worker route for path-based API"
fi

# Also add www domain route
echo "Creating Worker route for www domain path-based API..."
WWW_ROUTE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
     -H "Authorization: Bearer $WORKER_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{
       \"pattern\": \"www.$DOMAIN/$API_PATH/*\",
       \"script\": \"$WORKER_NAME\"
     }")

if echo "$WWW_ROUTE_RESPONSE" | grep -q "\"success\":false"; then
  echo "Error creating Worker route for www domain (it may already exist):"
  echo "$WWW_ROUTE_RESPONSE" | jq .
else
  echo "Successfully created Worker route for www domain path-based API"
fi

echo "Deployment completed successfully!"
echo ""
echo "Your application is now deployed to Cloudflare with the following URLs:"
echo "- Frontend: https://$DOMAIN"
echo "- API: https://$DOMAIN/$API_PATH"
echo ""
echo "Note: It may take a few minutes for DNS changes to propagate."
echo "You can check the status of your deployment in the Cloudflare dashboard."
