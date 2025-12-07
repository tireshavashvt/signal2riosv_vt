/**
 * POST /api/submit - Submit signal with Turnstile verification
 */

// Plain text version for multipart emails (improves deliverability)
const CONFIRMATION_EMAIL_TEXT = `Здравейте {{name}},

Получихме Вашия сигнал за замърсяване на въздуха.

За да бъде изпратен към РИОСВ – Велико Търново, моля потвърдете имейл адреса си като посетите следния линк:

{{confirmUrl}}

ВАЖНО: Линкът е валиден 24 часа. След изтичането му ще трябва да подадете сигнала отново.

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

    // Generate confirmation token
    const token = crypto.randomUUID();
    const baseUrl = new URL(request.url).origin;
    const confirmUrl = `${baseUrl}/api/confirm/${token}`;

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

    // Send confirmation email with both HTML and plain text versions
    const emailHtml = CONFIRMATION_EMAIL_TEMPLATE
      .replace(/{{name}}/g, signalData.name)
      .replace(/{{confirmUrl}}/g, confirmUrl)
      .replace(/{{email}}/g, signalData.email);

    const emailText = CONFIRMATION_EMAIL_TEXT
      .replace(/{{name}}/g, signalData.name)
      .replace(/{{confirmUrl}}/g, confirmUrl)
      .replace(/{{email}}/g, signalData.email);

    console.log('Sending confirmation email to:', signalData.email);
    console.log('Postal API URL:', env.POSTAL_API_URL);
    console.log('From email:', env.FROM_EMAIL);

    const emailResult = await sendEmail(env, {
      to: signalData.email,
      subject: 'Потвърдете сигнала си към РИОСВ – ТИ решаваш!',
      htmlBody: emailHtml,
      plainBody: emailText,
    });

    console.log('Postal API response:', JSON.stringify(emailResult));

    // Track successful submission in stats
    const statsKey = 'stats:events';
    const statsJson = await env.PENDING_SIGNALS.get(statsKey);
    const stats = statsJson ? JSON.parse(statsJson) : {};

    if (!stats['signal_submitted']) {
      stats['signal_submitted'] = { count: 0, lastOccurred: null, emails: [] };
    }
    stats['signal_submitted'].count++;
    stats['signal_submitted'].lastOccurred = Date.now();
    stats['signal_submitted'].emails.push(signalData.email);

    await env.PENDING_SIGNALS.put(statsKey, JSON.stringify(stats));

    return jsonResponse({
      success: true,
      message: `Изпратихме имейл за потвърждение на ${signalData.email}`,
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
