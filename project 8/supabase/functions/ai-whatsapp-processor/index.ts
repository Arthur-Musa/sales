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
    const lowerMessage = messageText.toLowerCase()
    let response = ''
    let shouldCreateLead = false
    let shouldQualifyLead = false
    let productInterest = ''

    // Análise de intenção da mensagem
    if (lowerMessage.includes('seguro') || lowerMessage.includes('cotação') || lowerMessage.includes('cotar')) {
      response = await getTemplate(supabase, 'onboarding_inicial')
      shouldCreateLead = true
    } else if (lowerMessage.includes('carro') || lowerMessage.includes('auto') || lowerMessage.includes('veículo')) {
      response = await getTemplate(supabase, 'qualificacao_auto', { vehicle_type: 'veículo' })
      productInterest = 'Seguro Auto'
      shouldQualifyLead = true
    } else if (lowerMessage.includes('casa') || lowerMessage.includes('residencial') || lowerMessage.includes('apartamento')) {
      response = '🏠 Excelente escolha! Para seu seguro residencial:\n\n1️⃣ É casa ou apartamento?\n2️⃣ Quantos metros quadrados?\n3️⃣ Qual o CEP?\n4️⃣ Valor aproximado do imóvel?'
      productInterest = 'Seguro Residencial'
      shouldQualifyLead = true
    } else if (lowerMessage.includes('vida') || lowerMessage.includes('familiar')) {
      response = '❤️ Seguro de vida é muito importante! Me conte:\n\n1️⃣ Qual sua idade?\n2️⃣ Tem dependentes?\n3️⃣ Qual valor de cobertura deseja?\n4️⃣ Tem algum problema de saúde?'
      productInterest = 'Seguro de Vida'
      shouldQualifyLead = true
    } else if (lowerMessage.includes('viagem') || lowerMessage.includes('viajar')) {
      response = '✈️ Ótima escolha! Para seu seguro viagem:\n\n1️⃣ Destino nacional ou internacional?\n2️⃣ Quantos dias de viagem?\n3️⃣ Quantas pessoas?\n4️⃣ Data da viagem?'
      productInterest = 'Seguro Viagem'
      shouldQualifyLead = true
    } else if (lowerMessage.includes('minha apólice') || lowerMessage.includes('segunda via') || lowerMessage.includes('documento')) {
      response = await handlePolicyRequest(supabase, conversation.phone)
    } else if (lowerMessage.includes('cancelar') || lowerMessage.includes('cancelamento')) {
      response = '❌ Para cancelar sua apólice, preciso confirmar alguns dados:\n\n1️⃣ Seu CPF\n2️⃣ Número da apólice\n3️⃣ Motivo do cancelamento\n\nMe informe esses dados para prosseguir.'
    } else if (lowerMessage.includes('sinistro') || lowerMessage.includes('acidente') || lowerMessage.includes('acionamento')) {
      response = '🚨 Vou te ajudar com o sinistro!\n\n1️⃣ Qual tipo de sinistro?\n2️⃣ Quando aconteceu?\n3️⃣ Número da sua apólice\n4️⃣ Tem fotos do ocorrido?\n\nMe envie essas informações para abrir seu sinistro.'
    } else if (isVehicleInfo(messageText)) {
      response = await processVehicleInfo(supabase, conversation, messageText)
    } else if (isCEP(messageText)) {
      response = await processCEPInfo(supabase, conversation, messageText)
    } else if (isPersonalInfo(messageText)) {
      response = await processPersonalInfo(supabase, conversation, messageText)
    } else {
      response = await getTemplate(supabase, 'onboarding_inicial')
    }

    // Send response
    await sendWhatsAppResponse(supabase, conversation.phone, response)

    // Create or update lead
    if (shouldCreateLead || shouldQualifyLead) {
      await createOrUpdateLead(supabase, conversation, messageText, productInterest, shouldQualifyLead)
    }

    // Update AI confidence based on interaction
    await updateAIConfidence(supabase, conversation.id, messageText)

  } catch (error) {
    console.error('Error processing AI message:', error)
    
    // Send fallback message
    await sendWhatsAppResponse(
      supabase, 
      conversation.phone, 
      'Desculpe, tive um problema técnico. Um atendente humano entrará em contato em breve! 🤖'
    )
  }
}

async function getTemplate(supabase: any, templateName: string, variables: any = {}) {
  const { data: template } = await supabase
    .from('whatsapp_templates')
    .select('content, variables')
    .eq('name', templateName)
    .eq('is_active', true)
    .single()

  if (!template) {
    return 'Desculpe, não consegui processar sua mensagem. Um atendente entrará em contato!'
  }

  let content = template.content
  
  // Replace variables in template
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value as string)
  }

  // Update template usage
  await supabase
    .from('whatsapp_templates')
    .update({ usage_count: supabase.sql`usage_count + 1` })
    .eq('name', templateName)

  return content
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
    return '😔 Não encontrei nenhuma apólice ativa para este número. Tem certeza que é o mesmo telefone usado na contratação?\n\nSe precisar de ajuda, digite "atendimento".'
  }

  const policy = policies[0]
  return `📄 Aqui está sua apólice mais recente:\n\n🔢 Número: ${policy.policy_number}\n📅 Vigência: ${policy.coverage_start_date} a ${policy.coverage_end_date}\n\n📎 ${policy.pdf_url}\n\nPrecisa de mais alguma coisa?`
}

function isVehicleInfo(message: string): boolean {
  const vehiclePatterns = [
    /\b(honda|toyota|ford|chevrolet|volkswagen|fiat|hyundai|nissan|bmw|mercedes)\b/i,
    /\b(civic|corolla|focus|onix|gol|hb20|compass|renegade)\b/i,
    /\b(20\d{2})\b/, // Year pattern
  ]
  
  return vehiclePatterns.some(pattern => pattern.test(message))
}

function isCEP(message: string): boolean {
  return /\b\d{5}-?\d{3}\b/.test(message)
}

function isPersonalInfo(message: string): boolean {
  const personalPatterns = [
    /\b\d{2,3}\s*(anos?|years?)\b/i,
    /\bidade\b/i,
    /\b(solteiro|casado|divorciado|viúvo)\b/i,
    /\b(masculino|feminino|homem|mulher)\b/i
  ]
  
  return personalPatterns.some(pattern => pattern.test(message))
}

async function processVehicleInfo(supabase: any, conversation: any, message: string) {
  // Extract vehicle info and update lead
  const vehicleInfo = extractVehicleInfo(message)
  
  if (conversation.lead_id) {
    await supabase
      .from('leads')
      .update({
        metadata: supabase.sql`metadata || ${JSON.stringify({ vehicle: vehicleInfo })}`,
        ai_score: supabase.sql`LEAST(ai_score + 15, 100)`
      })
      .eq('id', conversation.lead_id)
  }

  return `Perfeito! ${vehicleInfo.brand} ${vehicleInfo.model} ${vehicleInfo.year} 🚗\n\nAgora me informe seu CEP para calcular o valor do seguro na sua região.`
}

async function processCEPInfo(supabase: any, conversation: any, message: string) {
  const cep = message.match(/\b\d{5}-?\d{3}\b/)?.[0]
  
  if (conversation.lead_id && cep) {
    await supabase
      .from('leads')
      .update({
        metadata: supabase.sql`metadata || ${JSON.stringify({ cep })}`,
        ai_score: supabase.sql`LEAST(ai_score + 10, 100)`
      })
      .eq('id', conversation.lead_id)
  }

  return `Ótimo! CEP ${cep} registrado 📍\n\nVocê tem garage ou estacionamento coberto? Isso influencia no valor do seguro.`
}

async function processPersonalInfo(supabase: any, conversation: any, message: string) {
  const personalInfo = extractPersonalInfo(message)
  
  if (conversation.lead_id) {
    await supabase
      .from('leads')
      .update({
        metadata: supabase.sql`metadata || ${JSON.stringify({ personal: personalInfo })}`,
        ai_score: supabase.sql`LEAST(ai_score + 10, 100)`
      })
      .eq('id', conversation.lead_id)
  }

  return `Perfeito! Informações registradas ✅\n\nCom base no que me informou, vou gerar sua cotação personalizada. Um momento...`
}

function extractVehicleInfo(message: string) {
  const brands = ['honda', 'toyota', 'ford', 'chevrolet', 'volkswagen', 'fiat', 'hyundai', 'nissan', 'bmw', 'mercedes']
  const models = ['civic', 'corolla', 'focus', 'onix', 'gol', 'hb20', 'compass', 'renegade']
  
  const brand = brands.find(b => message.toLowerCase().includes(b)) || 'Não informado'
  const model = models.find(m => message.toLowerCase().includes(m)) || 'Não informado'
  const year = message.match(/\b(20\d{2})\b/)?.[0] || 'Não informado'
  
  return { brand, model, year }
}

function extractPersonalInfo(message: string) {
  const age = message.match(/\b(\d{2,3})\s*(anos?|years?)\b/i)?.[1]
  const maritalStatus = message.match(/\b(solteiro|casado|divorciado|viúvo)\b/i)?.[1]
  const gender = message.match(/\b(masculino|feminino|homem|mulher)\b/i)?.[1]
  
  return { age, maritalStatus, gender }
}

async function createOrUpdateLead(supabase: any, conversation: any, message: string, productInterest: string, isQualification: boolean) {
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
          full_name: `Cliente ${conversation.phone}`,
          lgpd_consent: false
        })
        .select()
        .single()

      if (newClientError) {
        console.error('Error creating client:', newClientError)
        return
      }
      client = newClient
    }

    // Create or update lead
    if (conversation.lead_id) {
      // Update existing lead
      await supabase
        .from('leads')
        .update({
          product_interest: productInterest,
          status: isQualification ? 'qualificado' : 'novo',
          ai_score: supabase.sql`LEAST(ai_score + 20, 100)`,
          ai_confidence: supabase.sql`LEAST(ai_confidence + 0.1, 1.0)`
        })
        .eq('id', conversation.lead_id)
    } else {
      // Create new lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          client_id: client.id,
          phone: conversation.phone,
          status: isQualification ? 'qualificado' : 'novo',
          product_interest: productInterest,
          ai_score: 60,
          ai_confidence: 0.7,
          metadata: { initial_message: message }
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
    }

  } catch (error) {
    console.error('Error creating/updating lead:', error)
  }
}

async function updateAIConfidence(supabase: any, conversationId: string, message: string) {
  // Simple confidence calculation based on message content
  let confidenceBoost = 0.0
  
  if (message.length > 10) confidenceBoost += 0.05
  if (/\b(sim|yes|quero|preciso|gostaria)\b/i.test(message)) confidenceBoost += 0.1
  if (/\b(não|no|nao|dispenso)\b/i.test(message)) confidenceBoost -= 0.1
  
  await supabase
    .from('whatsapp_conversations')
    .update({
      ai_confidence: supabase.sql`GREATEST(0, LEAST(ai_confidence + ${confidenceBoost}, 1.0))`
    })
    .eq('id', conversationId)
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