import { useState, useEffect } from 'react'
import { api, type Commission } from '../lib/supabase'

export function useCommissions(filters?: any) {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCommissions()
  }, [filters])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getCommissions(filters)
      setCommissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar comissões')
    } finally {
      setLoading(false)
    }
  }

  const approveCommission = async (id: string, notes?: string) => {
    try {
      await api.approveCommission(id, notes)
      await fetchCommissions() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar comissão')
    }
  }

  const rejectCommission = async (id: string, reason: string) => {
    try {
      await api.rejectCommission(id, reason)
      await fetchCommissions() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar comissão')
    }
  }

  const markAsPaid = async (id: string, paymentReference: string) => {
    try {
      await api.markCommissionAsPaid(id, paymentReference)
      await fetchCommissions() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar como paga')
    }
  }

  const bulkApprove = async (ids: string[], notes?: string) => {
    try {
      await api.bulkApproveCommissions(ids, notes)
      await fetchCommissions() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na aprovação em lote')
    }
  }

  return {
    commissions,
    loading,
    error,
    fetchCommissions,
    approveCommission,
    rejectCommission,
    markAsPaid,
    bulkApprove
  }
}