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

    const { saleId } = await req.json()

    if (!saleId) {
      throw new Error('Sale ID is required')
    }

    // Get sale details
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        clients(*),
        products(*)
      `)
      .eq('id', saleId)
      .single()

    if (saleError || !sale) {
      throw new Error('Sale not found')
    }

    // Create Stripe checkout session (simulated - in production use actual Stripe SDK)
    const checkoutSession = await createStripeCheckoutSession(sale)

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        sale_id: saleId,
        stripe_payment_intent_id: checkoutSession.payment_intent,
        stripe_checkout_session_id: checkoutSession.id,
        amount: sale.value,
        currency: 'BRL',
        status: 'pending'
      })
      .select()
      .single()

    if (paymentError) {
      throw new Error('Failed to create payment record')
    }

    // Send payment link via WhatsApp
    await sendPaymentLinkViaWhatsApp(supabase, sale.clients.phone, checkoutSession.url, sale)

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'payment_link_created',
      p_resource_type: 'payment',
      p_resource_id: payment.id,
      p_new_values: { 
        stripe_session_id: checkoutSession.id,
        amount: sale.value,
        checkout_url: checkoutSession.url
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutUrl: checkoutSession.url,
        paymentId: payment.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating Stripe checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function createStripeCheckoutSession(sale: any) {
  // Simulate Stripe checkout session creation
  // In production, use the actual Stripe SDK
  
  const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id: sessionId,
    payment_intent: paymentIntentId,
    url: `https://checkout.stripe.com/pay/${sessionId}`,
    expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }
}

async function sendPaymentLinkViaWhatsApp(supabase: any, phone: string, checkoutUrl: string, sale: any) {
  try {
    const clientName = sale.clients.full_name.split(' ')[0]
    const productName = sale.products.name
    const value = new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(sale.value)

    const message = `💳 ${clientName}, sua proposta está pronta!\n\n📋 ${productName}\n💰 ${value}\n\n👇 Finalize seu pagamento aqui:\n${checkoutUrl}\n\n✅ PIX (instantâneo)\n💳 Cartão (parcelado)\n\nApós o pagamento, sua apólice é emitida automaticamente! 🚀`

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
      throw new Error(`WhatsApp API error: ${response.statusText}`)
    }

    // Log message
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
    console.error('Error sending payment link via WhatsApp:', error)
    throw error
  }
}