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
          message: `Plan with ID ${id} not found`,
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

// Agents API
router.get('/api/agents', async (request, env) => {
  try {
    const agents = await env.DB.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
    return new Response(JSON.stringify({
      status: 'success',
      data: agents.results,
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
    
    // Create a new agent session for this task
    const agentId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO agents (id, task_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(agentId, id, 'initializing', now, now).run();
    
    return new Response(JSON.stringify({
      status: 'success',
      data: {
        id,
        description,
        status: 'pending',
        agent_id: agentId,
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
  },
  
  // Scheduled handler for background tasks
  async scheduled(event, env, ctx) {
    // Check for stalled agents and restart them
    const stalledAgents = await env.DB.prepare(
      'SELECT * FROM agents WHERE status = "running" AND updated_at < datetime("now", "-5 minutes")'
    ).all();
    
    for (const agent of stalledAgents.results) {
      await env.DB.prepare(
        'UPDATE agents SET status = "restarting", updated_at = ? WHERE id = ?'
      ).bind(new Date().toISOString(), agent.id).run();
      
      // Log the restart
      console.log(`Restarting stalled agent: ${agent.id}`);
    }
  }
};

// Database schema setup
export async function setup(env) {
  // Create plans table
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      steps TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  // Create agents table
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  // Create tasks table
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

// Initialize the database on first run
addEventListener('scheduled', event => {
  event.waitUntil(setup(event.env));
});
