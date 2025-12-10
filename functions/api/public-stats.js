/**
 * GET /api/public-stats - Public statistics endpoint
 * Returns anonymized aggregated statistics for the public dashboard
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60', // Cache for 1 minute
    },
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.SIGNAL_STATS) {
    return jsonResponse({ error: 'Statistics not available' }, 503);
  }

  try {
    // Get total signals and unique respondents
    const totalsResult = await env.SIGNAL_STATS.prepare(`
      SELECT
        COUNT(*) as total_signals,
        COUNT(DISTINCT email_hash) as unique_respondents
      FROM anonymous_signals
    `).first();

    // Get signals by district
    const districtResult = await env.SIGNAL_STATS.prepare(`
      SELECT district, COUNT(*) as count
      FROM anonymous_signals
      WHERE district != ''
      GROUP BY district
      ORDER BY count DESC
    `).all();

    // Get signals by source
    const sourceResult = await env.SIGNAL_STATS.prepare(`
      SELECT source, COUNT(*) as count
      FROM anonymous_signals
      WHERE source != ''
      GROUP BY source
      ORDER BY count DESC
    `).all();

    // Get symptom statistics (need to parse JSON and count)
    const symptomsResult = await env.SIGNAL_STATS.prepare(`
      SELECT symptoms
      FROM anonymous_signals
    `).all();

    // Count symptoms
    const symptomCounts = {};
    for (const row of symptomsResult.results) {
      try {
        const symptoms = JSON.parse(row.symptoms || '[]');
        for (const symptom of symptoms) {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // Convert to sorted array
    const symptomStats = Object.entries(symptomCounts)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count);

    // Get signals per day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const dailyResult = await env.SIGNAL_STATS.prepare(`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM anonymous_signals
      WHERE DATE(timestamp) >= ?
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `).bind(sevenDaysAgoStr).all();

    // Get signals per day for previous week (for comparison)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

    const previousWeekResult = await env.SIGNAL_STATS.prepare(`
      SELECT COUNT(*) as count
      FROM anonymous_signals
      WHERE DATE(timestamp) >= ? AND DATE(timestamp) < ?
    `).bind(fourteenDaysAgoStr, sevenDaysAgoStr).first();

    const thisWeekTotal = dailyResult.results.reduce((sum, r) => sum + r.count, 0);
    const previousWeekTotal = previousWeekResult?.count || 0;
    const weeklyChange = previousWeekTotal > 0
      ? Math.round(((thisWeekTotal - previousWeekTotal) / previousWeekTotal) * 100)
      : 0;

    // Get recent signals (last 10, anonymized)
    const recentResult = await env.SIGNAL_STATS.prepare(`
      SELECT timestamp, district, source, symptoms
      FROM anonymous_signals
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    // Format recent signals with relative time
    const now = Date.now();
    const recentSignals = recentResult.results.map(row => {
      const signalTime = new Date(row.timestamp).getTime();
      const diffMinutes = Math.floor((now - signalTime) / 60000);

      let relativeTime;
      if (diffMinutes < 1) relativeTime = 'преди секунди';
      else if (diffMinutes < 60) relativeTime = `преди ${diffMinutes} мин`;
      else if (diffMinutes < 1440) relativeTime = `преди ${Math.floor(diffMinutes / 60)} ч`;
      else relativeTime = `преди ${Math.floor(diffMinutes / 1440)} дни`;

      // Get first symptom for display
      let mainSymptom = '';
      try {
        const symptoms = JSON.parse(row.symptoms || '[]');
        if (symptoms.length > 0) {
          // Shorten symptom text
          mainSymptom = symptoms[0].replace('Наличие на остра, задушлива ', '').replace('.', '');
        }
      } catch (e) {}

      return {
        time: relativeTime,
        district: row.district,
        source: row.source,
        symptom: mainSymptom
      };
    });

    // Calculate milestones
    const totalSignals = totalsResult?.total_signals || 0;
    const milestones = [
      { target: 100, name: 'Първата искра', icon: '🔥' },
      { target: 250, name: 'Гласът се чува', icon: '📢' },
      { target: 500, name: 'Вълна на промяната', icon: '🌊' },
      { target: 750, name: 'Силата на общността', icon: '💪' },
      { target: 1000, name: 'Не може да ни игнорират', icon: '🎯' },
      { target: 2000, name: 'Движение за промяна', icon: '🚀' },
      { target: 5000, name: 'Гласът на града', icon: '🏆' },
    ];

    const achievedMilestones = milestones.filter(m => totalSignals >= m.target);
    const nextMilestone = milestones.find(m => totalSignals < m.target) || milestones[milestones.length - 1];

    return jsonResponse({
      totals: {
        signals: totalSignals,
        respondents: totalsResult?.unique_respondents || 0,
      },
      districts: districtResult.results,
      sources: sourceResult.results,
      symptoms: symptomStats,
      daily: dailyResult.results,
      weeklyChange,
      thisWeekTotal,
      recent: recentSignals,
      milestones: {
        achieved: achievedMilestones,
        next: nextMilestone,
        progress: nextMilestone ? Math.min(100, Math.round((totalSignals / nextMilestone.target) * 100)) : 100,
        remaining: nextMilestone ? Math.max(0, nextMilestone.target - totalSignals) : 0,
      },
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Public stats error:', error);
    return jsonResponse({ error: 'Failed to fetch statistics' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
