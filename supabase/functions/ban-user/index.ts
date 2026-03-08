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

    // Check admin role
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

    const { targetUserId, reason } = await req.json()

    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing targetUserId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get target user profile before deleting
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, phone, full_name')
      .eq('user_id', targetUserId)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Add to banned_users table
    const { error: banError } = await supabase.from('banned_users').insert({
      email: profile.email.toLowerCase().trim(),
      phone: profile.phone || null,
      full_name: profile.full_name,
      reason: reason || 'Banned by admin',
      banned_by: caller.id,
    })

    if (banError) {
      console.error('Ban insert error:', banError)
      // If already banned, continue with deletion
      if (!banError.message?.includes('duplicate')) {
        return new Response(JSON.stringify({ error: 'Failed to ban user' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Delete all user data from all tables
    const tables = [
      'ticket_messages',
      'support_tickets',
      'staking_sessions',
      'trades',
      'withdrawals',
      'deposits',
      'user_crypto_balances',
      'user_balances',
      'referrals',
      'referral_codes',
      'profiles',
      'user_roles',
    ]

    for (const table of tables) {
      // ticket_messages uses sender_id
      const col = table === 'ticket_messages' ? 'sender_id' : 'user_id'
      await supabase.from(table).delete().eq(col, targetUserId)
    }

    // Delete the auth user
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(targetUserId)
    if (deleteAuthError) {
      console.error('Delete auth user error:', deleteAuthError)
    }

    // Audit log
    await supabase.from('admin_audit_logs').insert({
      admin_id: caller.id,
      action: 'USER_BANNED',
      target_user_id: targetUserId,
      details: {
        email: profile.email,
        full_name: profile.full_name,
        reason: reason || 'Banned by admin',
      },
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('ban-user error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
