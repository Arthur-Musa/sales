import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface IntegrationRequest {
  tenant_id: string
  integration_type: string
  provider: string
  action: string
  data: any
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

    const integrationRequest: IntegrationRequest = await req.json()
    const startTime = Date.now()

    // Get integration config
    const { data: integration, error: integrationError } = await supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', integrationRequest.tenant_id)
      .eq('integration_type', integrationRequest.integration_type)
      .eq('provider', integrationRequest.provider)
      .single()

    if (integrationError || !integration) {
      throw new Error(`Integration not found: ${integrationRequest.integration_type}/${integrationRequest.provider}`)
    }

    if (integration.status !== 'active') {
      throw new Error(`Integration not active: ${integration.status}`)
    }

    let result: any
    let success = false

    try {
      // Execute integration action
      result = await executeIntegrationAction(
        integration,
        integrationRequest.action,
        integrationRequest.data
      )
      success = true

    } catch (actionError) {
      result = { error: actionError.message }
      throw actionError

    } finally {
      const duration = Date.now() - startTime

      // Log integration call
      await supabase
        .from('integration_logs')
        .insert({
          tenant_id: integrationRequest.tenant_id,
          integration_type: integrationRequest.integration_type,
          provider: integrationRequest.provider,
          action: integrationRequest.action,
          request_data: integrationRequest.data,
          response_data: result,
          success,
          duration_ms: duration,
          status_code: success ? 200 : 500,
          error_message: success ? null : result?.error
        })
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in integration manager:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function executeIntegrationAction(integration: any, action: string, data: any) {
  const { integration_type, provider, config, credentials } = integration

  switch (integration_type) {
    case 'whatsapp':
      return await executeWhatsAppAction(provider, config, credentials, action, data)
    
    case 'email':
      return await executeEmailAction(provider, config, credentials, action, data)
    
    case 'crm':
      return await executeCRMAction(provider, config, credentials, action, data)
    
    case 'insurer':
      return await executeInsurerAction(provider, config, credentials, action, data)
    
    default:
      throw new Error(`Unsupported integration type: ${integration_type}`)
  }
}

async function executeWhatsAppAction(provider: string, config: any, credentials: any, action: string, data: any) {
  switch (action) {
    case 'send_message':
      return await sendWhatsAppMessage(provider, config, credentials, data)
    
    case 'send_template':
      return await sendWhatsAppTemplate(provider, config, credentials, data)
    
    case 'send_media':
      return await sendWhatsAppMedia(provider, config, credentials, data)
    
    default:
      throw new Error(`Unsupported WhatsApp action: ${action}`)
  }
}

async function sendWhatsAppMessage(provider: string, config: any, credentials: any, data: any) {
  const { phone, message } = data

  if (provider === 'z-api') {
    const response = await fetch(`${config.base_url}/v1/messages/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.token}`
      },
      body: JSON.stringify({
        phone: phone.replace(/\D/g, ''),
        message
      })
    })

    if (!response.ok) {
      throw new Error(`Z-API error: ${response.statusText}`)
    }

    return await response.json()
  }

  throw new Error(`Unsupported WhatsApp provider: ${provider}`)
}

async function sendWhatsAppTemplate(provider: string, config: any, credentials: any, data: any) {
  // Implementation for template messages
  console.log('Sending WhatsApp template:', data)
  return { message_id: `template_${Date.now()}`, status: 'sent' }
}

async function sendWhatsAppMedia(provider: string, config: any, credentials: any, data: any) {
  // Implementation for media messages
  console.log('Sending WhatsApp media:', data)
  return { message_id: `media_${Date.now()}`, status: 'sent' }
}

async function executeEmailAction(provider: string, config: any, credentials: any, action: string, data: any) {
  switch (action) {
    case 'send_email':
      return await sendEmail(provider, config, credentials, data)
    
    case 'send_template':
      return await sendEmailTemplate(provider, config, credentials, data)
    
    default:
      throw new Error(`Unsupported email action: ${action}`)
  }
}

async function sendEmail(provider: string, config: any, credentials: any, data: any) {
  const { to, subject, html, text } = data

  if (provider === 'sendgrid') {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.from_email, name: config.from_name },
        subject,
        content: [
          { type: 'text/html', value: html },
          { type: 'text/plain', value: text }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.statusText}`)
    }

    return { message_id: response.headers.get('x-message-id'), status: 'sent' }
  }

  throw new Error(`Unsupported email provider: ${provider}`)
}

async function sendEmailTemplate(provider: string, config: any, credentials: any, data: any) {
  // Implementation for email templates
  console.log('Sending email template:', data)
  return { message_id: `template_${Date.now()}`, status: 'sent' }
}

async function executeCRMAction(provider: string, config: any, credentials: any, action: string, data: any) {
  switch (action) {
    case 'create_lead':
      return await createCRMLead(provider, config, credentials, data)
    
    case 'update_lead':
      return await updateCRMLead(provider, config, credentials, data)
    
    case 'sync_data':
      return await syncCRMData(provider, config, credentials, data)
    
    default:
      throw new Error(`Unsupported CRM action: ${action}`)
  }
}

async function createCRMLead(provider: string, config: any, credentials: any, data: any) {
  // Implementation for CRM lead creation
  console.log('Creating CRM lead:', data)
  return { lead_id: `crm_${Date.now()}`, status: 'created' }
}

async function updateCRMLead(provider: string, config: any, credentials: any, data: any) {
  // Implementation for CRM lead update
  console.log('Updating CRM lead:', data)
  return { lead_id: data.lead_id, status: 'updated' }
}

async function syncCRMData(provider: string, config: any, credentials: any, data: any) {
  // Implementation for CRM data sync
  console.log('Syncing CRM data:', data)
  return { synced_records: 0, status: 'completed' }
}

async function executeInsurerAction(provider: string, config: any, credentials: any, action: string, data: any) {
  switch (action) {
    case 'emit_policy':
      return await emitPolicy(provider, config, credentials, data)
    
    case 'check_status':
      return await checkPolicyStatus(provider, config, credentials, data)
    
    case 'cancel_policy':
      return await cancelPolicy(provider, config, credentials, data)
    
    default:
      throw new Error(`Unsupported insurer action: ${action}`)
  }
}

async function emitPolicy(provider: string, config: any, credentials: any, data: any) {
  // Implementation for policy emission
  console.log('Emitting policy:', data)
  
  // Simulate API call to insurer
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return {
    policy_number: generatePolicyNumber(),
    status: 'emitted',
    pdf_url: `https://storage.example.com/policies/${data.sale_id}.pdf`,
    emitted_at: new Date().toISOString()
  }
}

async function checkPolicyStatus(provider: string, config: any, credentials: any, data: any) {
  // Implementation for policy status check
  console.log('Checking policy status:', data)
  return { policy_number: data.policy_number, status: 'active' }
}

async function cancelPolicy(provider: string, config: any, credentials: any, data: any) {
  // Implementation for policy cancellation
  console.log('Canceling policy:', data)
  return { policy_number: data.policy_number, status: 'canceled' }
}

function generatePolicyNumber(): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  
  return `${year}${timestamp}${random}`
}