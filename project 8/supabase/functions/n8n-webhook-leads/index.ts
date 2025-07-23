import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface N8nLeadData {
  phone: string
  full_name?: string
  email?: string
  product_interest?: string
  source: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  metadata?: any
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

    const leadData: N8nLeadData = await req.json()

    // Validate required fields
    if (!leadData.phone || !leadData.source) {
      throw new Error('Phone and source are required fields')
    }

    // Clean and format phone number
    const cleanPhone = leadData.phone.replace(/\D/g, '')
    const formattedPhone = cleanPhone.length === 11 
      ? `+55${cleanPhone}` 
      : leadData.phone

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, status')
      .eq('phone', formattedPhone)
      .single()

    if (existingLead) {
      // Update existing lead if it's in early stage
      if (['novo', 'abandonado'].includes(existingLead.status)) {
        const { data: updatedLead, error: updateError } = await supabase
          .from('leads')
          .update({
            status: 'novo',
            product_interest: leadData.product_interest || existingLead.product_interest,
            utm_source: leadData.utm_source,
            utm_medium: leadData.utm_medium,
            utm_campaign: leadData.utm_campaign,
            metadata: {
              ...existingLead.metadata,
              ...leadData.metadata,
              reactivated_at: new Date().toISOString(),
              reactivation_source: leadData.source
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLead.id)
          .select()
          .single()

        if (updateError) throw updateError

        return new Response(
          JSON.stringify({ 
            success: true, 
            action: 'updated',
            lead_id: existingLead.id,
            message: 'Lead reativado com sucesso'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      } else {
        return new Response(
          JSON.stringify({ 
            success: true, 
            action: 'skipped',
            lead_id: existingLead.id,
            message: 'Lead já existe em estágio avançado'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    // Find or create client
    let clientId = null
    if (leadData.full_name) {
      // Try to find existing client by phone
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', formattedPhone)
        .single()

      if (existingClient) {
        clientId = existingClient.id
        
        // Update client data if we have more information
        if (leadData.email || leadData.full_name) {
          await supabase
            .from('clients')
            .update({
              full_name: leadData.full_name,
              email: leadData.email,
              updated_at: new Date().toISOString()
            })
            .eq('id', clientId)
        }
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            phone: formattedPhone,
            full_name: leadData.full_name,
            email: leadData.email,
            lgpd_consent: false, // Will be collected during conversation
            metadata: {
              created_via: 'n8n_webhook',
              source: leadData.source
            }
          })
          .select()
          .single()

        if (clientError) {
          console.error('Error creating client:', clientError)
        } else {
          clientId = newClient.id
        }
      }
    }

    // Calculate initial AI score based on available data
    let aiScore = 30 // Base score
    if (leadData.full_name) aiScore += 15
    if (leadData.email) aiScore += 15
    if (leadData.product_interest) aiScore += 20
    if (leadData.utm_source === 'google') aiScore += 10
    if (leadData.utm_source === 'facebook') aiScore += 5

    // Create new lead
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        client_id: clientId,
        phone: formattedPhone,
        source: leadData.source,
        status: 'novo',
        product_interest: leadData.product_interest,
        ai_score: Math.min(aiScore, 100),
        ai_confidence: 0.6,
        utm_source: leadData.utm_source,
        utm_medium: leadData.utm_medium,
        utm_campaign: leadData.utm_campaign,
        metadata: {
          ...leadData.metadata,
          received_via: 'n8n_webhook',
          received_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (leadError) throw leadError

    // Create WhatsApp conversation if source is WhatsApp
    if (leadData.source === 'whatsapp' || leadData.source.includes('whatsapp')) {
      const { error: conversationError } = await supabase
        .from('whatsapp_conversations')
        .insert({
          client_id: clientId,
          lead_id: newLead.id,
          phone: formattedPhone,
          status: 'active',
          ai_active: true,
          ai_confidence: 0.6
        })

      if (conversationError) {
        console.error('Error creating WhatsApp conversation:', conversationError)
      }
    }

    // Trigger AI processing if we have enough data
    if (leadData.product_interest) {
      try {
        await supabase.functions.invoke('ai-processor', {
          body: {
            type: 'lead_qualification',
            input_data: {
              phone: formattedPhone,
              product_interest: leadData.product_interest,
              source: leadData.source,
              client_data: {
                full_name: leadData.full_name,
                email: leadData.email
              }
            },
            tenant_id: newLead.tenant_id
          }
        })
      } catch (aiError) {
        console.error('Error triggering AI processing:', aiError)
        // Don't fail the webhook if AI processing fails
      }
    }

    // Create notification for team
    await supabase
      .from('notifications')
      .insert({
        type: 'info',
        priority: 'medium',
        title: 'Novo Lead Recebido',
        message: `Lead ${leadData.full_name || formattedPhone} via ${leadData.source}${leadData.product_interest ? ` - ${leadData.product_interest}` : ''}`,
        metadata: {
          lead_id: newLead.id,
          source: leadData.source,
          product_interest: leadData.product_interest
        }
      })

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        action: 'lead_created_via_webhook',
        resource_type: 'lead',
        resource_id: newLead.id,
        new_values: {
          source: leadData.source,
          phone: formattedPhone,
          product_interest: leadData.product_interest,
          utm_data: {
            source: leadData.utm_source,
            medium: leadData.utm_medium,
            campaign: leadData.utm_campaign
          }
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: 'created',
        lead_id: newLead.id,
        client_id: clientId,
        message: 'Lead criado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      },
    )

  } catch (error) {
    console.error('Error processing n8n webhook:', error)
    
    // Log error for debugging
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    await supabase
      .from('audit_logs')
      .insert({
        action: 'webhook_error',
        resource_type: 'lead',
        new_values: { 
          error: error.message,
          webhook_data: await req.json().catch(() => ({}))
        }
      })

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})