import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

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

    // Verify superadmin access
    const authHeader = req.headers.get('authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Invalid token')

    const { data: systemUser } = await supabase
      .from('system_users')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (!systemUser) throw new Error('Access denied: Superadmin required')

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      if (action === 'dashboard') {
        // Get global dashboard metrics
        const metrics = await getGlobalMetrics(supabase)
        
        return new Response(
          JSON.stringify(metrics),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      if (action === 'tenants') {
        // List all tenants with metrics
        const { data: tenants, error } = await supabase
          .from('tenants')
          .select(`
            *,
            tenant_subscriptions(*),
            tenant_domains(*),
            users(count),
            sales(count),
            policies(count)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(
          JSON.stringify(tenants),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      if (action === 'audit-logs') {
        // Get global audit logs
        const { data: logs, error } = await supabase
          .from('audit_trail')
          .select(`
            *,
            tenants(name, slug)
          `)
          .order('timestamp', { ascending: false })
          .limit(100)

        if (error) throw error

        return new Response(
          JSON.stringify(logs),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    if (req.method === 'POST') {
      if (action === 'impersonate') {
        // Impersonate tenant admin
        const { tenant_id, duration_minutes = 60 } = await req.json()

        if (!tenant_id) throw new Error('Tenant ID required')

        // Get tenant admin user
        const { data: tenantAdmin } = await supabase
          .from('users')
          .select('*')
          .eq('tenant_id', tenant_id)
          .eq('role', 'admin')
          .eq('is_active', true)
          .single()

        if (!tenantAdmin) throw new Error('Tenant admin not found')

        // Create impersonation session
        const impersonationId = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + duration_minutes * 60 * 1000)

        // Log impersonation start
        await supabase
          .from('audit_trail')
          .insert({
            tenant_id,
            system_user_id: systemUser.id,
            action: 'impersonation_started',
            resource_type: 'user',
            resource_id: tenantAdmin.id,
            impersonation_id: impersonationId,
            new_values: {
              duration_minutes,
              expires_at: expiresAt.toISOString()
            }
          })

        // Generate impersonation token
        const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: tenantAdmin.email,
          options: {
            redirectTo: `https://${tenant_id}.suaplataforma.com/dashboard?impersonation=${impersonationId}`
          }
        })

        if (sessionError) throw sessionError

        return new Response(
          JSON.stringify({ 
            success: true,
            impersonation_id: impersonationId,
            access_url: session.properties?.action_link,
            expires_at: expiresAt.toISOString()
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      if (action === 'end-impersonation') {
        // End impersonation session
        const { impersonation_id } = await req.json()

        await supabase
          .from('audit_trail')
          .insert({
            system_user_id: systemUser.id,
            action: 'impersonation_ended',
            resource_type: 'session',
            resource_id: impersonation_id
          })

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      if (action === 'suspend-tenant') {
        // Suspend tenant
        const { tenant_id, reason } = await req.json()

        await supabase
          .from('tenants')
          .update({ status: 'suspended' })
          .eq('id', tenant_id)

        await supabase
          .from('audit_trail')
          .insert({
            tenant_id,
            system_user_id: systemUser.id,
            action: 'tenant_suspended',
            resource_type: 'tenant',
            resource_id: tenant_id,
            new_values: { reason }
          })

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )

  } catch (error) {
    console.error('Error in superadmin management:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function getGlobalMetrics(supabase: any) {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get tenant metrics
  const { data: tenants } = await supabase
    .from('tenants')
    .select('status')

  const { data: subscriptions } = await supabase
    .from('tenant_subscriptions')
    .select('status, amount_monthly')

  // Get sales metrics across all tenants
  const { data: salesToday } = await supabase
    .from('sales')
    .select('value, status')
    .gte('created_at', today)

  const { data: salesMonth } = await supabase
    .from('sales')
    .select('value, status')
    .gte('created_at', thirtyDaysAgo)

  // Get user metrics
  const { data: users } = await supabase
    .from('users')
    .select('is_active, last_login')

  // Calculate metrics
  const totalTenants = tenants?.length || 0
  const activeTenants = tenants?.filter(t => t.status === 'active').length || 0
  const suspendedTenants = tenants?.filter(t => t.status === 'suspended').length || 0

  const totalMRR = subscriptions?.reduce((sum, s) => {
    return s.status === 'active' ? sum + (s.amount_monthly || 0) : sum
  }, 0) || 0

  const salesTodayCount = salesToday?.length || 0
  const salesTodayValue = salesToday?.reduce((sum, s) => sum + (s.value || 0), 0) || 0

  const salesMonthCount = salesMonth?.length || 0
  const salesMonthValue = salesMonth?.reduce((sum, s) => sum + (s.value || 0), 0) || 0

  const totalUsers = users?.length || 0
  const activeUsers = users?.filter(u => u.is_active).length || 0

  return {
    tenants: {
      total: totalTenants,
      active: activeTenants,
      suspended: suspendedTenants,
      trial: tenants?.filter(t => t.status === 'setup').length || 0
    },
    revenue: {
      mrr: totalMRR,
      arr: totalMRR * 12,
      churn_rate: 0 // Calculate based on historical data
    },
    sales: {
      today: {
        count: salesTodayCount,
        value: salesTodayValue
      },
      month: {
        count: salesMonthCount,
        value: salesMonthValue
      }
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers
    }
  }
}