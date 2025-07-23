import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface MessageRequest {
  phone: string
  message?: string
  templateName?: string
  templateParams?: any
  mediaUrl?: string
  type?: 'text' | 'image' | 'document' | 'template'
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

    const messageRequest: MessageRequest = await req.json()

    if (!messageRequest.phone) {
      throw new Error('Phone number is required')
    }

    // Get WhatsApp API configuration
    const { data: config, error: configError } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'whatsapp_api_config')
      .single()

    if (configError || !config?.value) {
      throw new Error('WhatsApp API not configured')
    }

    const whatsappConfig = config.value

    let messageContent = messageRequest.message
    let messageType = messageRequest.type || 'text'

    // If template is specified, get template content
    if (messageRequest.templateName) {
      const { data: template, error: templateError } = await supabase
        .from('whatsapp_templates')
        .select('content, variables')
        .eq('name', messageRequest.templateName)
        .eq('is_active', true)
        .single()

      if (templateError || !template) {
        throw new Error('Template not found or inactive')
      }

      messageContent = template.content
      messageType = 'template'

      // Replace template variables
      if (messageRequest.templateParams) {
        for (const [key, value] of Object.entries(messageRequest.templateParams)) {
          messageContent = messageContent.replace(
            new RegExp(`{{${key}}}`, 'g'), 
            value as string
          )
        }
      }

      // Update template usage
      await supabase
        .from('whatsapp_templates')
        .update({ usage_count: supabase.sql`usage_count + 1` })
        .eq('name', messageRequest.templateName)
    }

    // Prepare API request based on message type
    let apiEndpoint = ''
    let apiPayload: any = {}

    switch (messageType) {
      case 'text':
      case 'template':
        apiEndpoint = '/v1/messages/send-text'
        apiPayload = {
          phone: messageRequest.phone.replace(/\D/g, ''),
          message: messageContent
        }
        break
      
      case 'image':
        apiEndpoint = '/v1/messages/send-image'
        apiPayload = {
          phone: messageRequest.phone.replace(/\D/g, ''),
          image: messageRequest.mediaUrl,
          caption: messageContent
        }
        break
      
      case 'document':
        apiEndpoint = '/v1/messages/send-document'
        apiPayload = {
          phone: messageRequest.phone.replace(/\D/g, ''),
          document: messageRequest.mediaUrl,
          filename: messageContent || 'documento.pdf'
        }
        break
      
      default:
        throw new Error('Unsupported message type')
    }

    // Send message via WhatsApp API
    const response = await fetch(`${whatsappConfig.base_url}${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${whatsappConfig.token}`
      },
      body: JSON.stringify(apiPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WhatsApp API error: ${response.status} - ${errorText}`)
    }

    const responseData = await response.json()

    // Find or create conversation
    let { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone', messageRequest.phone)
      .single()

    if (convError || !conversation) {
      const { data: newConv, error: newConvError } = await supabase
        .from('whatsapp_conversations')
        .insert({
          phone: messageRequest.phone,
          status: 'active',
          ai_active: false // Manual message, disable AI temporarily
        })
        .select('id')
        .single()

      if (newConvError) {
        console.error('Error creating conversation:', newConvError)
      } else {
        conversation = newConv
      }
    }

    // Log message in database
    if (conversation) {
      await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          message_id: responseData.messageId || `manual_${Date.now()}`,
          direction: 'outbound',
          type: messageType,
          content: messageContent,
          template_name: messageRequest.templateName,
          template_params: messageRequest.templateParams,
          media_url: messageRequest.mediaUrl,
          delivered: true
        })

      // Update conversation last message time
      await supabase
        .from('whatsapp_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id)
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'whatsapp_message_sent',
      p_resource_type: 'whatsapp_message',
      p_resource_id: responseData.messageId,
      p_new_values: { 
        phone: messageRequest.phone,
        type: messageType,
        template: messageRequest.templateName,
        success: true
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.messageId,
        conversationId: conversation?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    
    // Log error in audit
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'whatsapp_message_failed',
      p_resource_type: 'whatsapp_message',
      p_resource_id: null,
      p_new_values: { 
        phone: (await req.json()).phone,
        error: error.message
      }
    })

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})