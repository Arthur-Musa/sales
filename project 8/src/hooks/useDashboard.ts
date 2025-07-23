import { useState, useEffect } from 'react'
import { api, subscriptions } from '../lib/supabase'

interface DashboardMetrics {
  totalSales: number
  totalRevenue: number
  conversionRate: number
  policiesEmitted: number
  recoveredSales: number
  avgEmissionTime: string
  activeConversations: number
  aiConfidenceAvg: number
  totalRecoveryValue: number
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalRevenue: 0,
    conversionRate: 0,
    policiesEmitted: 0,
    recoveredSales: 0,
    avgEmissionTime: '0s',
    activeConversations: 0,
    aiConfidenceAvg: 0,
    totalRecoveryValue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
    
    // Set up real-time subscriptions
    const salesSubscription = subscriptions.subscribeToSales(() => {
      fetchMetrics() // Refresh metrics when sales change
    })
    
    const policiesSubscription = subscriptions.subscribeToPolicies(() => {
      fetchMetrics() // Refresh metrics when policies change
    })
    
    return () => {
      salesSubscription.unsubscribe()
      policiesSubscription.unsubscribe()
    }
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await api.getDashboardMetrics()
      
      // Process the metrics from the API response
      setMetrics({
        totalSales: data.sales?.total || 0,
        totalRevenue: data.sales?.revenue || 0,
        conversionRate: data.sales?.conversionRate || 0,
        policiesEmitted: data.policies?.emitted || 0,
        recoveredSales: data.recovery?.successful || 0,
        avgEmissionTime: data.policies?.avgEmissionTime || '0s',
        activeConversations: data.whatsapp?.totalActive || 0,
        aiConfidenceAvg: data.whatsapp?.avgConfidence || 0,
        totalRecoveryValue: data.recovery?.totalRecoveredValue || 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    loading,
    error,
    fetchMetrics
  }
}