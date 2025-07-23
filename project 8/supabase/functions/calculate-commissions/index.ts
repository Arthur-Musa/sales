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

    // Get sale details with product and seller info
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        products(*),
        seller:users!sales_seller_id_fkey(*)
      `)
      .eq('id', saleId)
      .single()

    if (saleError || !sale) {
      throw new Error('Sale not found')
    }

    // Get applicable commission rules
    const { data: rules, error: rulesError } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('product_id', sale.product_id)
      .eq('is_active', true)
      .lte('valid_from', new Date().toISOString().split('T')[0])
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`)

    if (rulesError) {
      throw new Error('Error fetching commission rules')
    }

    // Calculate commissions for each applicable rule
    const commissions = []

    for (const rule of rules || []) {
      // Check if sale value meets rule criteria
      if (rule.min_amount && sale.value < rule.min_amount) continue
      if (rule.max_amount && sale.value > rule.max_amount) continue

      // Check additional conditions
      if (rule.conditions && !evaluateConditions(rule.conditions, sale)) continue

      const commissionAmount = (sale.value * rule.percentage) / 100

      // Create commission record
      const { data: commission, error: commissionError } = await supabase
        .from('commissions')
        .insert({
          sale_id: saleId,
          user_id: sale.seller_id,
          amount: commissionAmount,
          percentage: rule.percentage,
          base_value: sale.value,
          status: 'pendente'
        })
        .select()
        .single()

      if (commissionError) {
        console.error('Error creating commission:', commissionError)
        continue
      }

      commissions.push(commission)
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'commissions_calculated',
      p_resource_type: 'commission',
      p_resource_id: saleId,
      p_new_values: { 
        total_commissions: commissions.length,
        total_amount: commissions.reduce((sum, c) => sum + c.amount, 0)
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        commissions,
        totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error calculating commissions:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function evaluateConditions(conditions: any, sale: any): boolean {
  // Evaluate additional conditions for commission rules
  try {
    if (conditions.seller_type && sale.seller_type !== conditions.seller_type) {
      return false
    }
    
    if (conditions.product_category && sale.products?.category !== conditions.product_category) {
      return false
    }
    
    if (conditions.min_conversion_time && sale.conversion_time) {
      const conversionHours = parseFloat(sale.conversion_time.replace(' hours', ''))
      if (conversionHours < conditions.min_conversion_time) return false
    }
    
    return true
  } catch (error) {
    console.error('Error evaluating conditions:', error)
    return false
  }
}