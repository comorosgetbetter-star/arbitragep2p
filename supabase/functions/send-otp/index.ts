import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function validateEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateName(name: string): boolean {
  return typeof name === 'string' && name.length >= 2 && name.length <= 100
}

function generateOTP(): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}

const LOGO_URL = 'https://hywqedthwvuiftmfmkjs.supabase.co/storage/v1/object/public/email-assets/logo.png'

function getEmailHTML(code: string, fullName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - PeerBitX</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0e1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0e1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
          <tr>
            <td style="padding:28px 40px 24px;text-align:center;border-bottom:1px solid #1f2937;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${LOGO_URL}" alt="PeerBitX" width="38" height="38" style="display:block;border-radius:8px;border:0;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;line-height:1;">PeerBitX</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Verify Your Email Address</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#9ca3af;line-height:1.6;">
                Hello ${fullName},<br/>
                Thank you for registering with ArbitrageP2P. Please use the verification code below to complete your account setup.
              </p>
              <div style="background:linear-gradient(135deg,#1e3a5f,#0f2744);border:2px solid #3b82f6;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
                <p style="margin:0 0 8px;font-size:12px;color:#93c5fd;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your Verification Code</p>
                <p style="margin:0;font-size:40px;font-weight:800;color:#ffffff;letter-spacing:12px;font-family:'Courier New',monospace;">${code}</p>
              </div>
              <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;line-height:1.6;">
                This code will expire in <strong style="color:#f59e0b;">10 minutes</strong>. Do not share this code with anyone. Our team will never ask you for this code.
              </p>
              <div style="background-color:#1c1917;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 28px;">
                <p style="margin:0;font-size:13px;color:#fbbf24;font-weight:600;">⚠️ Can't find this email?</p>
                <p style="margin:4px 0 0;font-size:13px;color:#d4d4d8;line-height:1.5;">
                  Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. Some email providers may filter verification emails. If found there, please mark it as "Not Spam" for future communications.
                </p>
              </div>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                If you did not create an account with ArbitrageP2P, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1f2937;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} ArbitrageP2P. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:#4b5563;">
                This is an automated message. Please do not reply to this email.
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
    const { email, fullName } = await req.json()

    // Validate inputs
    if (!email || !validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!fullName || !validateName(fullName)) {
      return new Response(JSON.stringify({ error: 'Invalid name (2-100 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Sanitize name for HTML injection
    const safeName = fullName.replace(/[<>&"']/g, '')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Invalidate any existing unused codes for this email
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('email', email.toLowerCase().trim())
      .eq('used', false)

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email: email.toLowerCase().trim(),
        code,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('Failed to store OTP:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to generate verification code' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PeerBitX <noreply@contact.peerbitx.com>',
        to: [email.toLowerCase().trim()],
        subject: `${code} is your ArbitrageP2P verification code`,
        html: getEmailHTML(code, safeName),
      }),
    })

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text()
      console.error('Resend API error:', errBody)
      return new Response(JSON.stringify({ error: 'Failed to send verification email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-otp error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
