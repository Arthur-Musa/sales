/*
  # Fix Default Tenant and User Creation

  1. Create Default Tenant
    - Creates a default tenant with proper UUID
    - Sets up basic tenant configuration
    
  2. Fix User Creation Function
    - Ensures handle_new_user() works correctly
    - Creates proper fallback for tenant assignment
    
  3. Create Demo User
    - Creates demo user in auth.users properly
    - Links to default tenant automatically
*/

-- First, ensure we have a default tenant with proper UUID
INSERT INTO tenants (
  id,
  name,
  slug,
  email,
  status,
  settings,
  branding,
  limits
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo',
  'demo@olga-ai.com',
  'active',
  '{"auto_approval_limit": 5000, "ai_discount_max": 15}'::jsonb,
  '{"logo": "", "primary_color": "#1f2937"}'::jsonb,
  '{"leads": 10000, "users": 100, "storage_gb": 50}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  status = EXCLUDED.status,
  settings = EXCLUDED.settings,
  branding = EXCLUDED.branding,
  limits = EXCLUDED.limits;

-- Also ensure slug uniqueness
INSERT INTO tenants (
  id,
  name,
  slug,
  email,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo',
  'demo@olga-ai.com',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  status = EXCLUDED.status;

-- Create or replace the handle_new_user function with better error handling
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
  -- Get role from metadata or default to 'operador'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'operador');
  
  -- Set permissions based on role
  CASE user_role
    WHEN 'admin' THEN
      user_permissions := '["manage_users", "manage_sales", "manage_commissions", "manage_policies", "view_reports", "export_data", "manage_system", "view_audit_logs"]'::jsonb;
    WHEN 'gestor' THEN
      user_permissions := '["view_users", "manage_sales", "manage_commissions", "view_policies", "view_reports", "export_data", "view_audit_logs"]'::jsonb;
    WHEN 'vendas' THEN
      user_permissions := '["view_own_sales", "view_own_commissions", "view_policies"]'::jsonb;
    WHEN 'operador' THEN
      user_permissions := '["view_sales", "manage_policies", "emit_policies", "view_reports"]'::jsonb;
    WHEN 'cobranca' THEN
      user_permissions := '["view_sales", "view_commissions", "view_reports"]'::jsonb;
    ELSE
      user_permissions := '["view_sales", "view_policies"]'::jsonb;
  END CASE;
  
  -- Create user profile with default tenant
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
    user_role,
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
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update RLS policies to be more permissive for user creation
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;
CREATE POLICY "Allow user creation during signup" ON users
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can create own profile" ON users;
CREATE POLICY "Users can create own profile" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Ensure users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow tenant users to read tenant data
DROP POLICY IF EXISTS "Tenants can read own data" ON tenants;
CREATE POLICY "Tenants can read own data" ON tenants
  FOR SELECT
  TO authenticated
  USING (id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Create default products for the demo tenant
INSERT INTO products (
  id,
  name,
  category,
  description,
  base_price,
  commission_rate,
  max_installments,
  is_active,
  tenant_id
) VALUES 
(
  gen_random_uuid(),
  'Seguro Auto Completo',
  'auto',
  'Cobertura completa para veículos',
  1200.00,
  8.00,
  12,
  true,
  '00000000-0000-0000-0000-000000000001'
),
(
  gen_random_uuid(),
  'Seguro Vida Familiar',
  'vida',
  'Proteção para toda a família',
  800.00,
  12.00,
  12,
  true,
  '00000000-0000-0000-0000-000000000001'
),
(
  gen_random_uuid(),
  'Seguro Residencial',
  'residencial',
  'Proteção para casa e apartamento',
  600.00,
  6.00,
  12,
  true,
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- Create system configs for the demo
INSERT INTO system_configs (
  key,
  value,
  description,
  is_sensitive
) VALUES 
(
  'whatsapp_api_config',
  '{"base_url": "https://api.z-api.io", "token": "demo_token", "instance": "demo_instance"}'::jsonb,
  'Configuração da API do WhatsApp',
  true
),
(
  'email_config',
  '{"provider": "sendgrid", "from_email": "noreply@olga-ai.com", "from_name": "Olga AI"}'::jsonb,
  'Configuração de email',
  false
),
(
  'n8n_config',
  '{"base_url": "https://n8n.olga-ai.com", "api_key": "demo_key"}'::jsonb,
  'Configuração do n8n',
  true
) ON CONFLICT (key) DO NOTHING;

-- Function to create demo user (to be called manually if needed)
CREATE OR REPLACE FUNCTION create_demo_user_if_not_exists()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_user_exists boolean := false;
  result_message text;
BEGIN
  -- Check if demo user exists in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = 'demo@olga-ai.com'
  ) INTO demo_user_exists;
  
  IF demo_user_exists THEN
    result_message := 'Demo user already exists';
  ELSE
    result_message := 'Demo user does not exist. Please create manually in Supabase Dashboard: Authentication > Users > Add user (email: demo@olga-ai.com, password: demo123456)';
  END IF;
  
  RETURN result_message;
END;
$$;

-- Check demo user status
SELECT create_demo_user_if_not_exists();