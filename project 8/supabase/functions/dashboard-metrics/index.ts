import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const period = url.searchParams.get('period') || 'today'

    let dateFilter = ''
    const now = new Date()

    switch (period) {
      case 'today':
        dateFilter = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = weekAgo.toISOString()
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = monthAgo.toISOString()
        break
      default:
        dateFilter = now.toISOString().split('T')[0]
    }

    // Sales metrics
    const { data: salesData } = await supabase
      .from('sales')
      .select('status, value, seller_type, conversion_time, created_at')
      .gte('created_at', dateFilter)

    // Policies metrics
    const { data: policiesData } = await supabase
      .from('policies')
      .select('status, emission_time, created_at, delivery_whatsapp, delivery_email')
      .gte('created_at', dateFilter)

    // Recovery metrics
    const { data: recoveryData } = await supabase
      .from('recovery_campaigns')
      .select('status, success, attempts, recovery_value, created_at')
      .gte('created_at', dateFilter)

    // WhatsApp metrics
    const { data: conversationsData } = await supabase
      .from('whatsapp_conversations')
      .select('status, ai_active, ai_confidence, created_at')
      .eq('status', 'active')

    // Commissions metrics
    const { data: commissionsData } = await supabase
      .from('commissions')
      .select('status, amount, created_at')
      .gte('created_at', dateFilter)

    // Calculate metrics
    const metrics = {
      sales: calculateSalesMetrics(salesData || []),
      policies: calculatePoliciesMetrics(policiesData || []),
      recovery: calculateRecoveryMetrics(recoveryData || []),
      whatsapp: calculateWhatsAppMetrics(conversationsData || []),
      commissions: calculateCommissionsMetrics(commissionsData || [])
    }

    return new Response(
      JSON.stringify(metrics),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating dashboard metrics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function calculateSalesMetrics(salesData: any[]) {
  const totalSales = salesData.length
  const paidSales = salesData.filter(s => s.status === 'pago')
  const totalRevenue = paidSales.reduce((sum, s) => sum + (s.value || 0), 0)
  const aiSales = salesData.filter(s => s.seller_type === 'ia')
  const conversionRate = totalSales > 0 ? (paidSales.length / totalSales) * 100 : 0

  // Calculate average conversion time
  const conversionTimes = paidSales
    .map(s => s.conversion_time)
    .filter(t => t)
    .map(t => parseInterval(t))
  
  const avgConversionTime = conversionTimes.length > 0
    ? conversionTimes.reduce((sum, t) => sum + t, 0) / conversionTimes.length
    : 0

  return {
    total: totalSales,
    paid: paidSales.length,
    revenue: totalRevenue,
    conversionRate: Math.round(conversionRate * 100) / 100,
    aiSalesCount: aiSales.length,
    aiConversionRate: aiSales.length > 0 ? (aiSales.filter(s => s.status === 'pago').length / aiSales.length) * 100 : 0,
    avgConversionTime: formatInterval(avgConversionTime)
  }
}

function calculatePoliciesMetrics(policiesData: any[]) {
  const totalPolicies = policiesData.length
  const emittedPolicies = policiesData.filter(p => p.status === 'emitida')
  const errorPolicies = policiesData.filter(p => p.status === 'erro')
  
  const emissionTimes = emittedPolicies
    .map(p => p.emission_time)
    .filter(t => t)
    .map(t => parseInt(t.replace('s', '')))
  
  const avgEmissionTime = emissionTimes.length > 0
    ? Math.round(emissionTimes.reduce((sum, t) => sum + t, 0) / emissionTimes.length)
    : 0

  const deliveryRate = emittedPolicies.length > 0
    ? (emittedPolicies.filter(p => p.delivery_whatsapp || p.delivery_email).length / emittedPolicies.length) * 100
    : 0

  return {
    total: totalPolicies,
    emitted: emittedPolicies.length,
    errors: errorPolicies.length,
    successRate: totalPolicies > 0 ? ((totalPolicies - errorPolicies.length) / totalPolicies) * 100 : 0,
    avgEmissionTime: `${avgEmissionTime}s`,
    deliveryRate: Math.round(deliveryRate * 100) / 100
  }
}

function calculateRecoveryMetrics(recoveryData: any[]) {
  const totalCampaigns = recoveryData.length
  const successfulRecoveries = recoveryData.filter(r => r.success)
  const activeCampaigns = recoveryData.filter(r => r.status === 'ativo')
  const totalRecoveredValue = successfulRecoveries.reduce((sum, r) => sum + (r.recovery_value || 0), 0)
  
  const recoveryRate = totalCampaigns > 0 ? (successfulRecoveries.length / totalCampaigns) * 100 : 0

  return {
    totalCampaigns,
    successful: successfulRecoveries.length,
    active: activeCampaigns.length,
    recoveryRate: Math.round(recoveryRate * 100) / 100,
    totalRecoveredValue
  }
}

function calculateWhatsAppMetrics(conversationsData: any[]) {
  const totalConversations = conversationsData.length
  const aiActiveConversations = conversationsData.filter(c => c.ai_active)
  
  const avgConfidence = conversationsData.length > 0
    ? conversationsData.reduce((sum, c) => sum + (c.ai_confidence || 0), 0) / conversationsData.length
    : 0

  return {
    totalActive: totalConversations,
    aiActive: aiActiveConversations.length,
    avgConfidence: Math.round(avgConfidence * 100)
  }
}

function calculateCommissionsMetrics(commissionsData: any[]) {
  const totalCommissions = commissionsData.length
  const approvedCommissions = commissionsData.filter(c => c.status === 'aprovada')
  const paidCommissions = commissionsData.filter(c => c.status === 'paga')
  const totalAmount = commissionsData.reduce((sum, c) => sum + (c.amount || 0), 0)
  const paidAmount = paidCommissions.reduce((sum, c) => sum + (c.amount || 0), 0)

  return {
    total: totalCommissions,
    approved: approvedCommissions.length,
    paid: paidCommissions.length,
    totalAmount,
    paidAmount,
    pendingAmount: totalAmount - paidAmount
  }
}

function parseInterval(interval: string): number {
  // Parse PostgreSQL interval to minutes
  const match = interval.match(/(\d+):(\d+):(\d+)/)
  if (match) {
    const [, hours, minutes, seconds] = match
    return parseInt(hours) * 60 + parseInt(minutes) + parseInt(seconds) / 60
  }
  return 0
}

function formatInterval(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
}