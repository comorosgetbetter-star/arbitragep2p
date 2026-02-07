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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { email, password, setup_key } = await req.json()

    // Simple setup key to prevent unauthorized access
    if (setup_key !== 'INITIAL_ADMIN_SETUP_2024') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAdmin = existingUsers?.users?.find(u => u.email === email)

    let userId: string

    if (existingAdmin) {
      userId = existingAdmin.id
      
      // Update password if user exists
      await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    } else {
      // Create admin user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Platform Admin',
          country: 'NG'
        }
      })

      if (createError) {
        throw createError
      }

      userId = newUser.user.id
    }

    // Check if user already has admin role
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    if (!existingRole) {
      // Assign admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' })

      if (roleError) {
        // Role might already exist due to trigger, update it
        await supabaseAdmin
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', userId)
      }
    }

    // Ensure profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!existingProfile) {
      await supabaseAdmin.from('profiles').insert({
        user_id: userId,
        full_name: 'Platform Admin',
        email,
        country: 'NG'
      })
    }

    // Ensure balance record exists
    const { data: existingBalance } = await supabaseAdmin
      .from('user_balances')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!existingBalance) {
      await supabaseAdmin.from('user_balances').insert({
        user_id: userId,
        usdt_balance: 0
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user configured successfully',
        user_id: userId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Setup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
