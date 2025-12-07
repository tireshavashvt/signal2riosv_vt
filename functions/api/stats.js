/**
 * GET /api/stats - View statistics
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

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Auth check - only allow if STATS_KEY is set and matches
  const authKey = url.searchParams.get('key');
  if (!env.STATS_KEY || authKey !== env.STATS_KEY) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const statsJson = await env.PENDING_SIGNALS.get('stats:events');
  const stats = statsJson ? JSON.parse(statsJson) : {};

  return jsonResponse({
    success: true,
    stats,
    generatedAt: new Date().toISOString(),
  });
}
