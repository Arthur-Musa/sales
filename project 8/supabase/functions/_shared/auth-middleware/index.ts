import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const ROLES = {
  ADMIN: 'admin',
  GESTOR: 'gestor',
  OPERADOR: 'operador',
  VENDAS: 'vendas',
  COBRANCA: 'cobranca'
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  is_active: boolean
  permissions?: string[]
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Verify the JWT token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throw new Error('Invalid or expired token')
  }

  // Get user profile with role information
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, role, is_active, permissions')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('User profile not found')
  }

  if (!profile.is_active) {
    throw new Error('User account is inactive')
  }

  return profile as AuthenticatedUser
}

export function requireRole(allowedRoles: UserRole[]) {
  return (user: AuthenticatedUser) => {
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
    }
    return user
  }
}

export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  if (user.role === ROLES.ADMIN) {
    return true // Admins have all permissions
  }
  
  return user.permissions?.includes(permission) ?? false
}

export function requirePermission(permission: string) {
  return (user: AuthenticatedUser) => {
    if (!hasPermission(user, permission)) {
      throw new Error(`Access denied. Required permission: ${permission}`)
    }
    return user
  }
}