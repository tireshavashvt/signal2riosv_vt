/**
 * Cloudflare Worker API for Signal RIOSV
 *
 * Endpoints:
 * - POST /api/submit - Submit signal with Turnstile verification
 * - GET /api/confirm/:token - Confirm email and send signal to RIOSV
 */

// Email templates embedded in worker
const CONFIRMATION_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #2e7d6b; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; background: #f7faf9; }
    .button {
      display: inline-block;
      background: #2e7d6b;
      color: white !important;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      margin: 24px 0;
      font-weight: bold;
    }
    .button:hover { background: #3a927e; }
    .footer { font-size: 12px; color: #666; margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; }
    .warning { background: #fff3cd; color: #856404; padding: 12px; border-radius: 6px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ТИ решаваш!</h1>
    </div>
    <div class="content">
      <p>Здравейте <strong>{{name}}</strong>,</p>
      <p>Получихме Вашия сигнал за замърсяване на въздуха.</p>
      <p>За да бъде изпратен към <strong>РИОСВ – Велико Търново</strong>, моля потвърдете имейл адреса си като кликнете на бутона по-долу:</p>
      <p style="text-align: center;">
        <a href="{{confirmUrl}}" class="button">Потвърди и изпрати сигнала</a>
      </p>
      <div class="warning">
        <strong>Важно:</strong> Линкът е валиден 24 часа. След изтичането му ще трябва да подадете сигнала отново.
      </div>
      <p class="footer">
        Ако не сте подавали сигнал, просто игнорирайте този имейл.<br><br>
        Гражданско сдружение „Ти Решаваш за Велико Търново"<br>
        <a href="https://ti-reshavash.bg">ti-reshavash.bg</a>
      </p>
    </div>
  </div>
</body>
</html>`;

const SUCCESS_PAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Сигналът е изпратен – ТИ решаваш!</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #f7faf9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: white;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      text-align: center;
      max-width: 500px;
      width: 100%;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #d4edda;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 40px;
      color: #2e7d6b;
    }
    h1 { color: #2e7d6b; margin: 0 0 16px; font-size: 28px; }
    p { color: #555; line-height: 1.6; margin: 0 0 12px; }
    .email {
      background: #f0f4f7;
      padding: 8px 16px;
      border-radius: 6px;
      display: inline-block;
      font-weight: 600;
      color: #333;
    }
    a {
      color: #2e7d6b;
      text-decoration: none;
      font-weight: 600;
    }
    a:hover { text-decoration: underline; }
    .back-link { margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Сигналът е изпратен!</h1>
    <p>Вашият сигнал беше изпратен успешно към РИОСВ – Велико Търново.</p>
    <p>Ще получите отговор на имейл:</p>
    <p class="email">{{email}}</p>
    <p class="back-link"><a href="/">← Обратно към сайта</a></p>
  </div>
</body>
</html>`;

const ERROR_PAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Грешка – ТИ решаваш!</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #f7faf9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: white;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      text-align: center;
      max-width: 500px;
      width: 100%;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #f8d7da;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 40px;
      color: #721c24;
    }
    h1 { color: #721c24; margin: 0 0 16px; font-size: 28px; }
    p { color: #555; line-height: 1.6; margin: 0 0 12px; }
    a {
      color: #2e7d6b;
      text-decoration: none;
      font-weight: 600;
    }
    a:hover { text-decoration: underline; }
    .back-link { margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✕</div>
    <h1>{{title}}</h1>
    <p>{{message}}</p>
    <p class="back-link"><a href="/">← Подайте сигнал отново</a></p>
  </div>
</body>
</html>`;

/**
 * Verify Cloudflare Turnstile token
 */
async function verifyTurnstile(token, ip, secretKey) {
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  formData.append('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  const result = await response.json();
  return result.success === true;
}

/**
 * Send email via Postal API
 */
async function sendEmail(env, { to, subject, htmlBody, attachments = [], replyTo = null, cc = null }) {
  const message = {
    to: [to],
    from: env.FROM_EMAIL,
    sender: env.FROM_NAME,
    subject: subject,
    html_body: htmlBody,
  };

  if (replyTo) {
    message.reply_to = replyTo;
  }

  if (cc) {
    message.cc = [cc];
  }

  if (attachments.length > 0) {
    message.attachments = attachments;
  }

  const response = await fetch(`${env.POSTAL_API_URL}/api/v1/send/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Server-API-Key': env.POSTAL_API_KEY,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Postal API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Generate confirmation token
 */
function generateToken() {
  return crypto.randomUUID();
}

/**
 * Handle POST /api/submit
 */
async function handleSubmit(request, env) {
  try {
    const body = await request.json();
    const { turnstileToken, signalData, docxBase64, letterText } = body;

    // Validate required fields
    if (!turnstileToken) {
      return jsonResponse({ success: false, error: 'Липсва Turnstile верификация' }, 400);
    }
    if (!signalData || !signalData.email || !signalData.name) {
      return jsonResponse({ success: false, error: 'Липсват задължителни данни' }, 400);
    }

    // Verify Turnstile
    const clientIP = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
    const turnstileValid = await verifyTurnstile(turnstileToken, clientIP, env.TURNSTILE_SECRET_KEY);

    if (!turnstileValid) {
      return jsonResponse({ success: false, error: 'Turnstile верификацията е неуспешна. Моля опитайте отново.' }, 400);
    }

    // Generate confirmation token
    const token = generateToken();
    const confirmUrl = `${env.CONFIRM_BASE_URL}/${token}`;

    // Store pending signal in KV (TTL: 24 hours = 86400 seconds)
    const pendingData = {
      signalData,
      docxBase64,
      letterText,
      email: signalData.email,
      name: signalData.name,
      createdAt: Date.now(),
    };

    await env.PENDING_SIGNALS.put(`pending:${token}`, JSON.stringify(pendingData), {
      expirationTtl: 86400,
    });

    // Send confirmation email
    const emailHtml = CONFIRMATION_EMAIL_TEMPLATE
      .replace(/{{name}}/g, signalData.name)
      .replace(/{{confirmUrl}}/g, confirmUrl);

    await sendEmail(env, {
      to: signalData.email,
      subject: 'Потвърдете сигнала си към РИОСВ – ТИ решаваш!',
      htmlBody: emailHtml,
    });

    return jsonResponse({
      success: true,
      message: `Изпратихме имейл за потвърждение на ${signalData.email}`,
    });

  } catch (error) {
    console.error('Submit error:', error);
    return jsonResponse({ success: false, error: 'Възникна грешка. Моля опитайте отново.' }, 500);
  }
}

/**
 * Handle POST /api/track - Simple event tracking
 */
async function handleTrack(request, env) {
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
    const eventKey = event;
    if (!stats[eventKey]) {
      stats[eventKey] = { count: 0, lastOccurred: null, byPlatform: {} };
    }
    stats[eventKey].count++;
    stats[eventKey].lastOccurred = timestamp || Date.now();

    // Track by platform if provided
    if (data && data.platform) {
      if (!stats[eventKey].byPlatform[data.platform]) {
        stats[eventKey].byPlatform[data.platform] = 0;
      }
      stats[eventKey].byPlatform[data.platform]++;
    }

    // Save back to KV (no TTL - permanent stats)
    await env.PENDING_SIGNALS.put(statsKey, JSON.stringify(stats));

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    return jsonResponse({ success: false }, 500);
  }
}

/**
 * Handle GET /api/stats - View statistics
 */
async function handleStats(url, env) {
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

/**
 * Handle GET /api/confirm/:token
 */
async function handleConfirm(token, env) {
  try {
    // Get pending signal from KV
    const pendingJson = await env.PENDING_SIGNALS.get(`pending:${token}`);

    if (!pendingJson) {
      return htmlResponse(ERROR_PAGE_TEMPLATE
        .replace('{{title}}', 'Линкът е невалиден или изтекъл')
        .replace('{{message}}', 'Този линк за потвърждение е невалиден или вече е изтекъл. Моля подайте сигнала отново.'),
        404
      );
    }

    const pending = JSON.parse(pendingJson);

    // Send actual signal to RIOSV
    const attachments = [];
    if (pending.docxBase64) {
      attachments.push({
        name: 'signal_riosv_vt.docx',
        content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        data: pending.docxBase64,
      });
    }

    await sendEmail(env, {
      to: env.RIOSV_EMAIL,
      subject: 'Сигнал за замърсяване на въздуха – ТИ решаваш!',
      htmlBody: `<pre style="font-family: monospace; white-space: pre-wrap;">${escapeHtml(pending.letterText)}</pre>`,
      attachments,
      replyTo: pending.email,
      cc: pending.email,
    });

    // Delete pending signal from KV
    await env.PENDING_SIGNALS.delete(`pending:${token}`);

    // Return success page
    return htmlResponse(SUCCESS_PAGE_TEMPLATE.replace('{{email}}', escapeHtml(pending.email)));

  } catch (error) {
    console.error('Confirm error:', error);
    return htmlResponse(ERROR_PAGE_TEMPLATE
      .replace('{{title}}', 'Грешка при изпращане')
      .replace('{{message}}', 'Възникна грешка при изпращането на сигнала. Моля опитайте отново или се свържете с нас.'),
      500
    );
  }
}

/**
 * Helper: JSON response
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

/**
 * Helper: HTML response
 */
function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Route: POST /api/submit
    if (request.method === 'POST' && path === '/api/submit') {
      return handleSubmit(request, env);
    }

    // Route: GET /api/confirm/:token
    const confirmMatch = path.match(/^\/api\/confirm\/([a-f0-9-]+)$/i);
    if (request.method === 'GET' && confirmMatch) {
      return handleConfirm(confirmMatch[1], env);
    }

    // Route: POST /api/track - Simple event tracking
    if (request.method === 'POST' && path === '/api/track') {
      return handleTrack(request, env);
    }

    // Route: GET /api/stats - View statistics (simple auth via query param)
    if (request.method === 'GET' && path === '/api/stats') {
      return handleStats(url, env);
    }

    // 404 for unknown routes
    return new Response('Not Found', { status: 404 });
  },
};
