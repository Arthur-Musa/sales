import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateRequest, requireRole, ROLES } from '../_shared/auth-middleware/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate user
    const user = await authenticateRequest(req)
    
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const userId = pathSegments[pathSegments.length - 1]

    if (req.method === 'GET') {
      // List users or get specific user
      if (userId && userId !== 'user-management') {
        // Get specific user
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify(data),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      } else {
        // List users with filters
        requireRole([ROLES.ADMIN, ROLES.GESTOR])(user)

        const search = url.searchParams.get('search')
        const role = url.searchParams.get('role')
        const isActive = url.searchParams.get('is_active')

        let query = supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        }

        if (role) {
          query = query.eq('role', role)
        }

        if (isActive !== null) {
          query = query.eq('is_active', isActive === 'true')
        }

        const { data, error } = await query

        if (error) throw error

        return new Response(
          JSON.stringify(data),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    if (req.method === 'POST') {
      // Create new user or invite
      requireRole([ROLES.ADMIN])(user)

      const userData = await req.json()

      // Create auth user first
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password || generateRandomPassword(),
        email_confirm: true
      })

      if (authError) throw authError

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          is_active: true,
          permissions: getDefaultPermissions(userData.role)
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Send invitation email
      await sendInvitationEmail(userData.email, userData.full_name, userData.role)

      return new Response(
        JSON.stringify({ success: true, user: profile }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        },
      )
    }

    if (req.method === 'PUT') {
      // Update user
      requireRole([ROLES.ADMIN, ROLES.GESTOR])(user)

      const userData = await req.json()

      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (req.method === 'DELETE') {
      // Delete user
      requireRole([ROLES.ADMIN])(user)

      // Soft delete by deactivating
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      },
    )

  } catch (error) {
    console.error('Error in user management:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function getDefaultPermissions(role: string): string[] {
  const permissionMap = {
    [ROLES.ADMIN]: [
      'manage_users', 'manage_sales', 'manage_commissions', 'manage_policies',
      'view_reports', 'export_data', 'manage_system', 'view_audit_logs'
    ],
    [ROLES.GESTOR]: [
      'view_users', 'manage_sales', 'manage_commissions', 'view_policies',
      'view_reports', 'export_data', 'view_audit_logs'
    ],
    [ROLES.VENDAS]: [
      'view_own_sales', 'view_own_commissions', 'view_policies'
    ],
    [ROLES.OPERADOR]: [
      'view_sales', 'manage_policies', 'emit_policies', 'view_reports'
    ],
    [ROLES.COBRANCA]: [
      'view_sales', 'view_commissions', 'view_reports'
    ]
  }

  return permissionMap[role] || []
}

async function sendInvitationEmail(email: string, fullName: string, role: string) {
  // Implementation would depend on email service (SendGrid, etc.)
  console.log(`Sending invitation email to ${email} for role ${role}`)
  
  // For now, just log the invitation
  // In production, integrate with email service
}