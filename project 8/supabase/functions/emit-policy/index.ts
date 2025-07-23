import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

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
        products(*),
        payments(*)
      `)
      .eq('id', saleId)
      .single()

    if (saleError || !sale) {
      throw new Error('Sale not found')
    }

    // Generate policy number
    const policyNumber = generatePolicyNumber()

    // Determine insurer based on product and business rules
    const insurer = await selectOptimalInsurer(supabase, sale.products.category, sale.value)

    // Create policy record
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .insert({
        policy_number: policyNumber,
        sale_id: saleId,
        client_id: sale.client_id,
        product_id: sale.product_id,
        status: 'processando',
        insurer: insurer,
        coverage_start_date: new Date().toISOString().split('T')[0],
        coverage_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        metadata: {
          sale_value: sale.value,
          payment_method: sale.payments?.[0]?.payment_method || 'unknown'
        }
      })
      .select()
      .single()

    if (policyError) {
      throw new Error('Failed to create policy record')
    }

    // Generate PDF
    const startTime = Date.now()
    const pdfUrl = await generatePolicyPDF(supabase, sale, policy)
    const emissionTime = Date.now() - startTime

    // Update policy with PDF URL and emission time
    await supabase
      .from('policies')
      .update({
        status: 'emitida',
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString(),
        emission_time: `${Math.floor(emissionTime / 1000)}s`
      })
      .eq('id', policy.id)

    // Send policy via WhatsApp using template
    await sendPolicyViaWhatsApp(supabase, sale, policy, pdfUrl)

    // Update delivery status
    await supabase
      .from('policies')
      .update({
        delivery_whatsapp: true,
        delivery_attempts: 1,
        last_delivery_attempt: new Date().toISOString()
      })
      .eq('id', policy.id)

    // Create policy document record
    await supabase
      .from('policy_documents')
      .insert({
        policy_id: policy.id,
        document_type: 'policy',
        file_name: `apolice_${policyNumber}.pdf`,
        file_url: pdfUrl,
        mime_type: 'application/pdf'
      })

    // Create success notification
    await supabase.rpc('create_notification', {
      p_user_id: null,
      p_type: 'success',
      p_title: 'Apólice Emitida com Sucesso',
      p_message: `Apólice ${policyNumber} emitida em ${Math.floor(emissionTime / 1000)}s`
    })

    // Trigger Welcome Kit generation after policy emission
    setTimeout(async () => {
      try {
        await supabase.functions.invoke('generate-welcome-kit', {
          body: {
            saleId,
            autoSend: true,
            trigger: 'policy_emission',
            customMessage: 'Sua apólice foi emitida com sucesso! Este kit contém todas as informações importantes sobre sua proteção.'
          }
        })
        console.log(`Welcome kit auto-generated for sale: ${saleId}`)
      } catch (kitError) {
        console.error('Error auto-generating welcome kit:', kitError)
      }
    }, 3000) // 3 segundos após emissão

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'policy_emitted',
      p_resource_type: 'policy',
      p_resource_id: policy.id,
      p_new_values: { 
        policy_number: policyNumber, 
        emission_time: `${Math.floor(emissionTime / 1000)}s`,
        pdf_url: pdfUrl,
        insurer: insurer
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        policyNumber,
        emissionTime: `${Math.floor(emissionTime / 1000)}s`,
        pdfUrl 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error emitting policy:', error)
    
    // Log error in audit
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'policy_emission_failed',
      p_resource_type: 'policy',
      p_resource_id: null,
      p_new_values: { error: error.message }
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

function generatePolicyNumber(): string {
  const year = new Date().getFullYear().toString()
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${year}${timestamp}${random}`
}

async function selectOptimalInsurer(supabase: any, category: string, value: number): Promise<string> {
  // Business logic to select best insurer based on product category and value
  const insurers = {
    'auto': value > 2000 ? 'Porto Seguro' : 'SulAmérica',
    'vida': value > 1000 ? 'Bradesco Seguros' : 'MetLife',
    'residencial': value > 1500 ? 'Porto Seguro' : 'Tokio Marine',
    'empresarial': 'Zurich Seguros',
    'viagem': 'Assist Card'
  }
  
  return insurers[category] || 'Porto Seguro'
}

async function generatePolicyPDF(supabase: any, sale: any, policy: any): Promise<string> {
  // In production, this would generate actual PDF using a library like jsPDF or Puppeteer
  const fileName = `policy_${policy.policy_number}.pdf`
  
  try {
    // Simulate PDF generation with policy data
    const policyData = {
      policyNumber: policy.policy_number,
      clientName: sale.clients.full_name,
      productName: sale.products.name,
      insurer: policy.insurer,
      value: sale.value,
      startDate: policy.coverage_start_date,
      endDate: policy.coverage_end_date,
      generatedAt: new Date().toISOString()
    }
    
    // In production: Generate actual PDF and upload to Supabase Storage
    // const pdfBuffer = await generatePDFBuffer(policyData)
    // const { data, error } = await supabase.storage
    //   .from('policies')
    //   .upload(fileName, pdfBuffer, { contentType: 'application/pdf' })
    
    // For now, return a placeholder URL
    const { data } = await supabase.storage
      .from('policies')
      .getPublicUrl(fileName)
    
    return data.publicUrl
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate policy PDF')
  }
}

async function sendPolicyViaWhatsApp(supabase: any, sale: any, policy: any, pdfUrl: string) {
  try {
    const clientName = sale.clients.full_name.split(' ')[0]
    
    // Get template and replace variables
    const { data: template } = await supabase
      .from('whatsapp_templates')
      .select('content')
      .eq('name', 'apolice_emitida')
      .eq('is_active', true)
      .single()
    
    let message = template?.content || `🎉 Parabéns ${clientName}! Seu seguro foi aprovado!\n\n📄 Apólice: ${policy.policy_number}\n\n📎 ${pdfUrl}`
    
    // Replace template variables
    message = message
      .replace(/{{client_name}}/g, clientName)
      .replace(/{{policy_number}}/g, policy.policy_number)
      .replace(/{{insurer}}/g, policy.insurer)
      .replace(/{{start_date}}/g, policy.coverage_start_date)
      .replace(/{{end_date}}/g, policy.coverage_end_date)
      .replace(/{{policy_url}}/g, pdfUrl)

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

    // Send message via WhatsApp API
    const response = await fetch(`${whatsappConfig.base_url}/v1/messages/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${whatsappConfig.token}`
      },
      body: JSON.stringify({
        phone: sale.clients.phone.replace(/\D/g, ''),
        message: message
      })
    })

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`)
    }

    // Log message in database
    const { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone', sale.clients.phone)
      .single()

    if (conversation) {
      await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          direction: 'outbound',
          type: 'text',
          content: message,
          template_name: 'apolice_emitida',
          delivered: true
        })
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}