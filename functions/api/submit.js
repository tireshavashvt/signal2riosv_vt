/**
 * POST /api/submit - Submit signal with Turnstile verification
 */

// Plain text version for multipart emails (improves deliverability)
const CONFIRMATION_EMAIL_TEXT = `Здравейте {{name}},

Получихме Вашия сигнал за замърсяване на въздуха.

За да бъде изпратен към РИОСВ – Велико Търново, моля потвърдете имейл адреса си като посетите следния линк:

{{confirmUrl}}

ВАЖНО: Линкът е валиден 24 часа. След изтичането му ще трябва да подадете сигнала отново.

--- ВАШИЯТ СИГНАЛ ---

{{letterText}}

--- КРАЙ НА СИГНАЛА ---

Ако не сте подавали сигнал, просто игнорирайте този имейл.

---
Гражданско сдружение „Ти Решаваш за Велико Търново"
https://signal.tireshavashzavt.org

Този имейл е изпратен от {{email}} чрез платформата за сигнали.
Получавате този имейл, защото сте въвели адреса си при подаване на сигнал.
За въпроси: info@tireshavashzavt.org`;

const CONFIRMATION_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="bg" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Потвърдете сигнала си</title>
  <!--[if mso]>
  <style>
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; width: 100%; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #2e7d6b; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #ffffff; font-weight: bold; }
    .content { padding: 32px 24px; background-color: #ffffff; }
    .content p { margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #333333; }
    .button-wrapper { text-align: center; margin: 28px 0; }
    .button {
      display: inline-block;
      background-color: #2e7d6b;
      color: #ffffff !important;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
    }
    .warning { background-color: #fff3cd; color: #856404; padding: 14px 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
    .signal-preview { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 16px; margin: 24px 0 0; }
    .signal-preview h3 { margin: 0 0 12px; font-size: 14px; color: #495057; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .signal-preview .signal-text { font-size: 13px; line-height: 1.6; color: #555555; white-space: pre-wrap; font-family: 'Courier New', monospace; background: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #dee2e6; max-height: 300px; overflow-y: auto; }
    .footer { padding: 24px; background-color: #f7f7f7; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 0 0 8px; font-size: 12px; line-height: 1.5; color: #666666; }
    .footer a { color: #2e7d6b; text-decoration: none; }
    .preheader { display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f4f4f4; }
  </style>
</head>
<body>
  <!-- Preheader text (shows in email preview) -->
  <div class="preheader">Потвърдете имейла си, за да изпратим сигнала Ви към РИОСВ – Велико Търново.</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td class="header">
              <h1>ТИ решаваш!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="content">
              <p>Здравейте <strong>{{name}}</strong>,</p>
              <p>Получихме Вашия сигнал за замърсяване на въздуха.</p>
              <p>За да бъде изпратен към <strong>РИОСВ – Велико Търново</strong>, моля потвърдете имейл адреса си:</p>

              <div class="button-wrapper">
                <a href="{{confirmUrl}}" class="button" target="_blank">Потвърди и изпрати сигнала</a>
              </div>

              <div class="warning">
                <strong>Важно:</strong> Линкът е валиден 24 часа. След изтичането му ще трябва да подадете сигнала отново.
              </div>

              <p style="font-size: 14px; color: #666;">Ако бутонът не работи, копирайте този линк в браузъра:<br>
              <a href="{{confirmUrl}}" style="color: #2e7d6b; word-break: break-all;">{{confirmUrl}}</a></p>

              <!-- Signal Preview -->
              <div class="signal-preview">
                <h3>Вашият сигнал:</h3>
                <div class="signal-text">{{letterText}}</div>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p>Ако не сте подавали сигнал, просто игнорирайте този имейл.</p>
              <p><strong>Гражданско сдружение „Ти Решаваш за Велико Търново"</strong></p>
              <p><a href="https://signal.tireshavashzavt.org">signal.tireshavashzavt.org</a> | <a href="mailto:info@tireshavashzavt.org">info@tireshavashzavt.org</a></p>
              <p style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                Този имейл е изпратен до {{email}}, защото адресът е въведен при подаване на сигнал.<br>
                Това е еднократно съобщение за потвърждение – няма да получавате други имейли.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// Rate limiting constants
const MAX_PENDING_PER_DAY = 3;    // Max unconfirmed requests per email per day
const MAX_CONFIRMED_PER_DAY = 1;  // Max confirmed signals per email per day

// ============ VALIDATION FUNCTIONS ============

// Валидация на име - само кирилица, интервали и тирета
function validateName(name) {
  if (!name) return { valid: false, error: 'Моля въведете Вашето име и фамилия' };
  name = name.trim();
  if (name.length < 3) {
    return { valid: false, error: 'Името трябва да е поне 3 символа' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Името не може да е по-дълго от 100 символа' };
  }
  // Само кирилица (А-Яа-я), интервали и тирета
  const cyrillicPattern = /^[А-Яа-яЁёЍѝ\s\-]+$/;
  if (!cyrillicPattern.test(name)) {
    return { valid: false, error: 'Моля, въведете името си на кирилица (български букви)' };
  }
  // Проверка за поне две думи (име и фамилия)
  const words = name.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) {
    return { valid: false, error: 'Моля, въведете име и фамилия' };
  }
  return { valid: true };
}

// Валидация на имейл - стриктна проверка
function validateEmail(email) {
  if (!email) return { valid: false, error: 'Моля въведете имейл адрес' };
  email = email.trim().toLowerCase();
  // RFC 5322 опростен regex
  const emailPattern = /^[a-z0-9](?:[a-z0-9._%+\-]{0,61}[a-z0-9])?@[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/;
  if (!emailPattern.test(email)) {
    return { valid: false, error: 'Моля, въведете валиден имейл адрес' };
  }
  return { valid: true };
}

// Валидация на телефон - само цифри
function validatePhone(phone) {
  if (!phone) return { valid: true }; // Не е задължително
  phone = phone.trim().replace(/^\+359/, ''); // Премахни +359 prefix ако има
  // Позволява само цифри
  const phonePattern = /^[0-9]+$/;
  if (!phonePattern.test(phone)) {
    return { valid: false, error: 'Телефонът може да съдържа само цифри' };
  }
  return { valid: true };
}

// Sanitize на входни данни - защита от injection
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')           // Премахва < и >
    .replace(/javascript:/gi, '')    // Премахва javascript: URLs
    .replace(/on\w+\s*=/gi, '')      // Премахва event handlers (onclick=, etc.)
    .replace(/[\x00-\x1F]/g, '')     // Премахва control characters
    .trim();
}

// Валидация на всички данни от сигнала
function validateSignalData(signalData) {
  // Валидация на име
  const nameValidation = validateName(signalData.name);
  if (!nameValidation.valid) {
    return nameValidation;
  }

  // Валидация на имейл
  const emailValidation = validateEmail(signalData.email);
  if (!emailValidation.valid) {
    return emailValidation;
  }

  // Валидация на телефон (ако е подаден)
  if (signalData.phone) {
    const phoneValidation = validatePhone(signalData.phone);
    if (!phoneValidation.valid) {
      return phoneValidation;
    }
  }

  // Проверка за задължителни полета
  if (!signalData.source) {
    return { valid: false, error: 'Моля изберете предполагаем източник' };
  }
  if (!signalData.district) {
    return { valid: false, error: 'Моля изберете квартал' };
  }
  if (!signalData.whenVal) {
    return { valid: false, error: 'Моля въведете дата и час' };
  }
  if (!signalData.checks || signalData.checks.length === 0) {
    return { valid: false, error: 'Моля изберете поне един начин на влошаване на качеството на живот' };
  }

  return { valid: true };
}

// Sanitize на целия обект с данни
function sanitizeSignalData(signalData) {
  return {
    ...signalData,
    name: signalData.name ? signalData.name.trim() : '',
    email: signalData.email ? signalData.email.trim().toLowerCase() : '',
    customSource: sanitizeInput(signalData.customSource || ''),
    address: sanitizeInput(signalData.address || ''),
    subject: sanitizeInput(signalData.subject || ''),
    desc: sanitizeInput(signalData.desc || ''),
  };
}

function getTodayKey() {
  // Use UTC date to avoid timezone issues
  return new Date().toISOString().split('T')[0];
}

async function checkRateLimit(env, email) {
  const today = getTodayKey();
  const emailNormalized = email.toLowerCase().trim();

  // Check pending (unconfirmed) requests count
  const pendingKey = `ratelimit:pending:${emailNormalized}:${today}`;
  const pendingCountStr = await env.PENDING_SIGNALS.get(pendingKey);
  const pendingCount = pendingCountStr ? parseInt(pendingCountStr, 10) : 0;

  // Check confirmed signals count
  const confirmedKey = `ratelimit:confirmed:${emailNormalized}:${today}`;
  const confirmedCountStr = await env.PENDING_SIGNALS.get(confirmedKey);
  const confirmedCount = confirmedCountStr ? parseInt(confirmedCountStr, 10) : 0;

  return {
    pendingCount,
    confirmedCount,
    canSubmitPending: pendingCount < MAX_PENDING_PER_DAY,
    canSubmitConfirmed: confirmedCount < MAX_CONFIRMED_PER_DAY,
  };
}

async function incrementPendingCount(env, email) {
  const today = getTodayKey();
  const emailNormalized = email.toLowerCase().trim();
  const pendingKey = `ratelimit:pending:${emailNormalized}:${today}`;

  const currentStr = await env.PENDING_SIGNALS.get(pendingKey);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  // TTL: 24 hours (86400 seconds) - auto cleanup
  await env.PENDING_SIGNALS.put(pendingKey, String(current + 1), {
    expirationTtl: 86400,
  });
}

async function verifyTurnstile(token, ip, secretKey) {
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  formData.append('remoteip', ip);

  console.log('Turnstile verification request:', {
    tokenLength: token?.length,
    ip,
    secretKeyLength: secretKey?.length,
    secretKeyPrefix: secretKey ? secretKey.substring(0, 10) : 'MISSING',
  });

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not configured!');
    return { success: false, errorCodes: ['missing-input-secret'], hostname: null };
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  const result = await response.json();
  console.log('Turnstile verification response:', JSON.stringify(result));
  return { success: result.success === true, errorCodes: result['error-codes'] || [], hostname: result.hostname };
}

async function sendEmail(env, { to, subject, htmlBody, plainBody }) {
  const message = {
    to: [to],
    from: env.FROM_EMAIL,
    sender: env.FROM_NAME,
    subject: subject,
    html_body: htmlBody,
    plain_body: plainBody, // Plain text version improves deliverability
    // Custom headers for better spam score
    headers: {
      'X-Priority': '3', // Normal priority
      'X-Mailer': 'TiReshavash-Signal/1.0',
    },
  };

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
    const { turnstileToken, signalData, docxBase64, letterText } = body;

    // Validate required fields
    if (!turnstileToken) {
      return jsonResponse({ success: false, error: 'Липсва Turnstile верификация' }, 400);
    }
    if (!signalData || !signalData.email || !signalData.name) {
      return jsonResponse({ success: false, error: 'Липсват задължителни данни' }, 400);
    }

    // Валидация на данните от сигнала
    const validation = validateSignalData(signalData);
    if (!validation.valid) {
      console.log('Validation failed:', validation.error);
      return jsonResponse({ success: false, error: validation.error }, 400);
    }

    // Sanitize данните
    const sanitizedSignalData = sanitizeSignalData(signalData);

    // Verify Turnstile
    const clientIP = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
    const turnstileResult = await verifyTurnstile(turnstileToken, clientIP, env.TURNSTILE_SECRET_KEY);

    if (!turnstileResult.success) {
      const errorDetails = turnstileResult.errorCodes.join(', ') || 'unknown';
      console.error('Turnstile failed:', { errorCodes: turnstileResult.errorCodes, hostname: turnstileResult.hostname });
      return jsonResponse({
        success: false,
        error: `Turnstile верификацията е неуспешна (${errorDetails}). Моля опитайте отново.`
      }, 400);
    }

    // Check rate limits
    const rateLimit = await checkRateLimit(env, sanitizedSignalData.email);
    console.log('Rate limit check:', { email: sanitizedSignalData.email, ...rateLimit });

    if (!rateLimit.canSubmitPending) {
      return jsonResponse({
        success: false,
        error: `Достигнахте максималния брой заявки за деня (${MAX_PENDING_PER_DAY}). Моля опитайте отново утре.`,
        rateLimited: true
      }, 429);
    }

    if (!rateLimit.canSubmitConfirmed) {
      return jsonResponse({
        success: false,
        error: `Вече имате потвърден сигнал за днес. Можете да изпратите нов сигнал утре.`,
        rateLimited: true
      }, 429);
    }

    // Generate confirmation token
    const token = crypto.randomUUID();
    const baseUrl = new URL(request.url).origin;
    const confirmUrl = `${baseUrl}/api/confirm/${token}`;

    // Store pending signal in KV (TTL: 24 hours = 86400 seconds)
    const pendingData = {
      signalData: sanitizedSignalData,
      docxBase64,
      letterText,
      email: sanitizedSignalData.email,
      name: sanitizedSignalData.name,
      createdAt: Date.now(),
    };

    await env.PENDING_SIGNALS.put(`pending:${token}`, JSON.stringify(pendingData), {
      expirationTtl: 86400,
    });

    // Send confirmation email with both HTML and plain text versions
    // Escape HTML special characters in letterText for HTML version
    const letterTextHtml = (letterText || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    const emailHtml = CONFIRMATION_EMAIL_TEMPLATE
      .replace(/{{name}}/g, sanitizedSignalData.name)
      .replace(/{{confirmUrl}}/g, confirmUrl)
      .replace(/{{email}}/g, sanitizedSignalData.email)
      .replace(/{{letterText}}/g, letterTextHtml);

    const emailText = CONFIRMATION_EMAIL_TEXT
      .replace(/{{name}}/g, sanitizedSignalData.name)
      .replace(/{{confirmUrl}}/g, confirmUrl)
      .replace(/{{email}}/g, sanitizedSignalData.email)
      .replace(/{{letterText}}/g, letterText || '');

    console.log('Sending confirmation email to:', sanitizedSignalData.email);
    console.log('Postal API URL:', env.POSTAL_API_URL);
    console.log('From email:', env.FROM_EMAIL);

    const emailResult = await sendEmail(env, {
      to: sanitizedSignalData.email,
      subject: 'Потвърдете сигнала си към РИОСВ – ТИ решаваш!',
      htmlBody: emailHtml,
      plainBody: emailText,
    });

    console.log('Postal API response:', JSON.stringify(emailResult));

    // Increment pending rate limit counter
    await incrementPendingCount(env, sanitizedSignalData.email);

    // Track successful submission in stats
    const statsKey = 'stats:events';
    const statsJson = await env.PENDING_SIGNALS.get(statsKey);
    const stats = statsJson ? JSON.parse(statsJson) : {};

    if (!stats['signal_submitted']) {
      stats['signal_submitted'] = { count: 0, lastOccurred: null, emails: [] };
    }
    stats['signal_submitted'].count++;
    stats['signal_submitted'].lastOccurred = Date.now();
    stats['signal_submitted'].emails.push(sanitizedSignalData.email);

    await env.PENDING_SIGNALS.put(statsKey, JSON.stringify(stats));

    return jsonResponse({
      success: true,
      message: `Изпратихме имейл за потвърждение на ${sanitizedSignalData.email}`,
    });

  } catch (error) {
    console.error('Submit error:', error.message, error.stack);
    return jsonResponse({
      success: false,
      error: `Възникна грешка: ${error.message}`,
      debug: error.stack
    }, 500);
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
