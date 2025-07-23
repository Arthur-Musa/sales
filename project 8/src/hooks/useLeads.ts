import { useState, useEffect } from 'react'
import { Lead } from '../lib/supabase'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      // Use demo data for development
      const demoLeads: Lead[] = [
        {
          id: 'demo-lead-1',
          client_id: 'demo-client-1',
          phone: '(11) 99876-5432',
          source: 'whatsapp',
          status: 'novo',
          product_interest: 'Seguro Auto',
          ai_score: 85,
          ai_confidence: 0.85,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          clients: {
            id: 'demo-client-1',
            full_name: 'João Silva',
            phone: '(11) 99876-5432',
            email: 'joao@email.com',
            cpf_cnpj: '123.456.789-00',
            lgpd_consent: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        {
          id: 'demo-lead-2',
          client_id: 'demo-client-2',
          phone: '(11) 98765-4321',
          source: 'manual',
          status: 'qualificado',
          product_interest: 'Seguro Vida',
          ai_score: 72,
          ai_confidence: 0.72,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          clients: {
            id: 'demo-client-2',
            full_name: 'Maria Santos',
            phone: '(11) 98765-4321',
            email: 'maria@email.com',
            cpf_cnpj: '987.654.321-00',
            lgpd_consent: true,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString()
          }
        }
      ];
      setLeads(demoLeads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }

  const createLead = async (leadData: {
    phone: string
    full_name?: string
    product_interest?: string
    source?: string
  }) => {
    try {
      // Simulate lead creation
      const newLead: Lead = {
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
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setLeads(prev => [newLead, ...prev]);
      return newLead;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lead')
      throw err
    }
  }

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Se o lead foi fechado (pago), trigger automação de emissão
      if (status === 'pago') {
        await triggerPolicyEmissionForLead(id);
      }
      
      setLeads(prev => 
        prev.map(lead => 
          lead.id === id 
            ? { ...lead, status, updated_at: new Date().toISOString() }
            : lead
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lead')
      throw err;
    }
  }

  const triggerPolicyEmissionForLead = async (leadId: string) => {
    try {
      // Buscar venda associada ao lead
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      // Simular busca da venda pelo lead_id
      const mockSaleId = `sale-${leadId}`;
      
      // Trigger emissão de apólice
      console.log(`Triggering policy emission for lead ${leadId} -> sale ${mockSaleId}`);
      
      // Em produção, chamaria a API real
      // await api.triggerPolicyEmission(mockSaleId);
      
      // Simular delay da emissão
      setTimeout(() => {
        console.log(`Policy emitted for sale ${mockSaleId}`);
        
        // Trigger Kit Boas Vindas após emissão
        setTimeout(() => {
          console.log(`Welcome kit sent for sale ${mockSaleId}`);
        }, 2000);
      }, 3000);
      
    } catch (error) {
      console.error('Error triggering policy emission:', error);
    }
  }
  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLeadStatus
  }
}