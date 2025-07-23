import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface StripeEvent {
  id: string
  type: string
  data: {
    object: any
  }
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

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing stripe-signature header')
    }

    const body = await req.text()
    const event: StripeEvent = JSON.parse(body)

    console.log(`Processing Stripe event: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(supabase, event)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase, event)
        break
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event)
        break
      
      case 'checkout.session.expired':
        await handleCheckoutExpired(supabase, event)
        break
      
      case 'invoice.payment_succeeded':
        await handleRecurringPayment(supabase, event)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function handlePaymentSuccess(supabase: any, event: StripeEvent) {
  const paymentIntent = event.data.object
  
  // Find and update payment status
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      paid_at: new Date().toISOString(),
      net_amount: (paymentIntent.amount - (paymentIntent.application_fee_amount || 0)) / 100,
      stripe_fee: (paymentIntent.application_fee_amount || 0) / 100,
      metadata: paymentIntent
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .select('*, sales(*)')
    .single()

  if (paymentError) {
    console.error('Error updating payment:', paymentError)
    return
  }

  // Update sale status
  await supabase
    .from('sales')
    .update({ 
      status: 'pago',
      closed_at: new Date().toISOString()
    })
    .eq('id', payment.sale_id)

  // Trigger policy emission
  await triggerPolicyEmission(supabase, payment.sale_id)

  // Trigger automatic welcome kit generation after policy emission
  setTimeout(async () => {
    try {
      await supabase.functions.invoke('generate-welcome-kit', {
        body: { 
          saleId: payment.sale_id,
          autoSend: true,
          trigger: 'payment_success'
        }
      })
    } catch (error) {
      console.error('Error generating welcome kit:', error)
    }
  }, 5000) // Wait 5 seconds for policy emission to complete
  // Create notification for team
  await supabase.rpc('create_notification', {
    p_user_id: null, // Will notify all gestores
    p_type: 'success',
    p_title: 'Nova Venda Confirmada',
    p_message: `Pagamento de R$ ${(paymentIntent.amount / 100).toFixed(2)} confirmado via Stripe`
  })
  // Log audit event
  await supabase.rpc('log_audit_event', {
    p_user_id: null,
    p_action: 'payment_succeeded',
    p_resource_type: 'payment',
    p_resource_id: payment.id,
    p_new_values: { 
      stripe_payment_intent_id: paymentIntent.id, 
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    }
  })
}

async function handlePaymentFailed(supabase: any, event: StripeEvent) {
  const paymentIntent = event.data.object
  
  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      metadata: paymentIntent
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  // Trigger recovery campaign
  const { data: payment } = await supabase
    .from('payments')
    .select('sale_id, sales(lead_id)')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single()

  if (payment?.sales?.lead_id) {
    await triggerRecoveryCampaign(supabase, payment.sales.lead_id, 'pagamento_falhou')
  }
}

async function handleCheckoutCompleted(supabase: any, event: StripeEvent) {
  const session = event.data.object
  
  // Update payment with checkout session info
  await supabase
    .from('payments')
    .update({
      stripe_checkout_session_id: session.id,
      payment_method: session.payment_method_types?.[0] || 'unknown'
    })
    .eq('stripe_payment_intent_id', session.payment_intent)
}

async function handleCheckoutExpired(supabase: any, event: StripeEvent) {
  const session = event.data.object
  
  // Update payment status
  await supabase
    .from('payments')
    .update({ status: 'canceled' })
    .eq('stripe_checkout_session_id', session.id)

  // Trigger recovery campaign
  const { data: payment } = await supabase
    .from('payments')
    .select('sale_id, sales(lead_id)')
    .eq('stripe_checkout_session_id', session.id)
    .single()

  if (payment?.sales?.lead_id) {
    await triggerRecoveryCampaign(supabase, payment.sales.lead_id, 'checkout_expirado')
  }
}

async function triggerPolicyEmission(supabase: any, saleId: string) {
  try {
    // Call policy emission edge function
    const { data, error } = await supabase.functions.invoke('emit-policy', {
      body: { saleId }
    })

    if (error) {
      console.error('Error triggering policy emission:', error)
      
      // Create error notification
      await supabase.rpc('create_notification', {
        p_user_id: null,
        p_type: 'error',
        p_title: 'Erro na Emissão de Apólice',
        p_message: `Falha ao emitir apólice para venda ${saleId}: ${error.message}`
      })
    }
  } catch (error) {
    console.error('Error calling emit-policy function:', error)
  }
}

async function triggerRecoveryCampaign(supabase: any, leadId: string, reason: string) {
  // Create or update recovery campaign
  await supabase
    .from('recovery_campaigns')
    .upsert({
      lead_id: leadId,
      trigger_reason: reason,
      status: 'ativo',
      attempts: 0,
      max_attempts: 3,
      next_attempt_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
    })

  // Call recovery edge function
  const { error } = await supabase.functions.invoke('send-recovery-message', {
    body: { leadId, reason }
  })

  if (error) {
    console.error('Error triggering recovery campaign:', error)
  }
}

async function handleRecurringPayment(supabase: any, event: StripeEvent) {
  const invoice = event.data.object
  
  // Handle recurring payments for subscription-based products
  console.log('Recurring payment received:', invoice.id)
  
  // Log for audit
  await supabase.rpc('log_audit_event', {
    p_user_id: null,
    p_action: 'recurring_payment_received',
    p_resource_type: 'payment',
    p_resource_id: invoice.id,
    p_new_values: { 
      invoice_id: invoice.id,
      amount: invoice.amount_paid / 100,
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString()
    }
  })
}