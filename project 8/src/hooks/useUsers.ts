import { useState, useEffect } from 'react'
import { api } from '../lib/supabase'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'gestor' | 'operador' | 'vendas' | 'cobranca'
  is_active: boolean
  last_login?: string
  permissions?: any
  created_at: string
  updated_at: string
}

export function useUsers(filters?: any) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getUsers(filters)
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: Partial<User>) => {
    try {
      await api.createUser(userData)
      await fetchUsers() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário')
    }
  }

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      await api.updateUser(id, userData)
      await fetchUsers() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário')
    }
  }

  const deactivateUser = async (id: string) => {
    try {
      await api.updateUser(id, { is_active: false })
      await fetchUsers() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar usuário')
    }
  }

  const reactivateUser = async (id: string) => {
    try {
      await api.updateUser(id, { is_active: true })
      await fetchUsers() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reativar usuário')
    }
  }

  const deleteUser = async (id: string) => {
    try {
      await api.deleteUser(id)
      await fetchUsers() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir usuário')
    }
  }

  const inviteUser = async (email: string, role: string, fullName: string) => {
    try {
      await api.inviteUser(email, role, fullName)
      await fetchUsers() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar convite')
    }
  }

  const resendInvite = async (userId: string) => {
    try {
      await api.resendInvite(userId)
      // No need to refresh as this doesn't change the user list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar convite')
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    deleteUser,
    inviteUser,
    resendInvite
  }
}