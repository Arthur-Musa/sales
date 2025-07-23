import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WhatsAppMessage {
  messageId: string
  phone: string
  fromMe: boolean
  type: string
  text?: {
    message: string
  }
  timestamp: number
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

    const webhookData = await req.json()
    console.log('WhatsApp webhook received:', webhookData)

    // Handle different webhook types from Z-API
    if (webhookData.type === 'ReceivedCallback') {
      await handleIncomingMessage(supabase, webhookData.data)
    } else if (webhookData.type === 'DeliveryCallback') {
      await handleDeliveryStatus(supabase, webhookData.data)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function handleIncomingMessage(supabase: any, messageData: WhatsAppMessage) {
  const phone = `+${messageData.phone}`
  const messageText = messageData.text?.message || ''

  // Find or create conversation
  let { data: conversation, error: convError } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('phone', phone)
    .single()

  if (convError || !conversation) {
    // Create new conversation
    const { data: newConv, error: newConvError } = await supabase
      .from('whatsapp_conversations')
      .insert({
        phone: phone,
        status: 'active',
        ai_active: true
      })
      .select()
      .single()

    if (newConvError) {
      console.error('Error creating conversation:', newConvError)
      return
    }
    conversation = newConv
  }

  // Store message
  await supabase
    .from('whatsapp_messages')
    .insert({
      conversation_id: conversation.id,
      message_id: messageData.messageId,
      direction: 'inbound',
      type: messageData.type,
      content: messageText,
      timestamp: new Date(messageData.timestamp * 1000).toISOString()
    })

  // Process message with AI if conversation is AI-active
  if (conversation.ai_active) {
    await processMessageWithAI(supabase, conversation, messageText)
  }

  // Update conversation last message time
  await supabase
    .from('whatsapp_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation.id)
}

async function handleDeliveryStatus(supabase: any, deliveryData: any) {
  // Update message delivery status
  await supabase
    .from('whatsapp_messages')
    .update({
      delivered: deliveryData.status === 'delivered',
      read: deliveryData.status === 'read'
    })
    .eq('message_id', deliveryData.messageId)
}

async function processMessageWithAI(supabase: any, conversation: any, messageText: string) {
  try {
    // Simple AI logic - in production this would be more sophisticated
    const lowerMessage = messageText.toLowerCase()

    let response = ''
    let shouldCreateLead = false

    if (lowerMessage.includes('seguro') || lowerMessage.includes('cotação') || lowerMessage.includes('cotar')) {
      response = '🚗 Ótimo! Vou te ajudar com a cotação do seu seguro. Para começar, me diga: é para carro, casa ou vida?'
      shouldCreateLead = true
    } else if (lowerMessage.includes('carro') || lowerMessage.includes('auto')) {
      response = '🚙 Perfeito! Para cotar seu seguro auto, preciso de algumas informações:\n\n1️⃣ Qual o modelo e ano do seu carro?\n2️⃣ Qual seu CEP?\n3️⃣ Você tem garage?'
    } else if (lowerMessage.includes('casa') || lowerMessage.includes('residencial')) {
      response = '🏠 Excelente escolha! Para seu seguro residencial:\n\n1️⃣ É casa ou apartamento?\n2️⃣ Quantos metros quadrados?\n3️⃣ Qual o CEP?'
    } else if (lowerMessage.includes('vida')) {
      response = '❤️ Seguro de vida é muito importante! Me conte:\n\n1️⃣ Qual sua idade?\n2️⃣ Tem dependentes?\n3️⃣ Qual valor de cobertura deseja?'
    } else if (lowerMessage.includes('minha apólice') || lowerMessage.includes('segunda via')) {
      response = await handlePolicyRequest(supabase, conversation.phone)
    } else if (lowerMessage.includes('cancelar')) {
      response = '❌ Para cancelar sua apólice, preciso confirmar alguns dados. Me informe seu CPF e número da apólice.'
    } else {
      response = '👋 Olá! Sou a Olga, sua assistente de seguros! Posso te ajudar com:\n\n🚗 Seguro Auto\n🏠 Seguro Residencial\n❤️ Seguro de Vida\n📄 Segunda via de apólice\n\nO que você precisa hoje?'
    }

    // Send response
    await sendWhatsAppResponse(supabase, conversation.phone, response)

    // Create lead if needed
    if (shouldCreateLead) {
      await createLeadFromConversation(supabase, conversation, messageText)
    }

  } catch (error) {
    console.error('Error processing AI message:', error)
  }
}

async function handlePolicyRequest(supabase: any, phone: string): Promise<string> {
  // Find client's policies
  const { data: policies, error } = await supabase
    .from('policies')
    .select(`
      *,
      clients!inner(phone)
    `)
    .eq('clients.phone', phone)
    .eq('status', 'emitida')
    .order('created_at', { ascending: false })

  if (error || !policies || policies.length === 0) {
    return '😔 Não encontrei nenhuma apólice ativa para este número. Tem certeza que é o mesmo telefone usado na contratação?'
  }

  const policy = policies[0]
  return `📄 Aqui está sua apólice mais recente:\n\n🔢 Número: ${policy.policy_number}\n📅 Vigência: ${policy.coverage_start_date} a ${policy.coverage_end_date}\n\n${policy.pdf_url}\n\nPrecisa de mais alguma coisa?`
}

async function sendWhatsAppResponse(supabase: any, phone: string, message: string) {
  try {
    // Get WhatsApp API config
    const { data: config } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'whatsapp_api_config')
      .single()

    const whatsappConfig = config?.value

    if (!whatsappConfig?.base_url || !whatsappConfig?.token) {
      console.error('WhatsApp API not configured')
      return
    }

    // Send message
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
      console.error('WhatsApp API error:', response.statusText)
      return
    }

    // Log outbound message
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
    console.error('Error sending WhatsApp response:', error)
  }
}

async function createLeadFromConversation(supabase: any, conversation: any, initialMessage: string) {
  try {
    // Find or create client
    let { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', conversation.phone)
      .single()

    if (clientError || !client) {
      // Create new client
      const { data: newClient, error: newClientError } = await supabase
        .from('clients')
        .insert({
          phone: conversation.phone,
          full_name: `Cliente ${conversation.phone}`, // Will be updated when we get the name
          lgpd_consent: false // Will be collected during the flow
        })
        .select()
        .single()

      if (newClientError) {
        console.error('Error creating client:', newClientError)
        return
      }
      client = newClient
    }

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        client_id: client.id,
        phone: conversation.phone,
        status: 'novo',
        product_interest: extractProductInterest(initialMessage),
        ai_score: 50, // Initial score
        ai_confidence: 0.7,
        metadata: { initial_message: initialMessage }
      })
      .select()
      .single()

    if (leadError) {
      console.error('Error creating lead:', leadError)
      return
    }

    // Update conversation with lead
    await supabase
      .from('whatsapp_conversations')
      .update({
        client_id: client.id,
        lead_id: lead.id
      })
      .eq('id', conversation.id)

  } catch (error) {
    console.error('Error creating lead from conversation:', error)
  }
}

function extractProductInterest(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('carro') || lowerMessage.includes('auto')) {
    return 'Seguro Auto'
  } else if (lowerMessage.includes('casa') || lowerMessage.includes('residencial')) {
    return 'Seguro Residencial'
  } else if (lowerMessage.includes('vida')) {
    return 'Seguro de Vida'
  }
  
  return 'Seguro Geral'
}