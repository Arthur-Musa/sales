import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface CreateTenantRequest {
  name: string
  slug: string
  cnpj?: string
  email: string
  phone?: string
  admin_name: string
  admin_email: string
  plan?: string
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

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const tenantId = pathSegments[pathSegments.length - 1]

    if (req.method === 'GET') {
      // List tenants (superadmin only) or get specific tenant
      if (tenantId && tenantId !== 'tenant-management') {
        const { data, error } = await supabase
          .from('tenants')
          .select(`
            *,
            tenant_subscriptions(*),
            tenant_domains(*),
            tenant_integrations(*)
          `)
          .eq('id', tenantId)
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
        // List all tenants (superadmin only)
        const { data, error } = await supabase
          .from('tenants')
          .select(`
            *,
            tenant_subscriptions(*),
            tenant_domains(*),
            _count:users(count)
          `)
          .order('created_at', { ascending: false })

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
      // Create new tenant
      const tenantData: CreateTenantRequest = await req.json()

      // Validate required fields
      if (!tenantData.name || !tenantData.slug || !tenantData.email || !tenantData.admin_name || !tenantData.admin_email) {
        throw new Error('Missing required fields')
      }

      // Check if slug is available
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantData.slug)
        .single()

      if (existingTenant) {
        throw new Error('Slug already exists')
      }

      // Create tenant with admin user
      const { data: newTenantId, error: createError } = await supabase
        .rpc('create_tenant_with_admin', {
          tenant_name: tenantData.name,
          tenant_slug: tenantData.slug,
          admin_email: tenantData.admin_email,
          admin_name: tenantData.admin_name,
          admin_password: generateRandomPassword()
        })

      if (createError) throw createError

      // Setup subdomain (would integrate with DNS provider)
      await setupSubdomain(tenantData.slug)

      // Setup default integrations
      await setupDefaultIntegrations(newTenantId)

      // Send welcome email
      await sendWelcomeEmail(tenantData.admin_email, tenantData.admin_name, tenantData.slug)

      // Log tenant creation
      await supabase
        .from('audit_trail')
        .insert({
          tenant_id: newTenantId,
          action: 'tenant_created',
          resource_type: 'tenant',
          resource_id: newTenantId,
          new_values: {
            name: tenantData.name,
            slug: tenantData.slug,
            admin_email: tenantData.admin_email
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          tenant_id: newTenantId,
          subdomain: `${tenantData.slug}.suaplataforma.com`,
          admin_login_url: `https://${tenantData.slug}.suaplataforma.com/login`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        },
      )
    }

    if (req.method === 'PUT') {
      // Update tenant
      const tenantData = await req.json()

      const { data, error } = await supabase
        .from('tenants')
        .update(tenantData)
        .eq('id', tenantId)
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
      // Suspend/cancel tenant
      const { data, error } = await supabase
        .from('tenants')
        .update({ 
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId)
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
    console.error('Error in tenant management:', error)
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

async function setupSubdomain(slug: string) {
  // Integration with DNS provider (AWS Route53, Cloudflare, etc.)
  console.log(`Setting up subdomain: ${slug}.suaplataforma.com`)
  
  // In production, this would:
  // 1. Create DNS record via provider API
  // 2. Setup SSL certificate (Let's Encrypt)
  // 3. Configure CDN/reverse proxy
  
  return true
}

async function setupDefaultIntegrations(tenantId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Setup default integrations for new tenant
  const defaultIntegrations = [
    {
      tenant_id: tenantId,
      integration_type: 'email',
      provider: 'sendgrid',
      status: 'setup',
      config: {
        from_email: 'noreply@suaplataforma.com',
        from_name: 'Olga AI'
      }
    },
    {
      tenant_id: tenantId,
      integration_type: 'whatsapp',
      provider: 'z-api',
      status: 'setup',
      config: {
        webhook_url: `https://suaplataforma.com/webhooks/whatsapp/${tenantId}`
      }
    }
  ]

  await supabase
    .from('tenant_integrations')
    .insert(defaultIntegrations)
}

async function sendWelcomeEmail(email: string, name: string, slug: string) {
  // Send welcome email with setup instructions
  console.log(`Sending welcome email to ${email} for tenant ${slug}`)
  
  // In production, integrate with email service
  return true
}