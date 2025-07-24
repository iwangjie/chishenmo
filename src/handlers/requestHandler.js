import { corsHeaders } from '../utils/cors.js';
import { generateId } from '../utils/helpers.js';
import { getHTML } from '../templates/html.js';

export async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Serve HTML page
    if (url.pathname === '/') {
      return new Response(getHTML(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
      });
    }

    // Initialize new wheel
    if (url.pathname === '/api/init' && request.method === 'POST') {
      return await handleInitWheel(env);
    }

    // Get latest wheel
    if (url.pathname === '/api/latest' && request.method === 'GET') {
      return await handleGetLatestWheel(env);
    }

    // Check for refresh trigger
    if (url.pathname === '/api/refresh-check' && request.method === 'GET') {
      return await handleRefreshCheck(env);
    }

    // Handle wheel operations
    if (url.pathname.startsWith('/api/wheel/')) {
      const wheelId = url.pathname.split('/')[3];
      
      if (request.method === 'GET') {
        return await handleGetWheel(wheelId, env);
      }
      
      if (request.method === 'POST') {
        return await handleWheelAction(wheelId, request, env);
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleInitWheel(env) {
  const wheelId = generateId();
  const wheelData = {
    id: wheelId,
    foods: {},
    spinning: false,
    result: null,
    history: [],
    createdAt: Date.now()
  };
  
  await env.FOOD_KV.put(`wheel:${wheelId}`, JSON.stringify(wheelData));
  await env.FOOD_KV.put('latest_wheel_id', wheelId);
  await env.FOOD_KV.put('refresh_trigger', Date.now().toString());
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleGetLatestWheel(env) {
  const latestWheelId = await env.FOOD_KV.get('latest_wheel_id');
  if (!latestWheelId) {
    return new Response(JSON.stringify({ error: 'No wheel found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const wheelData = await env.FOOD_KV.get(`wheel:${latestWheelId}`);
  if (!wheelData) {
    return new Response(JSON.stringify({ error: 'Wheel data not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  return new Response(wheelData, {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleRefreshCheck(env) {
  const refreshTrigger = await env.FOOD_KV.get('refresh_trigger');
  return new Response(JSON.stringify({ 
    refreshTrigger: refreshTrigger || '0' 
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleGetWheel(wheelId, env) {
  const data = await env.FOOD_KV.get(`wheel:${wheelId}`);
  if (!data) {
    return new Response(JSON.stringify({ error: 'Wheel not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  return new Response(data, {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handleWheelAction(wheelId, request, env) {
  const { action, food, userId } = await request.json();
  const data = JSON.parse(await env.FOOD_KV.get(`wheel:${wheelId}`) || '{}');
  
  if (action === 'addFood') {
    const foodId = generateId();
    data.foods[foodId] = { food, userId };
  } else if (action === 'spin') {
    data.spinning = true;
    data.result = null;
  } else if (action === 'result') {
    data.spinning = false;
    data.result = food;
    data.history.push({
      result: food,
      timestamp: Date.now()
    });
  }
  
  await env.FOOD_KV.put(`wheel:${wheelId}`, JSON.stringify(data));
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}