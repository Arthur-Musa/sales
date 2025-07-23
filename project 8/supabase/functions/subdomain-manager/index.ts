import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
}

interface SubdomainRequest {
  action: 'create' | 'delete' | 'verify'
  tenant_id: string
  subdomain: string
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

    const { action, tenant_id, subdomain }: SubdomainRequest = await req.json()

    if (!action || !tenant_id || !subdomain) {
      throw new Error('Missing required fields: action, tenant_id, subdomain')
    }

    let result: any

    switch (action) {
      case 'create':
        result = await createSubdomain(supabase, tenant_id, subdomain)
        break
      
      case 'delete':
        result = await deleteSubdomain(supabase, tenant_id, subdomain)
        break
      
      case 'verify':
        result = await verifySubdomain(supabase, tenant_id, subdomain)
        break
      
      default:
        throw new Error(`Unsupported action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in subdomain manager:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function createSubdomain(supabase: any, tenantId: string, subdomain: string) {
  // 1. Validate subdomain format
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    throw new Error('Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.')
  }

  // 2. Check if subdomain is available
  const { data: existingDomain } = await supabase
    .from('tenant_domains')
    .select('id')
    .eq('domain', `${subdomain}.suaplataforma.com`)
    .single()

  if (existingDomain) {
    throw new Error('Subdomain already exists')
  }

  // 3. Create DNS record (simulate - in production use actual DNS provider)
  const dnsResult = await createDNSRecord(subdomain)
  
  // 4. Request SSL certificate (simulate - in production use Let's Encrypt)
  const sslResult = await requestSSLCertificate(subdomain)

  // 5. Store domain configuration
  const { data: domain, error: domainError } = await supabase
    .from('tenant_domains')
    .insert({
      tenant_id: tenantId,
      domain: `${subdomain}.suaplataforma.com`,
      is_primary: true,
      ssl_status: 'pending',
      dns_configured: true
    })
    .select()
    .single()

  if (domainError) throw domainError

  // 6. Log domain creation
  await supabase
    .from('audit_trail')
    .insert({
      tenant_id: tenantId,
      action: 'subdomain_created',
      resource_type: 'domain',
      resource_id: domain.id,
      new_values: {
        subdomain,
        dns_result: dnsResult,
        ssl_result: sslResult
      }
    })

  return {
    domain: `${subdomain}.suaplataforma.com`,
    dns_configured: true,
    ssl_status: 'pending',
    estimated_propagation: '5-10 minutes'
  }
}

async function deleteSubdomain(supabase: any, tenantId: string, subdomain: string) {
  // 1. Get domain record
  const { data: domain } = await supabase
    .from('tenant_domains')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('domain', `${subdomain}.suaplataforma.com`)
    .single()

  if (!domain) {
    throw new Error('Domain not found')
  }

  // 2. Delete DNS record
  await deleteDNSRecord(subdomain)

  // 3. Revoke SSL certificate
  await revokeSSLCertificate(subdomain)

  // 4. Remove domain record
  await supabase
    .from('tenant_domains')
    .delete()
    .eq('id', domain.id)

  // 5. Log domain deletion
  await supabase
    .from('audit_trail')
    .insert({
      tenant_id: tenantId,
      action: 'subdomain_deleted',
      resource_type: 'domain',
      resource_id: domain.id,
      old_values: { subdomain, domain: domain.domain }
    })

  return {
    deleted: true,
    domain: `${subdomain}.suaplataforma.com`
  }
}

async function verifySubdomain(supabase: any, tenantId: string, subdomain: string) {
  // 1. Check DNS propagation
  const dnsStatus = await checkDNSPropagation(subdomain)
  
  // 2. Check SSL certificate status
  const sslStatus = await checkSSLStatus(subdomain)

  // 3. Update domain record
  await supabase
    .from('tenant_domains')
    .update({
      dns_configured: dnsStatus.configured,
      ssl_status: sslStatus.status,
      ssl_expires_at: sslStatus.expires_at
    })
    .eq('tenant_id', tenantId)
    .eq('domain', `${subdomain}.suaplataforma.com`)

  return {
    domain: `${subdomain}.suaplataforma.com`,
    dns_configured: dnsStatus.configured,
    ssl_status: sslStatus.status,
    ssl_expires_at: sslStatus.expires_at,
    ready: dnsStatus.configured && sslStatus.status === 'active'
  }
}

// DNS Provider Integration (simulate - replace with actual provider)
async function createDNSRecord(subdomain: string) {
  console.log(`Creating DNS record for ${subdomain}.suaplataforma.com`)
  
  // In production, integrate with:
  // - AWS Route53
  // - Cloudflare API
  // - Google Cloud DNS
  // - etc.
  
  return {
    record_type: 'CNAME',
    name: subdomain,
    value: 'app.suaplataforma.com',
    ttl: 300,
    status: 'created'
  }
}

async function deleteDNSRecord(subdomain: string) {
  console.log(`Deleting DNS record for ${subdomain}.suaplataforma.com`)
  return { status: 'deleted' }
}

async function checkDNSPropagation(subdomain: string) {
  console.log(`Checking DNS propagation for ${subdomain}.suaplataforma.com`)
  
  // Simulate DNS check
  return {
    configured: true,
    propagated: true,
    checked_at: new Date().toISOString()
  }
}

// SSL Certificate Management (simulate - replace with Let's Encrypt)
async function requestSSLCertificate(subdomain: string) {
  console.log(`Requesting SSL certificate for ${subdomain}.suaplataforma.com`)
  
  // In production, use Let's Encrypt ACME protocol
  return {
    certificate_id: `cert_${Date.now()}`,
    status: 'pending',
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  }
}

async function revokeSSLCertificate(subdomain: string) {
  console.log(`Revoking SSL certificate for ${subdomain}.suaplataforma.com`)
  return { status: 'revoked' }
}

async function checkSSLStatus(subdomain: string) {
  console.log(`Checking SSL status for ${subdomain}.suaplataforma.com`)
  
  return {
    status: 'active',
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    issuer: 'Let\'s Encrypt',
    checked_at: new Date().toISOString()
  }
}