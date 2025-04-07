// AI Agents Webapp Worker - ES Module Format
// This is the backend API for the AI Agents Webapp

// CORS headers for cross-origin requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// Helper function to handle CORS preflight requests
function handleCors(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }
  return null;
}

// Helper function to create JSON responses
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

// Helper function to handle errors
function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

// Plans API handler
async function handlePlansRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const planId = path.match(/\/api\/plans\/([^\/]+)/)?.[1];
  
  // GET /api/plans - List all plans
  if (path === '/api/plans' && request.method === 'GET') {
    try {
      const plansList = await env.PLANS_STORAGE.list();
      const plans = [];
      
      for (const key of plansList.keys) {
        const planData = await env.PLANS_STORAGE.get(key.name, { type: 'json' });
        if (planData) {
          plans.push({
            id: key.name,
            ...planData
          });
        }
      }
      
      return jsonResponse(plans);
    } catch (error) {
      return errorResponse('Failed to retrieve plans: ' + error.message);
    }
  }
  
  // POST /api/plans - Create a new plan
  if (path === '/api/plans' && request.method === 'POST') {
    try {
      const planData = await request.json();
      const planId = crypto.randomUUID();
      
      await env.PLANS_STORAGE.put(planId, JSON.stringify(planData));
      
      return jsonResponse({
        id: planId,
        ...planData
      }, 201);
    } catch (error) {
      return errorResponse('Failed to create plan: ' + error.message);
    }
  }
  
  // GET /api/plans/:id - Get a specific plan
  if (planId && request.method === 'GET') {
    try {
      const planData = await env.PLANS_STORAGE.get(planId, { type: 'json' });
      
      if (!planData) {
        return errorResponse('Plan not found', 404);
      }
      
      return jsonResponse({
        id: planId,
        ...planData
      });
    } catch (error) {
      return errorResponse('Failed to retrieve plan: ' + error.message);
    }
  }
  
  // PUT /api/plans/:id - Update a specific plan
  if (planId && request.method === 'PUT') {
    try {
      const planData = await request.json();
      
      // Check if plan exists
      const existingPlan = await env.PLANS_STORAGE.get(planId, { type: 'json' });
      if (!existingPlan) {
        return errorResponse('Plan not found', 404);
      }
      
      await env.PLANS_STORAGE.put(planId, JSON.stringify(planData));
      
      return jsonResponse({
        id: planId,
        ...planData
      });
    } catch (error) {
      return errorResponse('Failed to update plan: ' + error.message);
    }
  }
  
  // DELETE /api/plans/:id - Delete a specific plan
  if (planId && request.method === 'DELETE') {
    try {
      // Check if plan exists
      const existingPlan = await env.PLANS_STORAGE.get(planId, { type: 'json' });
      if (!existingPlan) {
        return errorResponse('Plan not found', 404);
      }
      
      await env.PLANS_STORAGE.delete(planId);
      
      return jsonResponse({ success: true });
    } catch (error) {
      return errorResponse('Failed to delete plan: ' + error.message);
    }
  }
  
  return errorResponse('Method not allowed', 405);
}

// Agents API handler
async function handleAgentsRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const agentId = path.match(/\/api\/agents\/([^\/]+)/)?.[1];
  
  // GET /api/agents - List all agents
  if (path === '/api/agents' && request.method === 'GET') {
    try {
      const agentsList = await env.AGENT_STORAGE.list();
      const agents = [];
      
      for (const key of agentsList.keys) {
        const agentData = await env.AGENT_STORAGE.get(key.name, { type: 'json' });
        if (agentData) {
          agents.push({
            id: key.name,
            ...agentData
          });
        }
      }
      
      return jsonResponse(agents);
    } catch (error) {
      return errorResponse('Failed to retrieve agents: ' + error.message);
    }
  }
  
  // POST /api/agents - Create a new agent
  if (path === '/api/agents' && request.method === 'POST') {
    try {
      const agentData = await request.json();
      const agentId = crypto.randomUUID();
      
      await env.AGENT_STORAGE.put(agentId, JSON.stringify(agentData));
      
      // Store agent in database for persistence
      const stmt = env.DB.prepare(
        'INSERT INTO agents (id, task_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      );
      
      await stmt.bind(
        agentId,
        agentData.task_id || null,
        agentData.status || 'idle',
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
      
      return jsonResponse({
        id: agentId,
        ...agentData
      }, 201);
    } catch (error) {
      return errorResponse('Failed to create agent: ' + error.message);
    }
  }
  
  // GET /api/agents/:id - Get a specific agent
  if (agentId && request.method === 'GET') {
    try {
      const agentData = await env.AGENT_STORAGE.get(agentId, { type: 'json' });
      
      if (!agentData) {
        return errorResponse('Agent not found', 404);
      }
      
      return jsonResponse({
        id: agentId,
        ...agentData
      });
    } catch (error) {
      return errorResponse('Failed to retrieve agent: ' + error.message);
    }
  }
  
  // PUT /api/agents/:id - Update a specific agent
  if (agentId && request.method === 'PUT') {
    try {
      const agentData = await request.json();
      
      // Check if agent exists
      const existingAgent = await env.AGENT_STORAGE.get(agentId, { type: 'json' });
      if (!existingAgent) {
        return errorResponse('Agent not found', 404);
      }
      
      await env.AGENT_STORAGE.put(agentId, JSON.stringify(agentData));
      
      // Update agent in database
      const stmt = env.DB.prepare(
        'UPDATE agents SET task_id = ?, status = ?, updated_at = ? WHERE id = ?'
      );
      
      await stmt.bind(
        agentData.task_id || existingAgent.task_id || null,
        agentData.status || existingAgent.status || 'idle',
        new Date().toISOString(),
        agentId
      ).run();
      
      return jsonResponse({
        id: agentId,
        ...agentData
      });
    } catch (error) {
      return errorResponse('Failed to update agent: ' + error.message);
    }
  }
  
  // DELETE /api/agents/:id - Delete a specific agent
  if (agentId && request.method === 'DELETE') {
    try {
      // Check if agent exists
      const existingAgent = await env.AGENT_STORAGE.get(agentId, { type: 'json' });
      if (!existingAgent) {
        return errorResponse('Agent not found', 404);
      }
      
      await env.AGENT_STORAGE.delete(agentId);
      
      // Delete agent from database
      const stmt = env.DB.prepare('DELETE FROM agents WHERE id = ?');
      await stmt.bind(agentId).run();
      
      return jsonResponse({ success: true });
    } catch (error) {
      return errorResponse('Failed to delete agent: ' + error.message);
    }
  }
  
  // POST /api/agents/:id/run - Run a specific agent
  if (agentId && path.endsWith('/run') && request.method === 'POST') {
    try {
      // Check if agent exists
      const existingAgent = await env.AGENT_STORAGE.get(agentId, { type: 'json' });
      if (!existingAgent) {
        return errorResponse('Agent not found', 404);
      }
      
      // Update agent status to running
      const updatedAgent = {
        ...existingAgent,
        status: 'running',
        last_run: new Date().toISOString()
      };
      
      await env.AGENT_STORAGE.put(agentId, JSON.stringify(updatedAgent));
      
      // Update agent in database
      const stmt = env.DB.prepare(
        'UPDATE agents SET status = ?, updated_at = ? WHERE id = ?'
      );
      
      await stmt.bind(
        'running',
        new Date().toISOString(),
        agentId
      ).run();
      
      // In a real implementation, this would trigger the agent to run
      // For now, we'll just return success
      return jsonResponse({
        id: agentId,
        ...updatedAgent
      });
    } catch (error) {
      return errorResponse('Failed to run agent: ' + error.message);
    }
  }
  
  // POST /api/agents/:id/stop - Stop a specific agent
  if (agentId && path.endsWith('/stop') && request.method === 'POST') {
    try {
      // Check if agent exists
      const existingAgent = await env.AGENT_STORAGE.get(agentId, { type: 'json' });
      if (!existingAgent) {
        return errorResponse('Agent not found', 404);
      }
      
      // Update agent status to idle
      const updatedAgent = {
        ...existingAgent,
        status: 'idle',
      };
      
      await env.AGENT_STORAGE.put(agentId, JSON.stringify(updatedAgent));
      
      // Update agent in database
      const stmt = env.DB.prepare(
        'UPDATE agents SET status = ?, updated_at = ? WHERE id = ?'
      );
      
      await stmt.bind(
        'idle',
        new Date().toISOString(),
        agentId
      ).run();
      
      return jsonResponse({
        id: agentId,
        ...updatedAgent
      });
    } catch (error) {
      return errorResponse('Failed to stop agent: ' + error.message);
    }
  }
  
  return errorResponse('Method not allowed', 405);
}

// Main request handler
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  // Health check endpoint
  if (path === '/api/health') {
    return jsonResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
  
  // Plans API
  if (path.startsWith('/api/plans')) {
    return handlePlansRequest(request, env);
  }
  
  // Agents API
  if (path.startsWith('/api/agents')) {
    return handleAgentsRequest(request, env);
  }
  
  // Default response for unknown endpoints
  return errorResponse('Not found', 404);
}

// Handle scheduled events (runs every 5 minutes)
async function handleScheduled(event, env) {
  try {
    // Check for any agents that need to be updated
    const agentsList = await env.AGENT_STORAGE.list();
    
    for (const key of agentsList.keys) {
      const agentData = await env.AGENT_STORAGE.get(key.name, { type: 'json' });
      
      if (agentData && agentData.status === 'running') {
        // In a real implementation, this would check if the agent is still running
        // and update its status accordingly
        
        // For now, we'll just log that we checked the agent
        console.log(`Checked agent ${key.name} - status: ${agentData.status}`);
      }
    }
  } catch (error) {
    console.error('Error in scheduled task:', error);
  }
}

// Export handlers for Cloudflare Workers
export default {
  // Handle fetch events
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
  
  // Handle scheduled events
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env));
  }
};
