import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface ReportFilters {
  dateFrom?: string
  dateTo?: string
  status?: string
  userId?: string
  productCategory?: string
}

export function useReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = async (
    type: 'sales' | 'commissions' | 'policies' | 'recovery' | 'compliance',
    format: 'csv' | 'pdf' | 'json',
    filters: ReportFilters = {}
  ) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: reportError } = await supabase.functions.invoke('generate-reports', {
        body: {
          type,
          format,
          filters
        }
      })

      if (reportError) throw reportError

      // Create download link
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 
              format === 'pdf' ? 'application/pdf' : 
              'application/json'
      })
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const scheduleReport = async (
    type: string,
    format: string,
    filters: ReportFilters,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly'
      time: string
      recipients: string[]
    }
  ) => {
    try {
      setLoading(true)
      setError(null)

      // In production, this would create a scheduled job
      // For now, we'll store the schedule in system_configs
      const { data, error } = await supabase
        .from('system_configs')
        .upsert({
          key: `scheduled_report_${type}_${Date.now()}`,
          value: {
            type,
            format,
            filters,
            schedule,
            active: true,
            created_at: new Date().toISOString()
          },
          description: `Relatório agendado: ${type}`
        })

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar relatório')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    generateReport,
    scheduleReport
  }
}