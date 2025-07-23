import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WelcomeKitRequest {
  saleId?: string
  clientId?: string
  policyIds?: string[]
  searchTerm?: string
  customMessage?: string
  consultantName?: string
  autoSend?: boolean
  trigger?: 'manual' | 'payment_success' | 'policy_emission'
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

    const { 
      saleId, 
      clientId, 
      policyIds, 
      searchTerm,
      customMessage, 
      consultantName,
      autoSend = false,
      trigger = 'manual'
    }: WelcomeKitRequest = await req.json()

    let targetClientId = clientId
    let policies: any[] = []

    // Handle search-based kit generation
    if (searchTerm && !saleId && !clientId && !policyIds) {
      const searchResult = await searchClientData(supabase, searchTerm)
      if (searchResult) {
        targetClientId = searchResult.clientId
        policies = searchResult.policies
      }
    }

    // Get data based on saleId or clientId
    else if (saleId) {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          clients(*),
          policies(*, products(*))
        `)
        .eq('id', saleId)
        .single()

      if (saleError || !sale) {
        throw new Error('Sale not found')
      }

      targetClientId = sale.client_id
      policies = sale.policies || []
    } else if (clientId) {
      targetClientId = clientId
      
      // Get all policies for client
      const { data: clientPolicies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          *,
          products(*),
          sales(*)
        `)
        .eq('client_id', clientId)
        .eq('status', 'emitida')
        .order('created_at', { ascending: false })

      if (policiesError) {
        throw new Error('Error fetching client policies')
      }

      policies = clientPolicies || []
    } else if (policyIds && policyIds.length > 0) {
      // Get specific policies
      const { data: specificPolicies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          *,
          products(*),
          clients(*),
          sales(*)
        `)
        .in('id', policyIds)
        .eq('status', 'emitida')

      if (policiesError) {
        throw new Error('Error fetching policies')
      }

      policies = specificPolicies || []
      if (policies.length > 0) {
        targetClientId = policies[0].client_id
      }
    }

    if (!targetClientId || policies.length === 0) {
      throw new Error('No valid client or policies found')
    }

    // Get client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', targetClientId)
      .single()

    if (clientError || !client) {
      throw new Error('Client not found')
    }

    // Get consultant data (from sale or default)
    let consultant = consultantName || 'Olga - Assistente Digital'
    if (saleId) {
      const { data: sale } = await supabase
        .from('sales')
        .select('seller:users!sales_seller_id_fkey(full_name)')
        .eq('id', saleId)
        .single()
      
      if (sale?.seller?.full_name) {
        consultant = sale.seller.full_name
      }
    }

    // Generate PDF content
    const pdfContent = generateWelcomeKitHTML(client, policies, {
      customMessage: customMessage || 'Parabéns por escolher a Olga para sua proteção! Este kit contém todas as informações importantes sobre seus seguros.',
      consultant,
      emissionDate: new Date().toISOString().split('T')[0]
    })

    // Generate PDF filename
    const fileName = `kit_boas_vindas_${client.full_name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`

    // In production, generate actual PDF using Puppeteer or similar
    // For now, return the HTML content
    const pdfUrl = await generatePDFFromHTML(supabase, pdfContent, fileName)

    // Send via WhatsApp if autoSend is true
    if (autoSend) {
      await sendWelcomeKitViaWhatsApp(supabase, client, pdfUrl, policies.length)
    }

    // Log the generation
    await supabase
      .from('audit_logs')
      .insert({
        action: 'welcome_kit_generated',
        resource_type: 'welcome_kit',
        resource_id: targetClientId,
        new_values: {
          client_name: client.full_name,
          policies_count: policies.length,
          trigger,
          auto_sent: autoSend,
          pdf_url: pdfUrl
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        pdf_url: pdfUrl,
        client_name: client.full_name,
        policies_count: policies.length,
        auto_sent: autoSend
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating welcome kit:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function searchClientData(supabase: any, searchTerm: string) {
  try {
    // Search for clients by name, phone, email, or CPF
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cpf_cnpj.ilike.%${searchTerm}%`)
      .limit(1)

    if (clientError || !clients || clients.length === 0) {
      // Try searching by policy number
      const { data: policies, error: policyError } = await supabase
        .from('policies')
        .select(`
          *,
          clients(*),
          products(*),
          sales(*)
        `)
        .ilike('policy_number', `%${searchTerm}%`)
        .eq('status', 'emitida')
        .limit(1)

      if (policyError || !policies || policies.length === 0) {
        return null
      }

      return {
        clientId: policies[0].client_id,
        policies: policies
      }
    }

    const client = clients[0]

    // Get all policies for this client
    const { data: clientPolicies, error: policiesError } = await supabase
      .from('policies')
      .select(`
        *,
        products(*),
        sales(*)
      `)
      .eq('client_id', client.id)
      .eq('status', 'emitida')
      .order('created_at', { ascending: false })

    if (policiesError) {
      throw new Error('Error fetching client policies')
    }

    return {
      clientId: client.id,
      policies: clientPolicies || []
    }
  } catch (error) {
    console.error('Error in searchClientData:', error)
    return null
  }
}

function generateWelcomeKitHTML(client: any, policies: any[], options: any) {
  const totalValue = policies.reduce((sum, p) => sum + (p.sales?.value || 0), 0)
  
  // Map policies to display format
  const policyCards = policies.map(policy => {
    const insurer = getInsurerData(policy.products?.category, policy.insurer)
    const productInfo = getProductDisplayInfo(policy.products)
    
    return {
      type: productInfo.name,
      insurer: policy.insurer,
      insurerCode: insurer.code,
      details: productInfo.details,
      policyNumber: policy.policy_number,
      validity: `${policy.coverage_start_date} - ${policy.coverage_end_date}`,
      value: `R$ ${(policy.sales?.value || 0).toFixed(2).replace('.', ',')}`,
      color: insurer.color,
      bgColor: insurer.bgColor,
      coverages: productInfo.coverages
    }
  })

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kit Boas Vindas - ${client.full_name} - Olga</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Inter', sans-serif; 
            background: white;
            color: #111827;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            font-weight: 300;
        }
        
        @media print {
            body { 
                margin: 0; 
                padding: 0;
                font-size: 10.5pt;
                line-height: 1.4;
            }
            .page { 
                margin: 1.2cm 1.5cm;
                padding: 0;
                page-break-after: always;
                min-height: calc(297mm - 2.4cm);
                max-width: calc(210mm - 3cm);
                box-sizing: border-box;
            }
            .page:last-child { page-break-after: avoid; }
            .no-print { display: none !important; }
            .shadow { box-shadow: none; }
        }
        
        @media screen {
            .page {
                max-width: 19cm;
                min-height: 27cm;
                margin: 1.5rem auto;
                padding: 1.5cm;
                background: white;
                box-shadow: 0 2px 15px rgba(0,0,0,0.08);
                border-radius: 3px;
            }
        }
        
        .page-break { page-break-before: always; }
        
        h1 { font-size: 2rem; font-weight: 300; margin: 0 0 0.75rem 0; color: #111827; }
        h2 { font-size: 1.25rem; font-weight: 500; margin: 0 0 1rem 0; color: #111827; }
        h3 { font-size: 1rem; font-weight: 500; margin: 0 0 0.5rem 0; color: #374151; }
        h4 { font-size: 0.9rem; font-weight: 500; margin: 0 0 0.25rem 0; color: #6b7280; }
        
        p { margin: 0 0 0.5rem 0; font-size: 0.9rem; }
        
        .card {
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 1rem;
            margin-bottom: 1rem;
            background: #fafbfc;
        }
        
        .compact-card {
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            background: white;
        }
        
        .logo {
            width: 1.5rem;
            height: 1.5rem;
            background: #111827;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo-dot {
            width: 0.375rem;
            height: 0.375rem;
            background: white;
            border-radius: 50%;
        }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-sm { font-size: 0.8rem; }
        .text-xs { font-size: 0.7rem; }
        
        .text-gray-500 { color: #6b7280; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        
        .bg-blue { background-color: #eff6ff; border-color: #bfdbfe; }
        .bg-green { background-color: #f0fdf4; border-color: #bbf7d0; }
        .bg-purple { background-color: #faf5ff; border-color: #e9d5ff; }
        .bg-orange { background-color: #fff7ed; border-color: #fed7aa; }
        
        .text-blue { color: #2563eb; }
        .text-green { color: #16a34a; }
        .text-purple { color: #9333ea; }
        .text-orange { color: #ea580c; }
        
        .font-medium { font-weight: 500; }
        .font-light { font-weight: 300; }
        
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .space-x-2 > * + * { margin-left: 0.5rem; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
        
        .apolice {
            border-radius: 4px;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            border: 1px solid;
            font-size: 0.85rem;
        }
        
        .seguradora-icon {
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.65rem;
        }
        
        .check {
            width: 0.75rem;
            height: 0.75rem;
            color: #16a34a;
        }
        
        .qr-placeholder {
            width: 3rem;
            height: 3rem;
            background: #111827;
            border-radius: 4px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            padding: 3px;
        }
        
        .qr-dot {
            background: white;
            border-radius: 1px;
        }
    </style>
</head>
<body>
    <!-- Página 1: Capa + Dados + Resumo -->
    <div class="page">
        <!-- Cabeçalho com logo -->
        <div class="flex items-center space-x-2" style="margin-bottom: 1.5rem;">
            <div class="logo">
                <div class="logo-dot"></div>
            </div>
            <div>
                <h3 style="margin: 0;">Olga</h3>
                <p class="text-gray-500 text-xs" style="margin: 0;">Sua Corretora Digital</p>
            </div>
        </div>

        <!-- Título principal -->
        <div class="text-center" style="margin-bottom: 2rem;">
            <h1>Boas Vindas</h1>
            <h2 class="font-medium">${client.full_name}</h2>
            <p class="text-gray-600">Suas proteções estão ativas</p>
        </div>

        <!-- Métricas principais -->
        <div class="grid-3 text-center" style="margin-bottom: 2rem;">
            <div>
                <div style="font-size: 1.5rem; font-weight: 300; margin-bottom: 0.25rem;">${policies.length}</div>
                <div class="text-sm text-gray-500">seguros</div>
            </div>
            <div>
                <div style="font-size: 1.5rem; font-weight: 300; margin-bottom: 0.25rem;">R$ ${totalValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</div>
                <div class="text-sm text-gray-500">por ano</div>
            </div>
            <div>
                <div style="font-size: 1.5rem; font-weight: 300; margin-bottom: 0.25rem;">100%</div>
                <div class="text-sm text-gray-500">cobertura</div>
            </div>
        </div>

        <!-- Dados essenciais do cliente -->
        <div class="card">
            <h3>Dados do Segurado</h3>
            <div class="grid-2 text-sm">
                <div>
                    <h4>Nome</h4>
                    <p>${client.full_name}</p>
                </div>
                <div>
                    <h4>CPF/CNPJ</h4>
                    <p>${client.cpf_cnpj || 'Não informado'}</p>
                </div>
                <div>
                    <h4>Telefone</h4>
                    <p>${client.phone}</p>
                </div>
                <div>
                    <h4>Email</h4>
                    <p>${client.email || 'Não informado'}</p>
                </div>
            </div>
            ${client.address ? `
            <div style="margin-top: 0.75rem;">
                <h4>Endereço</h4>
                <p class="text-sm">${typeof client.address === 'string' ? client.address : JSON.stringify(client.address)}</p>
            </div>
            ` : ''}
        </div>

        <!-- Suas proteções (compacto) -->
        <div class="card">
            <h3>Suas Proteções</h3>
            ${policyCards.map(policy => `
            <div class="apolice ${policy.bgColor}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div class="seguradora-icon" style="background: ${policy.color};">${policy.insurerCode}</div>
                        <div>
                            <div class="font-medium">${policy.type}</div>
                            <div class="text-xs text-gray-600">${policy.details} • ${policy.policyNumber}</div>
                        </div>
                    </div>
                    <div class="text-right" style="color: ${policy.color};">
                        <div class="font-medium">${policy.value}</div>
                        <div class="text-xs">por ano</div>
                    </div>
                </div>
            </div>
            `).join('')}
        </div>

        <!-- Contatos essenciais -->
        <div class="grid-2" style="margin-top: 1rem;">
            <div class="compact-card">
                <h4>Suporte Olga 24h</h4>
                <div class="space-y-1 text-sm">
                    <p><strong>WhatsApp:</strong> (11) 99999-0000</p>
                    <p><strong>Email:</strong> suporte@olga.com.br</p>
                </div>
            </div>
            <div class="compact-card">
                <h4>Emergências</h4>
                <div class="space-y-1 text-sm">
                    <p><strong>Auto:</strong> 0800-727-0015</p>
                    <p><strong>Casa:</strong> 0800-282-2000</p>
                    <p><strong>Vida:</strong> 0800-704-8383</p>
                </div>
            </div>
        </div>

        <!-- Mensagem personalizada -->
        <div class="card">
            <p class="text-sm">${options.customMessage}</p>
        </div>

        <!-- Rodapé com QR e data -->
        <div class="flex items-center justify-between" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
            <div>
                <div class="qr-placeholder">
                    <div class="qr-dot"></div>
                    <div class="qr-dot"></div>
                    <div class="qr-dot"></div>
                    <div class="qr-dot"></div>
                    <div></div>
                    <div class="qr-dot"></div>
                    <div class="qr-dot"></div>
                    <div class="qr-dot"></div>
                    <div class="qr-dot"></div>
                </div>
            </div>
            <div class="text-right">
                <p class="text-sm font-medium">Acesso Digital</p>
                <p class="text-xs text-gray-500">${new Date(options.emissionDate).toLocaleDateString('pt-BR')}</p>
            </div>
        </div>
    </div>

    <!-- Página 2: Detalhes das Apólices -->
    <div class="page page-break">
        <div class="flex items-center space-x-2" style="margin-bottom: 1.5rem;">
            <div class="logo">
                <div class="logo-dot"></div>
            </div>
            <div>
                <h3 style="margin: 0;">Detalhes das Apólices</h3>
                <p class="text-gray-500 text-xs" style="margin: 0;">Informações completas de cobertura</p>
            </div>
        </div>

        ${policyCards.map(policy => `
        <div class="card ${policy.bgColor}">
            <div class="flex items-center justify-between" style="margin-bottom: 0.75rem;">
                <div class="flex items-center space-x-2">
                    <div class="seguradora-icon" style="background: ${policy.color};">${policy.insurerCode}</div>
                    <div>
                        <h3 style="margin: 0;">${policy.type} - ${policy.insurer}</h3>
                        <p class="text-xs text-gray-600" style="margin: 0;">Vigência: ${policy.validity}</p>
                    </div>
                </div>
                <div style="color: ${policy.color};" class="font-medium">${policy.value}/ano</div>
            </div>
            
            <div class="grid-2 text-sm">
                <div>
                    <h4>Detalhes</h4>
                    <p>${policy.details}</p>
                </div>
                <div>
                    <h4>Coberturas</h4>
                    <div class="space-y-1">
                        ${policy.coverages.map(coverage => `
                        <div class="flex items-center space-x-1">
                            <svg class="check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>${coverage}</span>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        `).join('')}

        <!-- Contatos por Seguradora -->
        <div class="card">
            <h3>Contatos Diretos das Seguradoras</h3>
            <div class="grid-3 text-sm">
                ${[...new Set(policyCards.map(p => p.insurer))].map(insurer => {
                  const insurerData = getInsurerContactData(insurer)
                  return `
                  <div class="text-center">
                      <div class="${insurerData.colorClass} font-medium">${insurer}</div>
                      <p>24h: ${insurerData.emergency}</p>
                      <p>SAC: ${insurerData.sac}</p>
                  </div>
                  `
                }).join('')}
            </div>
        </div>

        <!-- Mensagem final -->
        <div class="text-center" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
            <h3>Obrigado por Confiar na Olga!</h3>
            <p class="text-sm text-gray-600">Sua proteção está garantida. Estamos sempre aqui para você.</p>
            <p class="text-xs text-gray-500" style="margin-top: 1rem;">${options.consultant} • suporte@olga.com.br</p>
        </div>
    </div>
</body>
</html>`
}

function getInsurerData(productCategory: string, insurerName: string) {
  const insurers = {
    'Porto Seguro': { code: 'PS', color: '#2563eb', bgColor: 'bg-blue' },
    'SulAmérica': { code: 'SA', color: '#16a34a', bgColor: 'bg-green' },
    'Bradesco Seguros': { code: 'BS', color: '#9333ea', bgColor: 'bg-purple' },
    'Azul Seguros': { code: 'AZ', color: '#ea580c', bgColor: 'bg-orange' },
    'Tokio Marine': { code: 'TM', color: '#dc2626', bgColor: 'bg-red' }
  }
  
  return insurers[insurerName] || { code: 'XX', color: '#6b7280', bgColor: 'bg-gray' }
}

function getProductDisplayInfo(product: any) {
  const productTypes = {
    'auto': {
      name: 'Seguro Auto',
      details: product?.description || 'Veículo protegido',
      coverages: ['Cobertura Total', 'Assistência 24h', 'Terceiros', 'Roubo e Furto']
    },
    'vida': {
      name: 'Seguro Vida',
      details: product?.description || 'Proteção familiar',
      coverages: ['Morte Natural/Acidental', 'Invalidez Permanente', 'Auxílio Funeral']
    },
    'residencial': {
      name: 'Seguro Residencial',
      details: product?.description || 'Casa protegida',
      coverages: ['Incêndio e Raio', 'Responsabilidade Civil', 'Danos Elétricos']
    },
    'empresarial': {
      name: 'Seguro Empresarial',
      details: product?.description || 'Negócio protegido',
      coverages: ['Incêndio', 'Equipamentos', 'Responsabilidade Civil']
    }
  }
  
  return productTypes[product?.category] || {
    name: product?.name || 'Seguro',
    details: product?.description || 'Proteção contratada',
    coverages: ['Cobertura Básica']
  }
}

function getInsurerContactData(insurerName: string) {
  const contacts = {
    'Porto Seguro': { 
      colorClass: 'text-blue', 
      emergency: '0800-727-0015', 
      sac: '0800-727-2767' 
    },
    'SulAmérica': { 
      colorClass: 'text-green', 
      emergency: '0800-282-2000', 
      sac: '0800-282-7373' 
    },
    'Bradesco Seguros': { 
      colorClass: 'text-purple', 
      emergency: '0800-704-8383', 
      sac: '0800-704-8484' 
    },
    'Azul Seguros': { 
      colorClass: 'text-orange', 
      emergency: '0800-123-4567', 
      sac: '0800-765-4321' 
    }
  }
  
  return contacts[insurerName] || { 
    colorClass: 'text-gray', 
    emergency: '0800-000-0000', 
    sac: '0800-000-0001' 
  }
}

async function generatePDFFromHTML(supabase: any, htmlContent: string, fileName: string) {
  // In production, use Puppeteer or similar to generate PDF
  // For now, simulate PDF generation and return a URL
  
  try {
    // Simulate PDF generation
    const pdfBuffer = Buffer.from(htmlContent, 'utf8')
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('welcome-kits')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })
    
    if (error) {
      console.error('Error uploading PDF:', error)
      // Return a placeholder URL
      return `https://storage.supabase.com/welcome-kits/${fileName}`
    }
    
    const { data: urlData } = supabase.storage
      .from('welcome-kits')
      .getPublicUrl(fileName)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error generating PDF:', error)
    return `https://storage.supabase.com/welcome-kits/${fileName}`
  }
}

async function sendWelcomeKitViaWhatsApp(supabase: any, client: any, pdfUrl: string, policiesCount: number) {
  try {
    const message = `🎉 ${client.full_name.split(' ')[0]}, seu Kit Boas Vindas está pronto!\n\n📋 ${policiesCount} ${policiesCount === 1 ? 'seguro ativo' : 'seguros ativos'}\n📄 Documento completo com todas as informações\n\n👇 Acesse seu kit:\n${pdfUrl}\n\n✅ Mantenha sempre em local seguro\n💬 Dúvidas? Estou aqui para ajudar!`

    const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        phone: client.phone,
        message,
        templateName: 'welcome_kit_delivery'
      }
    })

    if (error) {
      console.error('Error sending welcome kit via WhatsApp:', error)
    }

    return data
  } catch (error) {
    console.error('Error in sendWelcomeKitViaWhatsApp:', error)
  }
}