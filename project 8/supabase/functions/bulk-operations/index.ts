import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface BulkOperationRequest {
  operation: 'update_status' | 'send_messages' | 'approve_commissions' | 'reemit_policies'
  resourceType: 'sales' | 'leads' | 'commissions' | 'policies'
  resourceIds: string[]
  parameters: any
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

    const bulkRequest: BulkOperationRequest = await req.json()

    if (!bulkRequest.resourceIds || bulkRequest.resourceIds.length === 0) {
      throw new Error('Resource IDs are required')
    }

    let results: any[] = []
    let errors: any[] = []

    switch (bulkRequest.operation) {
      case 'update_status':
        results = await bulkUpdateStatus(supabase, bulkRequest)
        break
      
      case 'send_messages':
        results = await bulkSendMessages(supabase, bulkRequest)
        break
      
      case 'approve_commissions':
        results = await bulkApproveCommissions(supabase, bulkRequest)
        break
      
      case 'reemit_policies':
        results = await bulkReemitPolicies(supabase, bulkRequest)
        break
      
      default:
        throw new Error('Invalid bulk operation')
    }

    // Log bulk operation
    await supabase.rpc('log_audit_event', {
      p_user_id: bulkRequest.parameters.userId || null,
      p_action: `bulk_${bulkRequest.operation}`,
      p_resource_type: bulkRequest.resourceType,
      p_resource_id: bulkRequest.resourceIds.join(','),
      p_new_values: { 
        operation: bulkRequest.operation,
        affected_count: results.length,
        errors_count: errors.length,
        parameters: bulkRequest.parameters
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        errors,
        summary: {
          total: bulkRequest.resourceIds.length,
          successful: results.length,
          failed: errors.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in bulk operation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function bulkUpdateStatus(supabase: any, request: BulkOperationRequest) {
  const { resourceType, resourceIds, parameters } = request
  const { newStatus, lossReason, userId } = parameters

  const results = []

  for (const id of resourceIds) {
    try {
      const updateData: any = { status: newStatus }
      if (lossReason) updateData.loss_reason = lossReason
      if (newStatus === 'pago') updateData.closed_at = new Date().toISOString()

      const { data, error } = await supabase
        .from(resourceType)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      results.push({ id, success: true, data })

      // Trigger additional actions based on status
      if (newStatus === 'pago' && resourceType === 'sales') {
        // Trigger policy emission
        await supabase.functions.invoke('emit-policy', {
          body: { saleId: id }
        })
      }

    } catch (error) {
      results.push({ id, success: false, error: error.message })
    }
  }

  return results
}

async function bulkSendMessages(supabase: any, request: BulkOperationRequest) {
  const { resourceIds, parameters } = request
  const { templateName, templateParams, customMessage } = parameters

  const results = []

  for (const id of resourceIds) {
    try {
      // Get resource with phone number
      let phone = ''
      
      if (request.resourceType === 'sales') {
        const { data: sale } = await supabase
          .from('sales')
          .select('clients(phone)')
          .eq('id', id)
          .single()
        phone = sale?.clients?.phone
      } else if (request.resourceType === 'leads') {
        const { data: lead } = await supabase
          .from('leads')
          .select('phone')
          .eq('id', id)
          .single()
        phone = lead?.phone
      }

      if (!phone) {
        throw new Error('Phone number not found')
      }

      // Send message
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone,
          message: customMessage,
          templateName,
          templateParams
        }
      })

      if (error) throw error
      results.push({ id, success: true, data })

    } catch (error) {
      results.push({ id, success: false, error: error.message })
    }
  }

  return results
}

async function bulkApproveCommissions(supabase: any, request: BulkOperationRequest) {
  const { resourceIds, parameters } = request
  const { approvedBy, notes } = parameters

  const results = []

  for (const id of resourceIds) {
    try {
      const { data, error } = await supabase
        .from('commissions')
        .update({
          status: 'aprovada',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          notes
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      results.push({ id, success: true, data })

    } catch (error) {
      results.push({ id, success: false, error: error.message })
    }
  }

  return results
}

async function bulkReemitPolicies(supabase: any, request: BulkOperationRequest) {
  const { resourceIds } = request

  const results = []

  for (const id of resourceIds) {
    try {
      // Get policy sale ID
      const { data: policy } = await supabase
        .from('policies')
        .select('sale_id')
        .eq('id', id)
        .single()

      if (!policy) throw new Error('Policy not found')

      // Trigger reemission
      const { data, error } = await supabase.functions.invoke('emit-policy', {
        body: { saleId: policy.sale_id }
      })

      if (error) throw error
      results.push({ id, success: true, data })

    } catch (error) {
      results.push({ id, success: false, error: error.message })
    }
  }

  return results
}