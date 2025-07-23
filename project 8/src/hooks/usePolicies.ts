import { useState, useEffect } from 'react'
import { api, type Policy } from '../lib/supabase'

export function usePolicies(filters?: any) {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPolicies()
  }, [filters])

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getPolicies(filters)
      setPolicies(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar apólices')
    } finally {
      setLoading(false)
    }
  }

  const reemitPolicy = async (id: string) => {
    try {
      await api.reemitPolicy(id)
      await fetchPolicies() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reemitir apólice')
    }
  }

  return {
    policies,
    loading,
    error,
    fetchPolicies,
    reemitPolicy
  }
}