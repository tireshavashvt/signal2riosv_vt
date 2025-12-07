/**
 * GET /api/test-postal - Direct Postal API test
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

  const testEmail = url.searchParams.get('email') || 'debug-test@tireshavashzavt.org';
  const fromEmail = url.searchParams.get('from') || env.FROM_EMAIL || 'noreply@tireshavashzavt.org';

  try {
    // Test 1: Check if POSTAL_API_URL is set
    if (!env.POSTAL_API_URL) {
      return jsonResponse({
        success: false,
        error: 'POSTAL_API_URL is not configured',
        step: 'config_check'
      });
    }

    // Test 2: Check if POSTAL_API_KEY is set
    if (!env.POSTAL_API_KEY) {
      return jsonResponse({
        success: false,
        error: 'POSTAL_API_KEY is not configured',
        step: 'config_check'
      });
    }

    // Test 3: Try to send a test email
    const message = {
      to: [testEmail],
      from: fromEmail,
      sender: env.FROM_NAME || 'Debug Test',
      subject: `[DEBUG TEST] ${new Date().toISOString()}`,
      html_body: `
        <html>
        <body>
          <h1>Debug Test Email</h1>
          <p>This is a test email from the debug console.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>POSTAL_API_URL: ${env.POSTAL_API_URL}</p>
        </body>
        </html>
      `,
    };

    console.log('Test Postal - Sending to:', testEmail);
    console.log('Test Postal - API URL:', env.POSTAL_API_URL);
    console.log('Test Postal - Message:', JSON.stringify(message));

    const apiUrl = `${env.POSTAL_API_URL}/api/v1/send/message`;
    console.log('Test Postal - Full API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Server-API-Key': env.POSTAL_API_KEY,
      },
      body: JSON.stringify(message),
    });

    const responseText = await response.text();
    console.log('Test Postal - Response status:', response.status);
    console.log('Test Postal - Response body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (response.ok) {
      return jsonResponse({
        success: true,
        message: `Test email sent to ${testEmail}`,
        postalResponse: responseData,
        config: {
          POSTAL_API_URL: env.POSTAL_API_URL,
          FROM_EMAIL: env.FROM_EMAIL,
          FROM_NAME: env.FROM_NAME,
        }
      });
    } else {
      return jsonResponse({
        success: false,
        error: `Postal API returned ${response.status}`,
        step: 'send_email',
        postalResponse: responseData,
        config: {
          POSTAL_API_URL: env.POSTAL_API_URL,
          FROM_EMAIL: env.FROM_EMAIL,
        }
      });
    }

  } catch (error) {
    console.error('Test Postal Error:', error.message, error.stack);
    return jsonResponse({
      success: false,
      error: error.message,
      stack: error.stack,
      step: 'exception'
    }, 500);
  }
}
