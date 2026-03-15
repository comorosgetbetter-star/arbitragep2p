import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function validateEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function generateOTP(): string {
  const array = new Uint32Array(6)
  crypto.getRandomValues(array)
  return Array.from(array, v => (v % 10).toString()).join('')
}

const LOGO_URL = 'https://hywqedthwvuiftmfmkjs.supabase.co/storage/v1/object/public/email-assets/logo-new.png'

function getResetEmailHTML(code: string, fullName: string): string {
  const year = new Date().getFullYear()
  const digits = code.split('')
  const digitCells = digits.map(d => `
    <td style="width:48px;height:56px;background-color:#0d1117;border:1px solid #30363d;border-radius:10px;text-align:center;vertical-align:middle;font-size:28px;font-weight:700;color:#ffffff;font-family:'Courier New',Courier,monospace;letter-spacing:0;">${d}</td>
  `).join('<td style="width:8px;"></td>')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - PeerBitX</title>
</head>
<body style="margin:0;padding:0;background-color:#010409;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#010409;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <!-- Logo -->
          <tr>
            <td style="padding:0 0 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${LOGO_URL}" alt="PeerBitX" width="36" height="36" style="display:block;border-radius:8px;border:0;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:20px;font-weight:700;color:#f0f6fc;letter-spacing:-0.3px;">PeerBitX</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main card -->
          <tr>
            <td style="background-color:#0d1117;border:1px solid #21262d;border-radius:16px;overflow:hidden;">
              <div style="height:3px;background:linear-gradient(90deg,#f59e0b,#d97706,#f59e0b);"></div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 36px 0;">
                    <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#f0f6fc;line-height:1.3;">Reset your password</h1>
                    <p style="margin:0 0 32px;font-size:15px;color:#8b949e;line-height:1.65;">
                      Hi ${fullName}, use this code to reset your password.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>${digitCells}</tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 36px 0;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#8b949e;">
                      Code expires in <span style="color:#f59e0b;font-weight:600;">10 minutes</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 36px 0;">
                    <div style="height:1px;background-color:#21262d;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 36px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width:20px;vertical-align:top;padding-top:1px;">
                          <span style="font-size:14px;">🔒</span>
                        </td>
                        <td style="padding-left:8px;">
                          <p style="margin:0;font-size:13px;color:#8b949e;line-height:1.6;">
                            <strong style="color:#c9d1d9;">Didn't request this?</strong> If you didn't ask to reset your password, you can safely ignore this email. Your account is secure.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#484f58;">
                © ${year} PeerBitX · All rights reserved
              </p>
              <p style="margin:0;font-size:11px;color:#30363d;">
                This is an automated message. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email || !validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists (confirmed)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'no_account', message: 'No account found with this email.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit: max 1 reset code per day per email
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('verification_codes')
      .select('id', { count: 'exact', head: true })
      .eq('email', `reset_${normalizedEmail}`)
      .gte('created_at', oneDayAgo)

    if (recentCount !== null && recentCount >= 1) {
      return new Response(JSON.stringify({ error: 'rate_limited', message: 'A reset code has already been sent today. Please try again tomorrow or contact support.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Invalidate any existing unused reset codes
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('email', `reset_${normalizedEmail}`)
      .eq('used', false)

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email: `reset_${normalizedEmail}`,
        code,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('Failed to store reset code:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to generate reset code' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const safeName = profile.full_name.replace(/[<>&"']/g, '')

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PeerBitX <noreply@contact.peerbitx.com>',
        to: [normalizedEmail],
        subject: `${code} is your PeerBitX password reset code`,
        html: getResetEmailHTML(code, safeName),
      }),
    })

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text()
      console.error('Resend API error:', errBody)
      return new Response(JSON.stringify({ error: 'Failed to send reset email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-reset-code error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
