import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface N8nWorkflowRequest {
  workflow_name: string
  trigger_data: any
  tenant_id?: string
  execution_mode?: 'sync' | 'async'
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
    const action = pathSegments[pathSegments.length - 1]

    // Handle webhook endpoints
    if (action === 'webhook-leads') {
      return await handleLeadsWebhook(supabase, req)
    }

    const { workflow_name, trigger_data, tenant_id, execution_mode = 'async' }: N8nWorkflowRequest = await req.json()

    if (!workflow_name) {
      throw new Error('Workflow name is required')
    }

    // Get n8n configuration
    const { data: config } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'n8n_config')
      .single()

    if (!config?.value) {
      throw new Error('n8n not configured')
    }

    const n8nConfig = config.value

    // Prepare workflow execution
    const executionPayload = {
      workflowName: workflow_name,
      data: {
        ...trigger_data,
        tenant_id,
        execution_id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    }

    // Execute workflow in n8n
    const response = await fetch(`${n8nConfig.base_url}/webhook/${workflow_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${n8nConfig.api_key}`
      },
      body: JSON.stringify(executionPayload)
    })

    if (!response.ok) {
      throw new Error(`n8n workflow failed: ${response.statusText}`)
    }

    const result = await response.json()

    // Log execution
    await supabase
      .from('automation_logs')
      .insert({
        tenant_id,
        workflow_id: workflow_name,
        workflow_name,
        execution_id: executionPayload.data.execution_id,
        status: 'completed',
        trigger_type: 'api',
        trigger_data,
        result_data: result
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        execution_id: executionPayload.data.execution_id,
        result 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error executing n8n workflow:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function handleLeadsWebhook(supabase: any, req: Request) {
  // Redirect to dedicated leads webhook function
  const leadData = await req.json()
  
  const { data, error } = await supabase.functions.invoke('n8n-webhook-leads', {
    body: leadData
  })

  if (error) throw error
  
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}