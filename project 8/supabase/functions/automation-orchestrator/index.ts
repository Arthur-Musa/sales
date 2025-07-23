import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AutomationRequest {
  workflow_id: string
  workflow_name: string
  trigger_type: 'webhook' | 'schedule' | 'manual'
  trigger_data: any
  tenant_id?: string
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

    const automationRequest: AutomationRequest = await req.json()

    // Validate request
    if (!automationRequest.workflow_id || !automationRequest.trigger_type) {
      throw new Error('Missing required fields: workflow_id, trigger_type')
    }

    // Generate execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    // Log automation start
    const { data: logEntry, error: logError } = await supabase
      .from('automation_logs')
      .insert({
        tenant_id: automationRequest.tenant_id,
        workflow_id: automationRequest.workflow_id,
        workflow_name: automationRequest.workflow_name,
        execution_id: executionId,
        status: 'running',
        trigger_type: automationRequest.trigger_type,
        trigger_data: automationRequest.trigger_data,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (logError) throw logError

    try {
      // Execute automation based on workflow type
      const result = await executeWorkflow(
        automationRequest.workflow_id,
        automationRequest.trigger_data,
        automationRequest.tenant_id
      )

      const duration = Date.now() - startTime

      // Log successful completion
      await supabase
        .from('automation_logs')
        .update({
          status: 'completed',
          result_data: result,
          duration_ms: duration,
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          execution_id: executionId,
          result,
          duration_ms: duration
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )

    } catch (workflowError) {
      const duration = Date.now() - startTime

      // Log failure
      await supabase
        .from('automation_logs')
        .update({
          status: 'failed',
          error_message: workflowError.message,
          duration_ms: duration,
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id)

      throw workflowError
    }

  } catch (error) {
    console.error('Error in automation orchestrator:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function executeWorkflow(workflowId: string, triggerData: any, tenantId?: string) {
  // This would integrate with n8n API in production
  console.log(`Executing workflow ${workflowId} for tenant ${tenantId}`)

  switch (workflowId) {
    case 'lead-qualification':
      return await executeLeadQualification(triggerData, tenantId)
    
    case 'payment-follow-up':
      return await executePaymentFollowUp(triggerData, tenantId)
    
    case 'policy-emission':
      return await executePolicyEmission(triggerData, tenantId)
    
    case 'recovery-campaign':
      return await executeRecoveryCampaign(triggerData, tenantId)
    
    default:
      throw new Error(`Unknown workflow: ${workflowId}`)
  }
}

async function executeLeadQualification(data: any, tenantId?: string) {
  // Simulate lead qualification workflow
  const { lead_id, phone, message } = data

  // 1. Analyze message intent
  const intent = analyzeIntent(message)
  
  // 2. Score lead based on criteria
  const score = calculateLeadScore(intent, data)
  
  // 3. Determine next action
  const nextAction = score > 70 ? 'send_proposal' : 'request_more_info'

  return {
    intent,
    score,
    next_action: nextAction,
    processed_at: new Date().toISOString()
  }
}

async function executePaymentFollowUp(data: any, tenantId?: string) {
  // Simulate payment follow-up workflow
  const { sale_id, days_overdue } = data

  const urgency = days_overdue > 7 ? 'high' : days_overdue > 3 ? 'medium' : 'low'
  const message_template = getFollowUpTemplate(urgency)

  return {
    urgency,
    message_sent: true,
    template_used: message_template,
    next_follow_up: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
}

async function executePolicyEmission(data: any, tenantId?: string) {
  // Simulate policy emission workflow
  const { sale_id, client_data, product_data } = data

  // 1. Validate data
  const validation = validatePolicyData(client_data, product_data)
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
  }

  // 2. Generate policy number
  const policyNumber = generatePolicyNumber()

  // 3. Submit to insurer API
  const insurerResponse = await submitToInsurer(data)

  return {
    policy_number: policyNumber,
    insurer_response: insurerResponse,
    status: 'emitted',
    emitted_at: new Date().toISOString()
  }
}

async function executeRecoveryCampaign(data: any, tenantId?: string) {
  // Simulate recovery campaign workflow
  const { lead_id, reason, attempt_number } = data

  const message = getRecoveryMessage(reason, attempt_number)
  const next_attempt = attempt_number < 3 ? 
    new Date(Date.now() + (attempt_number * 24 * 60 * 60 * 1000)).toISOString() : 
    null

  return {
    message_sent: true,
    message_content: message,
    attempt_number,
    next_attempt,
    campaign_status: next_attempt ? 'active' : 'completed'
  }
}

// Helper functions
function analyzeIntent(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('seguro') || lowerMessage.includes('cotação')) {
    return 'insurance_interest'
  } else if (lowerMessage.includes('preço') || lowerMessage.includes('valor')) {
    return 'price_inquiry'
  } else if (lowerMessage.includes('cancelar') || lowerMessage.includes('não quero')) {
    return 'cancellation'
  }
  
  return 'general_inquiry'
}

function calculateLeadScore(intent: string, data: any): number {
  let score = 50 // Base score

  // Intent scoring
  if (intent === 'insurance_interest') score += 30
  else if (intent === 'price_inquiry') score += 20
  else if (intent === 'cancellation') score -= 40

  // Data completeness scoring
  if (data.phone) score += 10
  if (data.email) score += 10
  if (data.name) score += 10

  return Math.max(0, Math.min(100, score))
}

function getFollowUpTemplate(urgency: string): string {
  const templates = {
    low: 'gentle_reminder',
    medium: 'payment_reminder',
    high: 'urgent_payment_notice'
  }
  
  return templates[urgency] || templates.low
}

function validatePolicyData(clientData: any, productData: any) {
  const errors = []
  
  if (!clientData.cpf && !clientData.cnpj) {
    errors.push('CPF or CNPJ required')
  }
  
  if (!clientData.full_name) {
    errors.push('Full name required')
  }
  
  if (!productData.category) {
    errors.push('Product category required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

function generatePolicyNumber(): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  
  return `${year}${timestamp}${random}`
}

async function submitToInsurer(data: any) {
  // Simulate insurer API call
  console.log('Submitting to insurer API:', data)
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return {
    status: 'accepted',
    reference_id: `INS_${Date.now()}`,
    estimated_emission_time: '24h'
  }
}

function getRecoveryMessage(reason: string, attemptNumber: number): string {
  const messages = {
    'abandono_pagamento': [
      'Olá! Notamos que você não finalizou seu pagamento. Podemos ajudar?',
      'Ainda interessado em finalizar sua compra? Estamos aqui para ajudar!',
      'Última chance! Não perca esta oportunidade.'
    ],
    'sem_resposta': [
      'Oi! Como posso ajudar com seu seguro?',
      'Ainda tem interesse em nossa proposta?',
      'Estamos aqui se precisar de alguma coisa!'
    ]
  }

  const messageArray = messages[reason] || messages['sem_resposta']
  return messageArray[Math.min(attemptNumber - 1, messageArray.length - 1)]
}