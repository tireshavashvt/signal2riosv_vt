/**
 * POST /api/track - Simple event tracking
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { event, data, timestamp } = body;

    if (!event) {
      return jsonResponse({ success: false, error: 'Missing event name' }, 400);
    }

    // Get current stats
    const statsKey = 'stats:events';
    const statsJson = await env.PENDING_SIGNALS.get(statsKey);
    const stats = statsJson ? JSON.parse(statsJson) : {};

    // Increment event counter
    if (!stats[event]) {
      stats[event] = { count: 0, lastOccurred: null, byPlatform: {} };
    }
    stats[event].count++;
    stats[event].lastOccurred = timestamp || Date.now();

    // Track by platform if provided
    if (data && data.platform) {
      if (!stats[event].byPlatform[data.platform]) {
        stats[event].byPlatform[data.platform] = 0;
      }
      stats[event].byPlatform[data.platform]++;
    }

    // Save back to KV (no TTL - permanent stats)
    await env.PENDING_SIGNALS.put(statsKey, JSON.stringify(stats));

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    return jsonResponse({ success: false }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
