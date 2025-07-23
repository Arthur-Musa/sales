import { useState, useEffect } from 'react'
import { api } from '../lib/supabase'

interface RecoveryCampaign {
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
  recovery_value?: number
  campaign_type: string
  metadata?: any
  created_at: string
  updated_at: string
  leads?: any
  sales?: any
}

export function useRecovery(filters?: any) {
  const [campaigns, setCampaigns] = useState<RecoveryCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [filters])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getRecoveryCampaigns()
      setCampaigns(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas')
    } finally {
      setLoading(false)
    }
  }

  const triggerRecovery = async (leadId: string, reason: string) => {
    try {
      await api.triggerRecovery(leadId, reason)
      await fetchCampaigns() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar recuperação')
    }
  }

  const pauseCampaign = async (campaignId: string) => {
    try {
      await api.pauseRecoveryCampaign(campaignId)
      await fetchCampaigns() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pausar campanha')
    }
  }

  const resumeCampaign = async (campaignId: string) => {
    try {
      // Resume campaign logic would go here
      await fetchCampaigns() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao retomar campanha')
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    try {
      // Delete campaign logic would go here
      await fetchCampaigns() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir campanha')
    }
  }

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    triggerRecovery,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign
  }
}