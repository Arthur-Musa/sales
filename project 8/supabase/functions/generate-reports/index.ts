import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReportRequest {
  type: 'sales' | 'commissions' | 'policies' | 'recovery' | 'compliance'
  format: 'csv' | 'pdf' | 'json'
  filters: {
    dateFrom?: string
    dateTo?: string
    status?: string
    userId?: string
    productCategory?: string
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

    const reportRequest: ReportRequest = await req.json()

    let data: any[] = []
    let filename = ''

    switch (reportRequest.type) {
      case 'sales':
        data = await generateSalesReport(supabase, reportRequest.filters)
        filename = `vendas_${new Date().toISOString().split('T')[0]}`
        break
      
      case 'commissions':
        data = await generateCommissionsReport(supabase, reportRequest.filters)
        filename = `comissoes_${new Date().toISOString().split('T')[0]}`
        break
      
      case 'policies':
        data = await generatePoliciesReport(supabase, reportRequest.filters)
        filename = `apolices_${new Date().toISOString().split('T')[0]}`
        break
      
      case 'recovery':
        data = await generateRecoveryReport(supabase, reportRequest.filters)
        filename = `recuperacao_${new Date().toISOString().split('T')[0]}`
        break
      
      case 'compliance':
        data = await generateComplianceReport(supabase, reportRequest.filters)
        filename = `compliance_${new Date().toISOString().split('T')[0]}`
        break
      
      default:
        throw new Error('Invalid report type')
    }

    let responseData: any
    let contentType = 'application/json'

    if (reportRequest.format === 'csv') {
      responseData = convertToCSV(data)
      contentType = 'text/csv'
      filename += '.csv'
    } else if (reportRequest.format === 'pdf') {
      responseData = await generatePDF(data, reportRequest.type)
      contentType = 'application/pdf'
      filename += '.pdf'
    } else {
      responseData = JSON.stringify(data, null, 2)
      filename += '.json'
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'report_generated',
      p_resource_type: 'report',
      p_resource_id: filename,
      p_new_values: { 
        type: reportRequest.type,
        format: reportRequest.format,
        records_count: data.length,
        filters: reportRequest.filters
      }
    })

    return new Response(responseData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      status: 200,
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function generateSalesReport(supabase: any, filters: any) {
  let query = supabase
    .from('sales')
    .select(`
      id,
      status,
      value,
      installments,
      seller_type,
      conversion_time,
      created_at,
      closed_at,
      clients(full_name, email, phone, cpf_cnpj),
      products(name, category),
      payments(status, payment_method, paid_at)
    `)

  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.userId) query = query.eq('seller_id', filters.userId)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  return data.map(sale => ({
    'ID Venda': sale.id,
    'Cliente': sale.clients?.full_name,
    'Email': sale.clients?.email,
    'Telefone': sale.clients?.phone,
    'CPF/CNPJ': sale.clients?.cpf_cnpj,
    'Produto': sale.products?.name,
    'Categoria': sale.products?.category,
    'Valor': sale.value,
    'Parcelas': sale.installments,
    'Status': sale.status,
    'Vendedor': sale.seller_type,
    'Tempo Conversão': sale.conversion_time,
    'Data Criação': sale.created_at,
    'Data Fechamento': sale.closed_at,
    'Status Pagamento': sale.payments?.[0]?.status,
    'Método Pagamento': sale.payments?.[0]?.payment_method,
    'Data Pagamento': sale.payments?.[0]?.paid_at
  }))
}

async function generateCommissionsReport(supabase: any, filters: any) {
  let query = supabase
    .from('commissions')
    .select(`
      *,
      sales(value, created_at, products(name, category)),
      users(full_name, email, role)
    `)

  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.userId) query = query.eq('user_id', filters.userId)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  return data.map(commission => ({
    'ID Comissão': commission.id,
    'Vendedor': commission.users?.full_name,
    'Email Vendedor': commission.users?.email,
    'Perfil': commission.users?.role,
    'Produto': commission.sales?.products?.name,
    'Categoria': commission.sales?.products?.category,
    'Valor Venda': commission.sales?.value,
    'Percentual': commission.percentage,
    'Valor Comissão': commission.amount,
    'Status': commission.status,
    'Data Venda': commission.sales?.created_at,
    'Data Aprovação': commission.approved_at,
    'Data Pagamento': commission.paid_at
  }))
}

async function generatePoliciesReport(supabase: any, filters: any) {
  let query = supabase
    .from('policies')
    .select(`
      *,
      clients(full_name, email, phone, cpf_cnpj),
      products(name, category),
      sales(value, seller_type)
    `)

  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  if (filters.status) query = query.eq('status', filters.status)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  return data.map(policy => ({
    'Número Apólice': policy.policy_number,
    'Cliente': policy.clients?.full_name,
    'CPF/CNPJ': policy.clients?.cpf_cnpj,
    'Produto': policy.products?.name,
    'Categoria': policy.products?.category,
    'Seguradora': policy.insurer,
    'Valor': policy.sales?.value,
    'Status': policy.status,
    'Início Vigência': policy.coverage_start_date,
    'Fim Vigência': policy.coverage_end_date,
    'Tempo Emissão': policy.emission_time,
    'Entrega WhatsApp': policy.delivery_whatsapp ? 'Sim' : 'Não',
    'Entrega Email': policy.delivery_email ? 'Sim' : 'Não',
    'Data Emissão': policy.created_at
  }))
}

async function generateRecoveryReport(supabase: any, filters: any) {
  let query = supabase
    .from('recovery_campaigns')
    .select(`
      *,
      leads(phone, product_interest, clients(full_name)),
      sales(value, products(name))
    `)

  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  if (filters.status) query = query.eq('status', filters.status)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  return data.map(campaign => ({
    'ID Campanha': campaign.id,
    'Cliente': campaign.leads?.clients?.full_name || 'Lead não convertido',
    'Telefone': campaign.leads?.phone,
    'Produto Interesse': campaign.leads?.product_interest,
    'Motivo Trigger': campaign.trigger_reason,
    'Status': campaign.status,
    'Tentativas': campaign.attempts,
    'Máx Tentativas': campaign.max_attempts,
    'Sucesso': campaign.success ? 'Sim' : 'Não',
    'Valor Recuperado': campaign.recovery_value,
    'Data Início': campaign.created_at,
    'Data Sucesso': campaign.success_at,
    'Próxima Tentativa': campaign.next_attempt_at
  }))
}

async function generateComplianceReport(supabase: any, filters: any) {
  let query = supabase
    .from('audit_logs')
    .select('*')

  if (filters.dateFrom) query = query.gte('timestamp', filters.dateFrom)
  if (filters.dateTo) query = query.lte('timestamp', filters.dateTo)

  const { data, error } = await query.order('timestamp', { ascending: false })
  if (error) throw error

  return data.map(log => ({
    'Timestamp': log.timestamp,
    'Usuário': log.user_id || 'Sistema',
    'Ação': log.action,
    'Tipo Recurso': log.resource_type,
    'ID Recurso': log.resource_id,
    'IP': log.ip_address,
    'User Agent': log.user_agent,
    'Valores Antigos': JSON.stringify(log.old_values),
    'Valores Novos': JSON.stringify(log.new_values)
  }))
}

function convertToCSV(data: any[]): string {
  if (!data.length) return ''

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      }).join(',')
    )
  ].join('\n')

  return csvContent
}

async function generatePDF(data: any[], reportType: string): Promise<Uint8Array> {
  // In production, use a proper PDF library like jsPDF or Puppeteer
  // For now, return a simple text-based PDF placeholder
  const content = `Relatório ${reportType}\nGerado em: ${new Date().toLocaleString('pt-BR')}\n\nDados:\n${JSON.stringify(data, null, 2)}`
  return new TextEncoder().encode(content)
}