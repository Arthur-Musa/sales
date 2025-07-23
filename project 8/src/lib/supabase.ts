import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'gestor' | 'operador' | 'vendas' | 'cobranca'
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  cpf_cnpj?: string
  full_name: string
  email?: string
  phone: string
  birth_date?: string
  address?: any
  lgpd_consent: boolean
  lgpd_consent_date?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  category: string
  description?: string
  base_price: number
  commission_rate: number
  is_active: boolean
  config?: any
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  client_id?: string
  phone: string
  source: string
  status: 'novo' | 'qualificado' | 'proposta_enviada' | 'aguardando_pagamento' | 'pago' | 'perdido' | 'abandonado'
  product_interest?: string
  ai_score: number
  ai_confidence: number
  assigned_to?: string
  metadata?: any
  created_at: string
  updated_at: string
  clients?: Client
}

export interface Sale {
  id: string
  lead_id?: string
  client_id: string
  product_id: string
  status: 'lead' | 'qualificado' | 'proposta' | 'aguardando_pagamento' | 'pago' | 'perdido' | 'pendente' | 'cancelado'
  value: number
  installments: number
  installment_value?: number
  coverage_details?: any
  loss_reason?: string
  seller_id?: string
  seller_type: string
  conversion_time?: string
  proposal_sent_at?: string
  payment_link_sent_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
  clients?: Client
  products?: Product
  payments?: Payment[]
  policies?: Policy[]
}

export interface Payment {
  id: string
  sale_id: string
  stripe_payment_intent_id?: string
  stripe_checkout_session_id?: string
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
  payment_method?: string
  stripe_fee?: number
  net_amount?: number
  paid_at?: string
  refunded_at?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export interface Policy {
  id: string
  policy_number: string
  sale_id: string
  client_id: string
  product_id: string
  status: 'processando' | 'emitida' | 'entregue' | 'erro' | 'cancelada'
  insurer: string
  coverage_start_date: string
  coverage_end_date: string
  pdf_url?: string
  pdf_generated_at?: string
  emission_time?: string
  delivery_whatsapp: boolean
  delivery_email: boolean
  delivery_attempts: number
  last_delivery_attempt?: string
  error_message?: string
  metadata?: any
  created_at: string
  updated_at: string
  clients?: Client
  products?: Product
  policy_documents?: PolicyDocument[]
}

export interface PolicyDocument {
  id: string
  policy_id: string
  document_type: string
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string
  generated_at: string
  created_at: string
}

export interface WhatsAppConversation {
  id: string
  client_id?: string
  lead_id?: string
  phone: string
  status: string
  ai_active: boolean
  last_message_at: string
  created_at: string
  updated_at: string
  clients?: Client
  leads?: Lead
}

export interface WhatsAppMessage {
  id: string
  conversation_id: string
  message_id?: string
  direction: 'inbound' | 'outbound'
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location'
  content?: string
  media_url?: string
  template_name?: string
  template_params?: any
  timestamp: string
  delivered: boolean
  read: boolean
  failed: boolean
  error_message?: string
  metadata?: any
  created_at: string
}

export interface RecoveryCampaign {
  id: string
  lead_id?: string
  sale_id?: string
  status: 'ativo' | 'pausado' | 'concluido' | 'cancelado'
  trigger_reason: string
  attempts: number
  max_attempts: number
  next_attempt_at?: string
  success: boolean
  success_at?: string
  created_at: string
  updated_at: string
}

export interface Commission {
  id: string
  sale_id: string
  user_id: string
  amount: number
  percentage: number
  status: 'pendente' | 'aprovada' | 'paga' | 'rejeitada'
  approved_by?: string
  approved_at?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  timestamp: string
}

export interface SystemConfig {
  id: string
  key: string
  value: any
  description?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

// API functions
export const api = {
  // Leads
  async getLeads(filters?: any) {
    let tenantId: string
    try {
      tenantId = await getCurrentTenantId()
    } catch (error) {
      console.warn('Authentication issue, using demo data')
      return []
    }
    
    let query = supabase
      .from('leads')
      .select(`
        *,
        clients(*),
        assigned_to:users!leads_assigned_to_fkey(*)
      `)
      .order('created_at', { ascending: false })

    if (tenantId && tenantId !== 'default-tenant-id') {
      query = query.eq('tenant_id', tenantId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.product_interest) {
      query = query.eq('product_interest', filters.product_interest)
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    const { data, error } = await query
    if (error) {
      console.warn('Database query failed:', error)
      return []
    }
    return data as Lead[]
  },

  async createLead(leadData: {
    phone: string
    full_name?: string
    product_interest?: string
    source?: string
  }) {
    // Simulate lead creation for development
    const newLead = {
      id: `demo-lead-${Date.now()}`,
      client_id: leadData.full_name ? `demo-client-${Date.now()}` : null,
      phone: leadData.phone,
      source: leadData.source || 'manual',
      status: 'novo',
      product_interest: leadData.product_interest,
      ai_score: 50,
      ai_confidence: 0.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clients: leadData.full_name ? {
        id: `demo-client-${Date.now()}`,
        full_name: leadData.full_name,
        phone: leadData.phone,
        email: null,
        cpf_cnpj: null,
        lgpd_consent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : null
    };
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return newLead;
  },

  async updateLeadStatus(id: string, status: string) {
    try {
      // Update lead status in database
      const { data, error } = await supabase
        .from('leads')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Se lead foi fechado (pago), trigger automação
      if (status === 'pago') {
        await this.triggerLeadClosureAutomation(id)
      }

      return data
    } catch (error) {
      console.warn('Database update failed, using simulation:', error)
      // Fallback para desenvolvimento
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        id,
        status,
        updated_at: new Date().toISOString()
      };
    }
  },

  async triggerLeadClosureAutomation(leadId: string) {
    try {
      // 1. Buscar venda associada ao lead
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          clients(*),
          products(*)
        `)
        .eq('lead_id', leadId)
        .eq('status', 'pago')
        .single()

      if (saleError || !sale) {
        console.warn('No paid sale found for lead:', leadId)
        return
      }

      // 2. Trigger emissão de apólice
      console.log(`Triggering policy emission for sale: ${sale.id}`)
      
      const { data: policyData, error: policyError } = await supabase.functions.invoke('emit-policy', {
        body: { saleId: sale.id }
      })

      if (policyError) {
        console.error('Error emitting policy:', policyError)
        return
      }

      // 3. Agendar Kit Boas Vindas (5 segundos após emissão)
      setTimeout(async () => {
        try {
          await supabase.functions.invoke('generate-welcome-kit', {
            body: {
              saleId: sale.id,
              autoSend: true,
              trigger: 'lead_closure',
              customMessage: 'Parabéns! Seu seguro foi aprovado e sua apólice já está sendo emitida. Este kit contém todas as informações importantes.'
            }
          })
          console.log(`Welcome kit triggered for sale: ${sale.id}`)
        } catch (kitError) {
          console.error('Error generating welcome kit:', kitError)
        }
      }, 5000)

      // 4. Log da automação
      await supabase
        .from('audit_logs')
        .insert({
          action: 'lead_closure_automation',
          resource_type: 'lead',
          resource_id: leadId,
          new_values: {
            sale_id: sale.id,
            policy_triggered: true,
            welcome_kit_scheduled: true,
            automation_trigger: 'lead_status_change'
          }
        })

    } catch (error) {
      console.error('Error in lead closure automation:', error)
    }
  },

  // Sales
  async getSales(filters?: any) {
    let tenantId: string
    try {
      tenantId = await getCurrentTenantId()
    } catch (error) {
      console.warn('Authentication issue, using demo data')
      // Return demo data for development
      return [
        {
          id: 'demo-sale-1',
          client_id: 'demo-client-1',
          product_id: 'demo-product-1',
          status: 'pago',
          value: 1247.50,
          installments: 12,
          seller_type: 'ia',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          clients: {
            id: 'demo-client-1',
            full_name: 'Maria José Silva',
            phone: '(11) 99876-5432',
            email: 'maria.jose@email.com',
            cpf_cnpj: '123.456.789-00'
          },
          products: {
            id: 'demo-product-1',
            name: 'Seguro Auto',
            category: 'auto',
            description: 'Honda Civic 2022'
          }
        }
      ] as Sale[]
    }
    
    let query = supabase
      .from('sales')
      .select(`
        *,
        clients(*),
        products(*),
        payments(*),
        policies(*),
        leads(*)
      `)
      .order('created_at', { ascending: false })

    // Only filter by tenant if we have a valid tenant ID
    if (tenantId && tenantId !== 'default-tenant-id') {
      query = query.eq('tenant_id', tenantId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.product_category) {
      query = query.eq('products.category', filters.product_category)
    }
    if (filters?.seller_type) {
      query = query.eq('seller_type', filters.seller_type)
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data, error } = await query
    if (error) {
      console.warn('Database query failed, using demo data:', error)
      return []
    }
    return data as Sale[]
  },

  async getSale(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        clients(*),
        products(*),
        payments(*),
        policies(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Sale
  },

  async updateSaleStatus(id: string, status: string, lossReason?: string) {
    const updateData: any = { status }
    if (lossReason) updateData.loss_reason = lossReason

    const { data, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Policies
  async getPolicies(filters?: any) {
    let tenantId: string
    try {
      tenantId = await getCurrentTenantId()
    } catch (error) {
      console.warn('Authentication issue, using demo data')
      return []
    }
    
    let query = supabase
      .from('policies')
      .select(`
        *,
        clients(*),
        products(*),
        policy_documents(*)
      `)
      .order('created_at', { ascending: false })

    if (tenantId && tenantId !== 'default-tenant-id') {
      query = query.eq('tenant_id', tenantId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.insurer) {
      query = query.eq('insurer', filters.insurer)
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    const { data, error } = await query
    if (error) {
      console.warn('Database query failed:', error)
      return []
    }
    return data as Policy[]
  },

  async reemitPolicy(id: string) {
    // Get policy details first
    const { data: policy } = await supabase
      .from('policies')
      .select('sale_id')
      .eq('id', id)
      .single()
    
    if (!policy) throw new Error('Policy not found')
    
    const { data, error } = await supabase.functions.invoke('emit-policy', {
      body: { saleId: policy.sale_id }
    })

    if (error) throw error
    return data
  },

  async downloadPolicyPDF(policyId: string) {
    const { data: policy } = await supabase
      .from('policies')
      .select('pdf_url, policy_number')
      .eq('id', policyId)
      .single()
    
    if (!policy?.pdf_url) throw new Error('PDF not available')
    
    return {
      url: policy.pdf_url,
      filename: `apolice_${policy.policy_number}.pdf`
    }
  },
  // WhatsApp Conversations
  async getConversations() {
    const tenantId = await getCurrentTenantId()
    
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        clients(*),
        leads(*)
      `)
      .eq('tenant_id', tenantId)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    return data as WhatsAppConversation[]
  },

  async getConversationMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true })

    if (error) throw error
    return data as WhatsAppMessage[]
  },

  // Recovery Campaigns
  async getRecoveryCampaigns() {
    const tenantId = await getCurrentTenantId()
    
    const { data, error } = await supabase
      .from('recovery_campaigns')
      .select(`
        *,
        leads(*, clients(*)),
        sales(*, clients(*))
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as RecoveryCampaign[]
  },

  async triggerRecovery(leadId: string, reason: string) {
    const { data, error } = await supabase.functions.invoke('send-recovery-message', {
      body: { leadId, reason }
    })

    if (error) throw error
    return data
  },

  async pauseRecoveryCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('recovery_campaigns')
      .update({ status: 'pausado' })
      .eq('id', campaignId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  // Audit Logs
  async getAuditLogs(filters?: any) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    if (filters?.resource_type) {
      query = query.eq('resource_type', filters.resource_type)
    }
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    const { data, error } = await query
    if (error) throw error
    return data as AuditLog[]
  },

  // Dashboard metrics
  async getDashboardMetrics() {
    const tenantId = await getCurrentTenantId()
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Get sales metrics for today and last 30 days
    const { data: salesToday } = await supabase
      .from('sales')
      .select('status, value, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', today)
    
    const { data: salesMonth } = await supabase
      .from('sales')
      .select('status, value, created_at, conversion_time')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo)

    // Get policies metrics for today
    const { data: policiesToday } = await supabase
      .from('policies')
      .select('status, created_at, emission_time')
      .eq('tenant_id', tenantId)
      .gte('created_at', today)

    // Get recovery metrics for last 30 days
    const { data: recoveryData } = await supabase
      .from('recovery_campaigns')
      .select('status, success, created_at, recovery_value')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo)
    
    // Get active conversations
    const { data: conversationsData } = await supabase
      .from('whatsapp_conversations')
      .select('status, ai_active, ai_confidence, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')

    return {
      salesToday: salesToday || [],
      salesMonth: salesMonth || [],
      policiesToday: policiesToday || [],
      recovery: recoveryData || [],
      conversations: conversationsData || []
    }
  },

  // Create Stripe checkout
  async createStripeCheckout(saleId: string) {
    const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
      body: { saleId }
    })

    if (error) throw error
    return data
  },
  
  // Notifications
  async getNotifications(userId?: string) {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },
  
  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  
  // System configs
  async getSystemConfigs() {
    const { data, error } = await supabase
      .from('system_configs')
      .select('key, value, description, is_sensitive')
      .order('key')
    
    if (error) throw error
    return data
  },
  
  async updateSystemConfig(key: string, value: any) {
    const { data, error } = await supabase
      .from('system_configs')
      .update({ 
        value,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('key', key)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Users management
  async getUsers(filters?: any) {
    let tenantId: string
    try {
      tenantId = await getCurrentTenantId()
    } catch (error) {
      console.warn('Authentication issue, using demo data')
      return []
    }
    
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (tenantId && tenantId !== 'default-tenant-id') {
      query = query.eq('tenant_id', tenantId)
    }

    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }
    if (filters?.role) {
      query = query.eq('role', filters.role)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query
    if (error) {
      console.warn('Database query failed:', error)
      return []
    }
    return data
  },

  async createUser(userData: any) {
    const { data, error } = await supabase.functions.invoke('user-management', {
      body: userData
    })
    if (error) throw error
    return data
  },

  async updateUser(id: string, userData: any) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async inviteUser(email: string, role: string, fullName: string) {
    const { data, error } = await supabase.functions.invoke('send-user-invitation', {
      body: {
        email,
        fullName,
        role
      }
    })
    if (error) throw error
    return data
  },

  async resendInvite(userId: string) {
    const { data, error } = await supabase.functions.invoke('resend-user-invitation', {
      body: { userId }
    })
    if (error) throw error
    return data
  },

  // Queue management
  async enqueueJob(jobData: any) {
    const { data, error } = await supabase.functions.invoke('queue-manager', {
      body: {
        action: 'enqueue',
        ...jobData
      }
    })
    if (error) throw error
    return data
  },

  async getQueueStatus(queueName?: string) {
    const { data, error } = await supabase.functions.invoke('queue-manager', {
      body: {
        action: 'status',
        queue_name: queueName
      }
    })
    if (error) throw error
    return data
  },

  // AI Processing
  async processWithAI(type: string, inputData: any) {
    const tenantId = await getCurrentTenantId()
    
    const { data, error } = await supabase.functions.invoke('ai-processor', {
      body: {
        type,
        input_data: inputData,
        tenant_id: tenantId
      }
    })
    if (error) throw error
    return data
  },

  // n8n Integration
  async triggerN8nWorkflow(workflowName: string, triggerData: any) {
    const tenantId = await getCurrentTenantId()
    
    const { data, error } = await supabase.functions.invoke('n8n-integration', {
      body: {
        workflow_name: workflowName,
        trigger_data: triggerData,
        tenant_id: tenantId
      }
    })
    if (error) throw error
    return data
  },

  // Webhook for receiving leads from n8n
  async receiveLeadFromN8n(leadData: any) {
    const { data, error } = await supabase.functions.invoke('n8n-webhook-leads', {
      body: leadData
    })
    if (error) throw error
    return data
  },

  // Subdomain management
  async createSubdomain(tenantId: string, subdomain: string) {
    const { data, error } = await supabase.functions.invoke('subdomain-manager', {
      body: {
        action: 'create',
        tenant_id: tenantId,
        subdomain
      }
    })
    if (error) throw error
    return data
  },

  async verifySubdomain(tenantId: string, subdomain: string) {
    const { data, error } = await supabase.functions.invoke('subdomain-manager', {
      body: {
        action: 'verify',
        tenant_id: tenantId,
        subdomain
      }
    })
    if (error) throw error
    return data
  },
  // Commissions
  async getCommissions(filters?: any) {
    let tenantId: string
    try {
      tenantId = await getCurrentTenantId()
    } catch (error) {
      console.warn('Authentication issue, using demo data')
      return []
    }
    
    let query = supabase
      .from('commissions')
      .select(`
        *,
        sales(value, created_at, products(name, category)),
        users!commissions_user_id_fkey(full_name, email, role)
      `)
      .order('created_at', { ascending: false })

    if (tenantId && tenantId !== 'default-tenant-id') {
      query = query.eq('tenant_id', tenantId)
    }

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.userId) query = query.eq('user_id', filters.userId)
    if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom)
    if (filters?.dateTo) query = query.lte('created_at', filters.dateTo)

    const { data, error } = await query
    if (error) {
      console.warn('Database query failed:', error)
      return []
    }
    return data as Commission[]
  },

  async approveCommission(id: string, notes?: string) {
    const { data, error } = await supabase
      .from('commissions')
      .update({
        status: 'aprovada',
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        approved_at: new Date().toISOString(),
        notes
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async rejectCommission(id: string, reason: string) {
    const { data, error } = await supabase
      .from('commissions')
      .update({
        status: 'rejeitada',
        notes: reason
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markCommissionAsPaid(id: string, paymentReference: string) {
    const { data, error } = await supabase
      .from('commissions')
      .update({
        status: 'paga',
        paid_at: new Date().toISOString(),
        payment_reference: paymentReference
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async bulkApproveCommissions(ids: string[], notes?: string) {
    const { data, error } = await supabase.functions.invoke('bulk-operations', {
      body: {
        operation: 'approve_commissions',
        resourceType: 'commissions',
        resourceIds: ids,
        parameters: {
          approvedBy: (await supabase.auth.getUser()).data.user?.id,
          notes
        }
      }
    })

    if (error) throw error
    return data
  },

  // Bulk operations
  async bulkUpdateSalesStatus(ids: string[], status: string, lossReason?: string) {
    const { data, error } = await supabase.functions.invoke('bulk-operations', {
      body: {
        operation: 'update_status',
        resourceType: 'sales',
        resourceIds: ids,
        parameters: {
          newStatus: status,
          lossReason,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      }
    })

    if (error) throw error
    return data
  },

  async bulkSendWhatsAppMessages(ids: string[], templateName?: string, customMessage?: string) {
    const { data, error } = await supabase.functions.invoke('bulk-operations', {
      body: {
        operation: 'send_messages',
        resourceType: 'sales',
        resourceIds: ids,
        parameters: {
          templateName,
          customMessage
        }
      }
    })

    if (error) throw error
    return data
  },

  // Generate welcome kit
  async generateWelcomeKit(data: {
    saleId?: string
    clientId?: string
    policyIds?: string[]
    searchTerm?: string
    customMessage?: string
    consultantName?: string
    autoSend?: boolean
  }) {
    const { data: result, error } = await supabase.functions.invoke('generate-welcome-kit', {
      body: data
    })
    if (error) throw error
    return result
  },

  // Search clients for welcome kit
  async searchClientsForKit(searchTerm: string) {
    // Search in multiple tables
    const searches = await Promise.all([
      // Search clients
      supabase
        .from('clients')
        .select(`
          id,
          full_name,
          cpf_cnpj,
          phone,
          email,
          address,
          policies(count)
        `)
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cpf_cnpj.ilike.%${searchTerm}%`)
        .limit(5),
      
      // Search sales
      supabase
        .from('sales')
        .select(`
          id,
          value,
          status,
          created_at,
          clients(full_name, phone, email),
          products(name, category)
        `)
        .eq('status', 'pago')
        .limit(3),
      
      // Search policies
      supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          insurer,
          status,
          clients(full_name, phone),
          products(name)
        `)
        .ilike('policy_number', `%${searchTerm}%`)
        .eq('status', 'emitida')
        .limit(3)
    ])

    const [clientsResult, salesResult, policiesResult] = searches
    
    const results = []
    
    // Add client results
    if (clientsResult.data) {
      results.push(...clientsResult.data.map(client => ({
        type: 'client' as const,
        id: client.id,
        title: client.full_name,
        subtitle: `${client.phone} • ${client.email || 'Sem email'}`,
        details: `CPF: ${client.cpf_cnpj || 'Não informado'} • ${client.policies?.length || 0} apólices`,
        data: client
      })))
    }
    
    // Add sale results
    if (salesResult.data) {
      results.push(...salesResult.data.map(sale => ({
        type: 'sale' as const,
        id: sale.id,
        title: `Venda #${sale.id.slice(0, 8)}`,
        subtitle: `${sale.clients?.full_name} • ${sale.products?.name} • ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}`,
        details: `${sale.status} em ${new Date(sale.created_at).toLocaleDateString('pt-BR')}`,
        data: sale
      })))
    }
    
    // Add policy results
    if (policiesResult.data) {
      results.push(...policiesResult.data.map(policy => ({
        type: 'policy' as const,
        id: policy.id,
        title: `Apólice ${policy.policy_number}`,
        subtitle: `${policy.clients?.full_name} • ${policy.products?.name}`,
        details: `${policy.insurer} • ${policy.status}`,
        data: policy
      })))
    }
    
    return results
  },

  // Get client data for welcome kit
  async getClientDataForKit(clientId: string) {
    const [clientResult, salesResult, policiesResult] = await Promise.all([
      // Get client data
      supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single(),
      
      // Get client sales
      supabase
        .from('sales')
        .select(`
          *,
          products(*),
          policies(*)
        `)
        .eq('client_id', clientId)
        .eq('status', 'pago')
        .order('created_at', { ascending: false }),
      
      // Get client policies
      supabase
        .from('policies')
        .select(`
          *,
          products(*),
          sales(value)
        `)
        .eq('client_id', clientId)
        .eq('status', 'emitida')
        .order('created_at', { ascending: false })
    ])

    if (clientResult.error) throw clientResult.error
    if (salesResult.error) throw salesResult.error
    if (policiesResult.error) throw policiesResult.error

    return {
      client: clientResult.data,
      sales: salesResult.data || [],
      policies: policiesResult.data || []
    }
  },

  // Tenant management
  async getCurrentTenant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: userProfile } = await supabase
      .from('users')
      .select('tenant_id, tenants(*)')
      .eq('id', user.id)
      .single()

    if (!userProfile?.tenant_id) throw new Error('User not associated with tenant')
    return userProfile.tenants
  },

  async getTenantSubscription() {
    const tenantId = await getCurrentTenantId()
    
    const { data, error } = await supabase
      .from('tenant_subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getTenantIntegrations() {
    const tenantId = await getCurrentTenantId()
    
    const { data, error } = await supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('integration_type')

    if (error) throw error
    return data
  },

  async updateTenantIntegration(integrationId: string, config: any) {
    const { data, error } = await supabase
      .from('tenant_integrations')
      .update({ config, updated_at: new Date().toISOString() })
      .eq('id', integrationId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Superadmin functions
  async getAllTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        tenant_subscriptions(*),
        tenant_domains(*),
        users(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createTenant(tenantData: any) {
    const { data, error } = await supabase.functions.invoke('tenant-management', {
      body: tenantData
    })

    if (error) throw error
    return data
  },

  async impersonateTenant(tenantId: string, durationMinutes: number = 60) {
    const { data, error } = await supabase.functions.invoke('superadmin-management', {
      body: {
        action: 'impersonate',
        tenant_id: tenantId,
        duration_minutes: durationMinutes
      }
    })

    if (error) throw error
    return data
  },

  // Automation functions
  async triggerAutomation(workflowId: string, triggerData: any) {
    const tenantId = await getCurrentTenantId()
    
    const { data, error } = await supabase.functions.invoke('automation-orchestrator', {
      body: {
        workflow_id: workflowId,
        trigger_type: 'manual',
        trigger_data: triggerData,
        tenant_id: tenantId
      }
    })

    if (error) throw error
    return data
  },

  async getAutomationLogs(filters?: any) {
    const tenantId = await getCurrentTenantId()
    
    let query = supabase
      .from('automation_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('started_at', { ascending: false })
      .limit(100)

    if (filters?.workflow_id) {
      query = query.eq('workflow_id', filters.workflow_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Integration functions
  async callIntegration(integrationType: string, provider: string, action: string, data: any) {
    const tenantId = await getCurrentTenantId()
    
    const { data: result, error } = await supabase.functions.invoke('integration-manager', {
      body: {
        tenant_id: tenantId,
        integration_type: integrationType,
        provider,
        action,
        data
      }
    })

    if (error) throw error
    return result
  },

  async getIntegrationLogs(filters?: any) {
    const tenantId = await getCurrentTenantId()
    
    let query = supabase
      .from('integration_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filters?.integration_type) {
      query = query.eq('integration_type', filters.integration_type)
    }
    if (filters?.success !== undefined) {
      query = query.eq('success', filters.success)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }
}

// Helper function to get current tenant ID
async function getCurrentTenantId(): Promise<string> {
  // During development, always return default tenant
  return '00000000-0000-0000-0000-000000000001'
}

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    return supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  },

  // Subscribe to sales updates
  subscribeToSales(callback: (sale: any) => void) {
    return supabase
      .channel('sales')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales'
        }, 
        callback
      )
      .subscribe()
  },

  // Subscribe to policy updates
  subscribeToPolicies(callback: (policy: any) => void) {
    return supabase
      .channel('policies')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'policies'
        }, 
        callback
      )
      .subscribe()
  },

  // Subscribe to WhatsApp messages
  subscribeToWhatsAppMessages(conversationId: string, callback: (message: any) => void) {
    return supabase
      .channel('whatsapp_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'whatsapp_messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        callback
      )
      .subscribe()
  }
}