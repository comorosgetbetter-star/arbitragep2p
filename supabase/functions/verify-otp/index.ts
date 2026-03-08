import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function validateEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, code, password, fullName, phone, country } = await req.json()

    // Validate all inputs
    if (!email || !validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'Invalid verification code format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return new Response(JSON.stringify({ error: 'Password must be 8-128 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!fullName || typeof fullName !== 'string' || fullName.length < 2 || fullName.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid name' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (phone && (typeof phone !== 'string' || phone.length > 20)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (country && (typeof country !== 'string' || country.length > 100)) {
      return new Response(JSON.stringify({ error: 'Invalid country' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit: max 10 verify attempts per email in 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count: recentAttempts } = await supabase
      .from('verification_codes')
      .select('id', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .eq('used', true)
      .gte('created_at', tenMinAgo)

    if (recentAttempts !== null && recentAttempts >= 10) {
      return new Response(JSON.stringify({ error: 'Too many verification attempts. Please wait and try again.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check code validity
    const { data: codeRecord, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !codeRecord) {
      return new Response(JSON.stringify({ error: 'Invalid or expired verification code' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', codeRecord.id)

    // Sanitize metadata
    const safeName = fullName.replace(/[<>&"']/g, '').trim()

    // Create user with confirmed email
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: safeName,
        phone: (phone || '').replace(/[<>&"']/g, '').trim(),
        country: (country || '').replace(/[<>&"']/g, '').trim(),
      },
    })

    if (createError) {
      console.error('Create user error:', createError)
      if (createError.message?.toLowerCase().includes('already') || createError.message?.toLowerCase().includes('exists')) {
        return new Response(JSON.stringify({ error: 'This email address is already registered' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ error: 'Failed to create account' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Clean up old codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', normalizedEmail)

    return new Response(JSON.stringify({ success: true, userId: userData.user?.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('verify-otp error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
