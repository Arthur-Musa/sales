import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { leadId, reason } = await req.json()

    if (!leadId) {
      throw new Error('Lead ID is required')
    }

    // Get lead and client details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        clients(*),
        sales(*)
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead not found')
    }

    // Get recovery campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('recovery_campaigns')
      .select('*')
      .eq('lead_id', leadId)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (campaignError) {
      console.error('No active recovery campaign found')
      return new Response(
        JSON.stringify({ error: 'No active recovery campaign' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if we've exceeded max attempts
    if (campaign.attempts >= campaign.max_attempts) {
      await supabase
        .from('recovery_campaigns')
        .update({ status: 'cancelado' })
        .eq('id', campaign.id)

      return new Response(
        JSON.stringify({ message: 'Max attempts reached, campaign canceled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Generate recovery message based on reason and attempt number
    const message = generateRecoveryMessage(lead, reason, campaign.attempts + 1)

    // Send WhatsApp message
    await sendWhatsAppMessage(supabase, lead.clients.phone, message)

    // Update campaign
    const nextAttemptIntervals = [60, 360, 1440] // 1h, 6h, 24h in minutes
    const nextInterval = nextAttemptIntervals[campaign.attempts] || 1440
    const nextAttemptAt = new Date(Date.now() + nextInterval * 60 * 1000)

    await supabase
      .from('recovery_campaigns')
      .update({
        attempts: campaign.attempts + 1,
        next_attempt_at: nextAttemptAt.toISOString()
      })
      .eq('id', campaign.id)

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'recovery_message_sent',
      p_resource_type: 'recovery_campaign',
      p_resource_id: campaign.id,
      p_new_values: { 
        attempt: campaign.attempts + 1,
        reason,
        message: message.substring(0, 100) + '...'
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        attempt: campaign.attempts + 1,
        nextAttemptAt: nextAttemptAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error sending recovery message:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function generateRecoveryMessage(lead: any, reason: string, attemptNumber: number): string {
  const clientName = lead.clients.full_name.split(' ')[0]
  
  const messages = {
    'abandono': {
      1: `Oi ${clientName}! 👋 Notamos que você não concluiu sua cotação de seguro. Precisa de ajuda? É só responder aqui! 😊`,
      2: `${clientName}, ainda está interessado em proteger seu patrimônio? 🛡️ Sua cotação está guardada e você pode finalizar em 2 minutos!`,
      3: `Última chance, ${clientName}! 🚨 Não deixe seu patrimônio desprotegido. Finalize sua cotação agora com desconto especial! 💰`
    },
    'pagamento_falhou': {
      1: `Opa ${clientName}! 😅 Parece que houve um probleminha no pagamento. Vamos tentar novamente? É rapidinho!`,
      2: `${clientName}, que tal tentarmos outro método de pagamento? 💳 PIX é instantâneo e super seguro!`,
      3: `${clientName}, não desista! 💪 Temos outras opções de pagamento. Sua proteção é importante!`
    },
    'checkout_expirado': {
      1: `${clientName}, seu link de pagamento expirou! 😔 Mas não se preocupe, vou gerar um novo para você agora mesmo! ⚡`,
      2: `${clientName}, ainda quer finalizar seu seguro? 🤔 Posso gerar um novo link de pagamento em segundos!`,
      3: `Última oportunidade, ${clientName}! 🎯 Não perca mais tempo, sua proteção está a um clique de distância!`
    }
  }

  const reasonMessages = messages[reason] || messages['abandono']
  return reasonMessages[attemptNumber] || reasonMessages[3]
}

async function sendWhatsAppMessage(supabase: any, phone: string, message: string) {
  try {
    // Get WhatsApp API config
    const { data: config } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'whatsapp_api_config')
      .single()

    const whatsappConfig = config?.value

    if (!whatsappConfig?.base_url || !whatsappConfig?.token) {
      throw new Error('WhatsApp API not configured')
    }

    // Send message via WhatsApp API
    const response = await fetch(`${whatsappConfig.base_url}/v1/messages/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${whatsappConfig.token}`
      },
      body: JSON.stringify({
        phone: phone.replace(/\D/g, ''),
        message: message
      })
    })

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`)
    }

    // Log message in database
    const { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone', phone)
      .single()

    if (conversation) {
      await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          direction: 'outbound',
          type: 'text',
          content: message,
          delivered: true
        })
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}