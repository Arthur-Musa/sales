/*
  # Criar usuário demo corretamente

  1. Limpeza
    - Remove tentativas anteriores de criar usuário demo
    - Limpa dados inconsistentes

  2. Configuração
    - Cria tenant padrão se não existir
    - Configura função para criar perfil automaticamente

  3. Instruções
    - Fornece instruções para criar usuário demo manualmente
*/

-- Limpar tentativas anteriores de criar usuário demo
DELETE FROM users WHERE email = 'demo@olga-ai.com';
DELETE FROM auth.users WHERE email = 'demo@olga-ai.com';

-- Garantir que o tenant padrão existe
INSERT INTO tenants (id, name, slug, email, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo',
  'demo@olga-ai.com',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  status = EXCLUDED.status;

-- Função melhorada para criar perfil de usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
  user_role text;
  user_permissions jsonb;
BEGIN
  -- Determinar role do usuário
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'operador');
  
  -- Definir permissões baseadas na role
  CASE user_role
    WHEN 'admin' THEN
      user_permissions := '["manage_users", "manage_sales", "manage_commissions", "manage_policies", "view_reports", "export_data", "manage_system", "view_audit_logs"]'::jsonb;
    WHEN 'gestor' THEN
      user_permissions := '["manage_sales", "manage_commissions", "view_reports", "export_data"]'::jsonb;
    WHEN 'vendas' THEN
      user_permissions := '["manage_sales", "view_reports"]'::jsonb;
    ELSE
      user_permissions := '["view_sales", "view_policies"]'::jsonb;
  END CASE;

  -- Criar perfil do usuário
  INSERT INTO users (
    id,
    email,
    full_name,
    role,
    is_active,
    tenant_id,
    permissions,
    metadata
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    user_role::user_role,
    true,
    default_tenant_id,
    user_permissions,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    tenant_id = EXCLUDED.tenant_id,
    permissions = EXCLUDED.permissions,
    metadata = EXCLUDED.metadata,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro (em produção, você pode querer usar uma tabela de logs)
    RAISE LOG 'Erro ao criar perfil do usuário %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Políticas RLS para permitir criação de usuários
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;
CREATE POLICY "Allow user creation during signup" ON users
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Comentário com instruções para criar usuário demo
/*
INSTRUÇÕES PARA CRIAR USUÁRIO DEMO:

1. Vá para o Supabase Dashboard
2. Navegue para Authentication > Users
3. Clique em "Add user"
4. Preencha:
   - Email: demo@olga-ai.com
   - Password: demo123456
   - Email confirm: true (marque como confirmado)
   - User Metadata (opcional):
     {
       "full_name": "Carlos Silva (Demo)",
       "role": "admin"
     }
5. Clique em "Create user"

O trigger handle_new_user() criará automaticamente o perfil na tabela users.
*/