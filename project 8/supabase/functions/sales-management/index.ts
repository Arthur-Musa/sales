import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateRequest, requireRole, ROLES } from '../_shared/auth-middleware/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    // Authenticate user
    const user = await authenticateRequest(req)
    
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const saleId = pathSegments[pathSegments.length - 1]

    if (req.method === 'GET') {
      // List sales or get specific sale
      if (saleId && saleId !== 'sales-management') {
        // Get specific sale
        const { data, error } = await supabase
          .from('sales')
          .select(`
            *,
            clients(*),
            products(*),
            payments(*),
            policies(*),
            leads(*),
            seller:users!sales_seller_id_fkey(*)
          `)
          .eq('id', saleId)
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify(data),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      } else {
        // List sales with filters
        const status = url.searchParams.get('status')
        const productCategory = url.searchParams.get('product_category')
        const sellerType = url.searchParams.get('seller_type')
        const dateFrom = url.searchParams.get('date_from')
        const dateTo = url.searchParams.get('date_to')
        const sellerId = url.searchParams.get('seller_id')

        let query = supabase
          .from('sales')
          .select(`
            *,
            clients(*),
            products(*),
            payments(*),
            policies(*),
            leads(*),
            seller:users!sales_seller_id_fkey(*)
          `)
          .order('created_at', { ascending: false })

        // Apply role-based filtering
        if (user.role === ROLES.VENDAS) {
          query = query.eq('seller_id', user.id)
        }

        if (status) query = query.eq('status', status)
        if (sellerType) query = query.eq('seller_type', sellerType)
        if (dateFrom) query = query.gte('created_at', dateFrom)
        if (dateTo) query = query.lte('created_at', dateTo)
        if (sellerId) query = query.eq('seller_id', sellerId)

        // Filter by product category (requires join)
        if (productCategory) {
          query = query.eq('products.category', productCategory)
        }

        const { data, error } = await query

        if (error) throw error

        return new Response(
          JSON.stringify(data),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    if (req.method === 'POST') {
      // Create new sale
      requireRole([ROLES.ADMIN, ROLES.GESTOR, ROLES.OPERADOR, ROLES.VENDAS])(user)

      const saleData = await req.json()

      const { data, error } = await supabase
        .from('sales')
        .insert({
          ...saleData,
          seller_id: saleData.seller_id || user.id,
          seller_type: saleData.seller_type || 'manual'
        })
        .select(`
          *,
          clients(*),
          products(*),
          leads(*)
        `)
        .single()

      if (error) throw error

      // Create notification
      await supabase.functions.invoke('notifications-realtime', {
        body: {
          type: 'info',
          priority: 'medium',
          title: 'Nova Venda Criada',
          message: `Venda criada para ${data.clients?.full_name} - ${data.products?.name}`
        }
      })

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        },
      )
    }

    if (req.method === 'PUT') {
      // Update sale
      requireRole([ROLES.ADMIN, ROLES.GESTOR, ROLES.OPERADOR, ROLES.VENDAS])(user)

      const saleData = await req.json()

      // Check if user can update this sale
      if (user.role === ROLES.VENDAS) {
        const { data: existingSale } = await supabase
          .from('sales')
          .select('seller_id')
          .eq('id', saleId)
          .single()

        if (existingSale?.seller_id !== user.id) {
          throw new Error('Access denied: You can only update your own sales')
        }
      }

      const { data, error } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', saleId)
        .select(`
          *,
          clients(*),
          products(*),
          payments(*),
          policies(*)
        `)
        .single()

      if (error) throw error

      // Trigger additional actions based on status change
      if (saleData.status === 'pago') {
        // Trigger policy emission
        await supabase.functions.invoke('emit-policy', {
          body: { saleId }
        })

        // Calculate commissions
        await supabase.functions.invoke('calculate-commissions', {
          body: { saleId }
        })
      }

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (req.method === 'DELETE') {
      // Delete sale (soft delete)
      requireRole([ROLES.ADMIN, ROLES.GESTOR])(user)

      const { data, error } = await supabase
        .from('sales')
        .update({ 
          status: 'cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      },
    )

  } catch (error) {
    console.error('Error in sales management:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})