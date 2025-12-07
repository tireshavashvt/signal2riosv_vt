/**
 * GET /api/confirm/:token - Confirm email and send signal to RIOSV
 */

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

// Rate limiting constants (must match submit.js)
const MAX_CONFIRMED_PER_DAY = 1;

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

async function checkConfirmedRateLimit(env, email) {
  const today = getTodayKey();
  const emailNormalized = email.toLowerCase().trim();
  const confirmedKey = `ratelimit:confirmed:${emailNormalized}:${today}`;
  const confirmedCountStr = await env.PENDING_SIGNALS.get(confirmedKey);
  const confirmedCount = confirmedCountStr ? parseInt(confirmedCountStr, 10) : 0;

  return {
    confirmedCount,
    canConfirm: confirmedCount < MAX_CONFIRMED_PER_DAY,
  };
}

async function incrementConfirmedCount(env, email) {
  const today = getTodayKey();
  const emailNormalized = email.toLowerCase().trim();
  const confirmedKey = `ratelimit:confirmed:${emailNormalized}:${today}`;

  const currentStr = await env.PENDING_SIGNALS.get(confirmedKey);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  await env.PENDING_SIGNALS.put(confirmedKey, String(current + 1), {
    expirationTtl: 86400,
  });
}

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

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

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

export async function onRequestGet(context) {
  const { params, env } = context;
  const token = params.token;

  try {
    // Validate token format
    if (!token || !/^[a-f0-9-]+$/i.test(token)) {
      return htmlResponse(ERROR_PAGE_TEMPLATE
        .replace('{{title}}', 'Невалиден линк')
        .replace('{{message}}', 'Линкът за потвърждение е невалиден.'),
        400
      );
    }

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

    // Check rate limit for confirmed signals
    const rateLimit = await checkConfirmedRateLimit(env, pending.email);
    console.log('Confirm rate limit check:', { email: pending.email, ...rateLimit });

    if (!rateLimit.canConfirm) {
      return htmlResponse(ERROR_PAGE_TEMPLATE
        .replace('{{title}}', 'Лимит за деня')
        .replace('{{message}}', 'Вече имате потвърден сигнал за днес. Можете да изпратите нов сигнал утре.'),
        429
      );
    }

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

    // Increment confirmed rate limit counter
    await incrementConfirmedCount(env, pending.email);

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
