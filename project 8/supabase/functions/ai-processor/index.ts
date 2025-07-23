import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AIProcessingRequest {
  type: 'lead_qualification' | 'message_analysis' | 'intent_detection' | 'sentiment_analysis'
  input_data: any
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

    const { type, input_data, tenant_id }: AIProcessingRequest = await req.json()

    let result: any

    switch (type) {
      case 'lead_qualification':
        result = await processLeadQualification(input_data)
        break
      
      case 'message_analysis':
        result = await analyzeMessage(input_data)
        break
      
      case 'intent_detection':
        result = await detectIntent(input_data)
        break
      
      case 'sentiment_analysis':
        result = await analyzeSentiment(input_data)
        break
      
      default:
        throw new Error(`Unsupported AI processing type: ${type}`)
    }

    // Log AI processing
    await supabase
      .from('automation_logs')
      .insert({
        tenant_id,
        workflow_id: `ai_${type}`,
        workflow_name: `AI ${type.replace('_', ' ')}`,
        execution_id: crypto.randomUUID(),
        status: 'completed',
        trigger_type: 'ai_processing',
        trigger_data: { type, input_summary: summarizeInput(input_data) },
        result_data: result
      })

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in AI processing:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function processLeadQualification(data: any) {
  const { message, phone, client_data } = data
  
  // Simulate AI lead qualification
  let score = 50 // Base score
  
  // Message analysis
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes('seguro') || lowerMessage.includes('cotação')) score += 30
  if (lowerMessage.includes('urgente') || lowerMessage.includes('preciso')) score += 20
  if (lowerMessage.includes('preço') || lowerMessage.includes('valor')) score += 15
  
  // Client data completeness
  if (client_data?.email) score += 10
  if (client_data?.cpf) score += 15
  if (client_data?.age && client_data.age > 25) score += 10
  
  const confidence = Math.min(score / 100, 1.0)
  const priority = score > 80 ? 'high' : score > 60 ? 'medium' : 'low'
  
  return {
    score: Math.min(score, 100),
    confidence,
    priority,
    recommended_action: score > 70 ? 'immediate_contact' : 'schedule_follow_up',
    insights: generateInsights(message, score)
  }
}

async function analyzeMessage(data: any) {
  const { message } = data
  
  const analysis = {
    intent: detectMessageIntent(message),
    sentiment: getMessageSentiment(message),
    entities: extractEntities(message),
    urgency: assessUrgency(message),
    suggested_response: generateSuggestedResponse(message)
  }
  
  return analysis
}

async function detectIntent(data: any) {
  const { message } = data
  
  const intents = {
    'insurance_quote': ['seguro', 'cotação', 'cotar', 'proposta'],
    'price_inquiry': ['preço', 'valor', 'custo', 'quanto'],
    'complaint': ['reclamação', 'problema', 'erro', 'insatisfeito'],
    'cancellation': ['cancelar', 'desistir', 'não quero'],
    'support': ['ajuda', 'dúvida', 'como', 'suporte']
  }
  
  const lowerMessage = message.toLowerCase()
  let detectedIntent = 'general'
  let confidence = 0.5
  
  for (const [intent, keywords] of Object.entries(intents)) {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword))
    if (matches.length > 0) {
      detectedIntent = intent
      confidence = Math.min(0.9, 0.6 + (matches.length * 0.1))
      break
    }
  }
  
  return {
    intent: detectedIntent,
    confidence,
    keywords_found: intents[detectedIntent] || []
  }
}

async function analyzeSentiment(data: any) {
  const { message } = data
  
  const positiveWords = ['ótimo', 'excelente', 'bom', 'gostei', 'perfeito', 'obrigado']
  const negativeWords = ['ruim', 'péssimo', 'problema', 'erro', 'insatisfeito', 'cancelar']
  
  const lowerMessage = message.toLowerCase()
  
  let positiveScore = 0
  let negativeScore = 0
  
  positiveWords.forEach(word => {
    if (lowerMessage.includes(word)) positiveScore++
  })
  
  negativeWords.forEach(word => {
    if (lowerMessage.includes(word)) negativeScore++
  })
  
  let sentiment = 'neutral'
  let confidence = 0.5
  
  if (positiveScore > negativeScore) {
    sentiment = 'positive'
    confidence = Math.min(0.9, 0.6 + (positiveScore * 0.1))
  } else if (negativeScore > positiveScore) {
    sentiment = 'negative'
    confidence = Math.min(0.9, 0.6 + (negativeScore * 0.1))
  }
  
  return {
    sentiment,
    confidence,
    positive_indicators: positiveScore,
    negative_indicators: negativeScore
  }
}

function detectMessageIntent(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('seguro') || lowerMessage.includes('cotação')) {
    return 'insurance_quote'
  } else if (lowerMessage.includes('preço') || lowerMessage.includes('valor')) {
    return 'price_inquiry'
  } else if (lowerMessage.includes('cancelar') || lowerMessage.includes('não quero')) {
    return 'cancellation'
  } else if (lowerMessage.includes('problema') || lowerMessage.includes('reclamação')) {
    return 'complaint'
  }
  
  return 'general'
}

function getMessageSentiment(message: string): 'positive' | 'negative' | 'neutral' {
  const lowerMessage = message.toLowerCase()
  
  const positiveWords = ['ótimo', 'bom', 'gostei', 'obrigado', 'perfeito']
  const negativeWords = ['ruim', 'problema', 'erro', 'insatisfeito']
  
  const hasPositive = positiveWords.some(word => lowerMessage.includes(word))
  const hasNegative = negativeWords.some(word => lowerMessage.includes(word))
  
  if (hasPositive && !hasNegative) return 'positive'
  if (hasNegative && !hasPositive) return 'negative'
  return 'neutral'
}

function extractEntities(message: string): any[] {
  const entities = []
  
  // Extract phone numbers
  const phoneRegex = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g
  const phones = message.match(phoneRegex)
  if (phones) {
    entities.push(...phones.map(phone => ({ type: 'phone', value: phone })))
  }
  
  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emails = message.match(emailRegex)
  if (emails) {
    entities.push(...emails.map(email => ({ type: 'email', value: email })))
  }
  
  // Extract CPF
  const cpfRegex = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g
  const cpfs = message.match(cpfRegex)
  if (cpfs) {
    entities.push(...cpfs.map(cpf => ({ type: 'cpf', value: cpf })))
  }
  
  return entities
}

function assessUrgency(message: string): 'low' | 'medium' | 'high' {
  const lowerMessage = message.toLowerCase()
  
  const urgentWords = ['urgente', 'rápido', 'hoje', 'agora', 'emergência']
  const hasUrgent = urgentWords.some(word => lowerMessage.includes(word))
  
  if (hasUrgent) return 'high'
  if (lowerMessage.includes('quando') || lowerMessage.includes('prazo')) return 'medium'
  return 'low'
}

function generateSuggestedResponse(message: string): string {
  const intent = detectMessageIntent(message)
  
  const responses = {
    'insurance_quote': 'Olá! Vou te ajudar com a cotação do seu seguro. Para começar, me diga qual tipo de seguro você precisa: auto, vida ou residencial?',
    'price_inquiry': 'Para te dar o melhor preço, preciso de algumas informações. Qual tipo de seguro você está procurando?',
    'cancellation': 'Entendo sua preocupação. Posso esclarecer alguma dúvida ou ajustar algo na proposta?',
    'complaint': 'Peço desculpas pelo inconveniente. Vou verificar a situação e resolver o mais rápido possível.',
    'general': 'Olá! Como posso te ajudar hoje? Posso fazer cotações de seguro auto, vida e residencial.'
  }
  
  return responses[intent] || responses['general']
}

function generateInsights(message: string, score: number): string[] {
  const insights = []
  
  if (score > 80) {
    insights.push('Lead altamente qualificado - contato imediato recomendado')
  } else if (score > 60) {
    insights.push('Lead com potencial - agendar follow-up em 24h')
  } else {
    insights.push('Lead necessita mais qualificação')
  }
  
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes('urgente')) {
    insights.push('Cliente demonstra urgência - priorizar atendimento')
  }
  
  if (lowerMessage.includes('preço') || lowerMessage.includes('valor')) {
    insights.push('Cliente sensível a preço - destacar benefícios e valor')
  }
  
  return insights
}

function summarizeInput(input: any): string {
  if (typeof input === 'string') {
    return input.length > 100 ? input.substring(0, 100) + '...' : input
  }
  return JSON.stringify(input).substring(0, 100) + '...'
}