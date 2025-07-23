import { useState, useEffect } from 'react'
import { api, type Sale } from '../lib/supabase'

export function useSales(filters?: any) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSales()
  }, [filters])

  const fetchSales = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getSales(filters)
      setSales(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  const updateSaleStatus = async (id: string, status: string, lossReason?: string) => {
    try {
      await api.updateSaleStatus(id, status, lossReason)
      await fetchSales() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar venda')
    }
  }

  const createStripeCheckout = async (saleId: string) => {
    try {
      const result = await api.createStripeCheckout(saleId)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar checkout')
      throw err
    }
  }

  return {
    sales,
    loading,
    error,
    fetchSales,
    updateSaleStatus,
    createStripeCheckout
  }
}