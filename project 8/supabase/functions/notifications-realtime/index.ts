import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface NotificationPayload {
  user_id?: string
  type: 'info' | 'warning' | 'error' | 'success'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  action_url?: string
  metadata?: any
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

    if (req.method === 'POST') {
      // Create new notification
      const notification: NotificationPayload = await req.json()

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          type: notification.type,
          priority: notification.priority,
          title: notification.title,
          message: notification.message,
          action_url: notification.action_url,
          metadata: notification.metadata || {}
        })
        .select()
        .single()

      if (error) throw error

      // Broadcast notification via realtime
      await supabase
        .channel('notifications')
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: data
        })

      return new Response(
        JSON.stringify({ success: true, notification: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        },
      )
    }

    if (req.method === 'GET') {
      // Get notifications for user
      const url = new URL(req.url)
      const userId = url.searchParams.get('user_id')
      const unreadOnly = url.searchParams.get('unread_only') === 'true'

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (unreadOnly) {
        query = query.eq('read', false)
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

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      },
    )

  } catch (error) {
    console.error('Error in notifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Helper function to create system notifications
export async function createSystemNotification(
  supabase: any,
  payload: NotificationPayload
) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    // Broadcast via realtime
    await supabase
      .channel('notifications')
      .send({
        type: 'broadcast',
        event: 'new_notification',
        payload: data
      })

    return data
  } catch (error) {
    console.error('Error creating system notification:', error)
    throw error
  }
}

// Predefined notification templates
export const NOTIFICATION_TEMPLATES = {
  SALE_COMPLETED: (clientName: string, value: number) => ({
    type: 'success' as const,
    priority: 'medium' as const,
    title: 'Nova Venda Concluída',
    message: `Venda para ${clientName} no valor de R$ ${value.toFixed(2)} foi concluída com sucesso.`
  }),

  PAYMENT_FAILED: (clientName: string, value: number) => ({
    type: 'error' as const,
    priority: 'high' as const,
    title: 'Falha no Pagamento',
    message: `Pagamento de ${clientName} (R$ ${value.toFixed(2)}) falhou. Verificar detalhes.`
  }),

  POLICY_EMITTED: (policyNumber: string, clientName: string) => ({
    type: 'success' as const,
    priority: 'medium' as const,
    title: 'Apólice Emitida',
    message: `Apólice ${policyNumber} para ${clientName} foi emitida com sucesso.`
  }),

  POLICY_ERROR: (clientName: string, error: string) => ({
    type: 'error' as const,
    priority: 'high' as const,
    title: 'Erro na Emissão',
    message: `Falha ao emitir apólice para ${clientName}: ${error}`
  }),

  RECOVERY_SUCCESS: (clientName: string, value: number) => ({
    type: 'success' as const,
    priority: 'medium' as const,
    title: 'Venda Recuperada',
    message: `Cliente ${clientName} retornou e concluiu compra de R$ ${value.toFixed(2)}.`
  }),

  SYSTEM_MAINTENANCE: (message: string) => ({
    type: 'warning' as const,
    priority: 'high' as const,
    title: 'Manutenção do Sistema',
    message
  })
}