import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }

      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Try to get user profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('User profile not found, creating...', error)
        
        // Get auth user data
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          throw new Error('No authenticated user found')
        }

        // Create user profile
        const newUserData = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
          role: authUser.user_metadata?.role || 'operador',
          is_active: true,
          metadata: authUser.user_metadata || {},
          tenant_id: authUser.user_metadata?.tenant_id || 'default-tenant-id'
        }

        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert(newUserData)
          .select()
          .single()

        if (createError) {
          console.error('Error creating user profile:', createError)
          // If still fails, create a minimal user object from auth data
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || 'Usuário',
            role: 'operador',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as User)
        } else {
          setUser(newProfile)
        }
      } else {
        setUser(data)
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err)
      setError('Erro ao carregar perfil do usuário')
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        setError(getErrorMessage(error.message))
        throw new Error(getErrorMessage(error.message))
      }

      return data
    } catch (err) {
      console.error('Sign in error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        setError(error.message)
        throw error
      }

      setUser(null)
    } catch (err) {
      console.error('Sign out error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: string = 'operador') => {
    try {
      setLoading(true)
      setError(null)

      // Validate inputs
      if (!email || !password || !fullName) {
        throw new Error('Todos os campos são obrigatórios')
      }

      if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            tenant_id: '00000000-0000-0000-0000-000000000001'
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        const errorMsg = getErrorMessage(error.message)
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      if (!data.user) {
        throw new Error('Erro ao criar usuário')
      }

      return data
    } catch (err) {
      console.error('Sign up error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        setError(getErrorMessage(error.message))
        throw new Error(getErrorMessage(error.message))
      }

      return true
    } catch (err) {
      console.error('Reset password error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        setError(error.message)
        throw error
      }

      setUser(data)
      return data
    } catch (err) {
      console.error('Update profile error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (newPassword: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setError(error.message)
        throw error
      }

      return true
    } catch (err) {
      console.error('Change password error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    changePassword
  }
}

function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos. Para o usuário demo, certifique-se de que foi criado no Supabase Dashboard.',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
    'User already registered': 'Este email já está cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de email inválido',
    'Database error saving new user': 'Erro no banco de dados. Tente novamente.',
    'unexpected_failure': 'Erro inesperado. Tente novamente.'
  }

  return errorMessages[error] || error
}