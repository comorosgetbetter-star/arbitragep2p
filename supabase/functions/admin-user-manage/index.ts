import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, targetUserId, newPassword } = await req.json()

    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing targetUserId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get_user_info') {
      // Get user email from auth
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(targetUserId)
      if (userError || !userData?.user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        email: userData.user.email,
        created_at: userData.user.created_at,
        last_sign_in_at: userData.user.last_sign_in_at,
        email_confirmed_at: userData.user.email_confirmed_at,
        phone: userData.user.phone,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'reset_password') {
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      })

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Audit log
      await supabase.from('admin_audit_logs').insert({
        admin_id: caller.id,
        action: 'ADMIN_PASSWORD_RESET',
        target_user_id: targetUserId,
        details: { reason: 'Admin emergency password reset' },
      })

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'impersonate') {
      // Generate a magic link for the target user
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(targetUserId)
      if (userError || !userData?.user?.email) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.user.email,
      })

      if (linkError || !linkData) {
        return new Response(JSON.stringify({ error: linkError?.message || 'Failed to generate link' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Audit log
      await supabase.from('admin_audit_logs').insert({
        admin_id: caller.id,
        action: 'ADMIN_IMPERSONATE',
        target_user_id: targetUserId,
        details: { email: userData.user.email },
      })

      // The generated link contains hashed_token and verification_type
      // We need to construct the proper auth callback URL
      const properties = linkData.properties
      const redirectUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(req.headers.get('origin') || supabaseUrl)}`

      return new Response(JSON.stringify({ 
        success: true, 
        url: redirectUrl,
        email: userData.user.email,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('admin-user-manage error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
