import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
    const action = url.pathname.split('/').pop()

    // Get current user's tenant
    const authHeader = req.headers.get('authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Invalid token')

    const { data: userProfile } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!userProfile?.tenant_id) throw new Error('User not associated with tenant')

    if (req.method === 'GET') {
      if (action === 'status') {
        // Get billing status
        const { data: subscription, error } = await supabase
          .from('tenant_subscriptions')
          .select('*')
          .eq('tenant_id', userProfile.tenant_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        return new Response(
          JSON.stringify(subscription || { status: 'no_subscription' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      if (action === 'history') {
        // Get billing history
        const { data: history, error } = await supabase
          .from('tenant_subscriptions')
          .select('*')
          .eq('tenant_id', userProfile.tenant_id)
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(
          JSON.stringify(history),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    if (req.method === 'POST') {
      if (action === 'checkout') {
        // Create Stripe checkout for subscription
        const { plan } = await req.json()

        const { data: tenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userProfile.tenant_id)
          .single()

        if (!tenant) throw new Error('Tenant not found')

        // Create Stripe customer if doesn't exist
        let stripeCustomerId = null
        const { data: existingSubscription } = await supabase
          .from('tenant_subscriptions')
          .select('stripe_customer_id')
          .eq('tenant_id', userProfile.tenant_id)
          .single()

        if (existingSubscription?.stripe_customer_id) {
          stripeCustomerId = existingSubscription.stripe_customer_id
        } else {
          // Create new Stripe customer
          stripeCustomerId = await createStripeCustomer(tenant)
        }

        // Create checkout session
        const checkoutSession = await createStripeCheckoutSession(
          stripeCustomerId,
          plan,
          userProfile.tenant_id
        )

        return new Response(
          JSON.stringify({ 
            checkout_url: checkoutSession.url,
            session_id: checkoutSession.id
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      if (action === 'portal') {
        // Create Stripe billing portal session
        const { data: subscription } = await supabase
          .from('tenant_subscriptions')
          .select('stripe_customer_id')
          .eq('tenant_id', userProfile.tenant_id)
          .single()

        if (!subscription?.stripe_customer_id) {
          throw new Error('No subscription found')
        }

        const portalSession = await createStripeBillingPortal(subscription.stripe_customer_id)

        return new Response(
          JSON.stringify({ portal_url: portalSession.url }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      if (action === 'webhook') {
        // Handle Stripe webhooks
        const signature = req.headers.get('stripe-signature')
        if (!signature) throw new Error('Missing stripe signature')

        const body = await req.text()
        const event = JSON.parse(body) // In production, verify webhook signature

        await handleStripeWebhook(supabase, event)

        return new Response(
          JSON.stringify({ received: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )

  } catch (error) {
    console.error('Error in billing management:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function createStripeCustomer(tenant: any) {
  // In production, use actual Stripe SDK
  const customerId = `cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`Creating Stripe customer for tenant: ${tenant.name}`)
  
  return customerId
}

async function createStripeCheckoutSession(customerId: string, plan: string, tenantId: string) {
  // In production, use actual Stripe SDK
  const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const planPrices = {
    'starter': 9900, // R$ 99.00
    'professional': 19900, // R$ 199.00
    'enterprise': 39900 // R$ 399.00
  }

  return {
    id: sessionId,
    url: `https://checkout.stripe.com/pay/${sessionId}`,
    customer: customerId,
    amount: planPrices[plan] || planPrices['starter'],
    metadata: { tenant_id: tenantId, plan }
  }
}

async function createStripeBillingPortal(customerId: string) {
  // In production, use actual Stripe SDK
  const sessionId = `bps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id: sessionId,
    url: `https://billing.stripe.com/p/session/${sessionId}`
  }
}

async function handleStripeWebhook(supabase: any, event: any) {
  console.log(`Processing Stripe webhook: ${event.type}`)

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(supabase, event.data.object)
      break
    
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(supabase, event.data.object)
      break
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(supabase, event.data.object)
      break
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(supabase, event.data.object)
      break
  }
}

async function handleSubscriptionUpdate(supabase: any, subscription: any) {
  const tenantId = subscription.metadata?.tenant_id
  if (!tenantId) return

  await supabase
    .from('tenant_subscriptions')
    .upsert({
      tenant_id: tenantId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      amount_monthly: subscription.items.data[0]?.price?.unit_amount / 100
    })

  // Update tenant status based on subscription
  const tenantStatus = subscription.status === 'active' ? 'active' : 
                     subscription.status === 'past_due' ? 'suspended' : 'canceled'

  await supabase
    .from('tenants')
    .update({ status: tenantStatus })
    .eq('id', tenantId)
}

async function handleSubscriptionCanceled(supabase: any, subscription: any) {
  const tenantId = subscription.metadata?.tenant_id
  if (!tenantId) return

  await supabase
    .from('tenant_subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id)

  await supabase
    .from('tenants')
    .update({ status: 'canceled' })
    .eq('id', tenantId)
}

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  console.log(`Payment succeeded for customer: ${invoice.customer}`)
  
  // Log successful payment
  await supabase
    .from('audit_trail')
    .insert({
      action: 'payment_succeeded',
      resource_type: 'subscription',
      new_values: {
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        invoice_id: invoice.id
      }
    })
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  console.log(`Payment failed for customer: ${invoice.customer}`)
  
  // Find tenant by customer ID
  const { data: subscription } = await supabase
    .from('tenant_subscriptions')
    .select('tenant_id')
    .eq('stripe_customer_id', invoice.customer)
    .single()

  if (subscription) {
    // Update tenant status to past_due
    await supabase
      .from('tenants')
      .update({ status: 'suspended' })
      .eq('id', subscription.tenant_id)

    // Log failed payment
    await supabase
      .from('audit_trail')
      .insert({
        tenant_id: subscription.tenant_id,
        action: 'payment_failed',
        resource_type: 'subscription',
        new_values: {
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          invoice_id: invoice.id
        }
      })
  }
}