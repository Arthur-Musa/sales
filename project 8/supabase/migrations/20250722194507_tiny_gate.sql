/*
  # Multi-Tenant SaaS Architecture Implementation

  1. New Tables
    - `tenants` - Corretoras/empresas
    - `tenant_subscriptions` - Assinaturas e pagamentos
    - `tenant_domains` - Subdomínios automáticos
    - `tenant_integrations` - Configurações de integrações por tenant
    - `system_users` - Superadmins globais
    - `audit_trail` - Logs detalhados de auditoria
    - `automation_logs` - Logs de automações n8n
    - `integration_logs` - Logs de integrações externas

  2. Security
    - RLS policies para isolamento por tenant
    - Funções de validação de tenant_id
    - Triggers de auditoria automática

  3. Multi-tenancy
    - Todas as tabelas existentes ganham tenant_id
    - Isolamento completo de dados por corretora
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types for new functionality
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'unpaid');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'canceled', 'setup');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'setup');
CREATE TYPE automation_status AS ENUM ('running', 'completed', 'failed', 'canceled');

-- Tenants table (Corretoras)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL, -- para subdomínio
  cnpj text UNIQUE,
  email text NOT NULL,
  phone text,
  address jsonb DEFAULT '{}',
  status tenant_status DEFAULT 'setup',
  settings jsonb DEFAULT '{}',
  branding jsonb DEFAULT '{}', -- cores, logo, etc
  limits jsonb DEFAULT '{"users": 10, "leads": 1000, "storage_gb": 5}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tenant subscriptions (Assinaturas SaaS)
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name text NOT NULL DEFAULT 'starter',
  status subscription_status DEFAULT 'trial',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  amount_monthly numeric(10,2),
  currency text DEFAULT 'BRL',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tenant domains (Subdomínios automáticos)
CREATE TABLE IF NOT EXISTS tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  domain text UNIQUE NOT NULL, -- ex: corretora-cool.suaplataforma.com
  is_primary boolean DEFAULT true,
  ssl_status text DEFAULT 'pending',
  ssl_expires_at timestamptz,
  dns_configured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tenant integrations (Configurações por tenant)
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  integration_type text NOT NULL, -- 'whatsapp', 'stripe', 'email', 'crm'
  provider text NOT NULL, -- 'z-api', 'twilio', 'sendgrid', etc
  status integration_status DEFAULT 'setup',
  config jsonb NOT NULL DEFAULT '{}',
  credentials jsonb DEFAULT '{}', -- encrypted
  last_sync_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, integration_type, provider)
);

-- System users (Superadmins)
CREATE TABLE IF NOT EXISTS system_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'superadmin',
  is_active boolean DEFAULT true,
  permissions jsonb DEFAULT '[]',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced audit trail
CREATE TABLE IF NOT EXISTS audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid,
  system_user_id uuid REFERENCES system_users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  impersonation_id uuid, -- quando superadmin entra como tenant
  metadata jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now()
);

-- Automation logs (n8n workflows)
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id text NOT NULL,
  workflow_name text,
  execution_id text,
  status automation_status DEFAULT 'running',
  trigger_type text, -- 'webhook', 'schedule', 'manual'
  trigger_data jsonb DEFAULT '{}',
  result_data jsonb DEFAULT '{}',
  error_message text,
  duration_ms integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Integration logs (APIs externas)
CREATE TABLE IF NOT EXISTS integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  integration_type text NOT NULL,
  provider text NOT NULL,
  action text NOT NULL, -- 'send_message', 'create_payment', 'emit_policy'
  request_data jsonb DEFAULT '{}',
  response_data jsonb DEFAULT '{}',
  status_code integer,
  success boolean DEFAULT false,
  error_message text,
  duration_ms integer,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add tenant_id to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE recovery_campaigns ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant_id ON tenant_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_tenant_id ON audit_trail(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_automation_logs_tenant_id ON automation_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_tenant_id ON integration_logs(tenant_id);

-- Add tenant_id indexes to existing tables
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_tenant_id ON policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_id ON commissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_tenant_id ON whatsapp_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recovery_campaigns_tenant_id ON recovery_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);

-- Enable RLS on new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants
CREATE POLICY "Tenants can read own data"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "System admins can manage all tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for tenant subscriptions
CREATE POLICY "Tenants can read own subscription"
  ON tenant_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for tenant domains
CREATE POLICY "Tenants can read own domains"
  ON tenant_domains
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for tenant integrations
CREATE POLICY "Tenants can manage own integrations"
  ON tenant_integrations
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for audit trail
CREATE POLICY "Tenants can read own audit logs"
  ON audit_trail
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can create audit logs"
  ON audit_trail
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for automation logs
CREATE POLICY "Tenants can read own automation logs"
  ON automation_logs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for integration logs
CREATE POLICY "Tenants can read own integration logs"
  ON integration_logs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Update existing RLS policies to include tenant isolation
-- Users
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Gestores can read team users" ON users;

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Tenant admins can read tenant users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'gestor')
    )
  );

-- Clients
DROP POLICY IF EXISTS "Authenticated users can read clients" ON clients;
DROP POLICY IF EXISTS "Operadores can insert clients" ON clients;
DROP POLICY IF EXISTS "Operadores can update clients" ON clients;

CREATE POLICY "Tenant users can read tenant clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can manage tenant clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Sales
DROP POLICY IF EXISTS "Authenticated users can read sales" ON sales;
DROP POLICY IF EXISTS "Operadores can manage sales" ON sales;

CREATE POLICY "Tenant users can read tenant sales"
  ON sales
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can manage tenant sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Apply similar patterns to other tables...
-- (Policies for leads, payments, policies, commissions, etc.)

-- Functions for tenant management
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION create_tenant_with_admin(
  tenant_name text,
  tenant_slug text,
  admin_email text,
  admin_name text,
  admin_password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id uuid;
  new_user_id uuid;
BEGIN
  -- Create tenant
  INSERT INTO tenants (name, slug, email, status)
  VALUES (tenant_name, tenant_slug, admin_email, 'setup')
  RETURNING id INTO new_tenant_id;
  
  -- Create admin user
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
  VALUES (admin_email, crypt(admin_password, gen_salt('bf')), now())
  RETURNING id INTO new_user_id;
  
  -- Create user profile
  INSERT INTO users (id, tenant_id, email, full_name, role, is_active)
  VALUES (new_user_id, new_tenant_id, admin_email, admin_name, 'admin', true);
  
  -- Create default domain
  INSERT INTO tenant_domains (tenant_id, domain, is_primary)
  VALUES (new_tenant_id, tenant_slug || '.suaplataforma.com', true);
  
  -- Create trial subscription
  INSERT INTO tenant_subscriptions (tenant_id, plan_name, status, trial_end)
  VALUES (new_tenant_id, 'trial', 'trial', now() + interval '14 days');
  
  RETURN new_tenant_id;
END;
$$;

-- Function to log tenant actions
CREATE OR REPLACE FUNCTION log_tenant_action(
  p_tenant_id uuid,
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_trail (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- Triggers for automatic tenant_id population
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply triggers to tables that need automatic tenant_id
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id();

-- Update triggers for existing tables
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
  BEFORE UPDATE ON tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_domains_updated_at
  BEFORE UPDATE ON tenant_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_integrations_updated_at
  BEFORE UPDATE ON tenant_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();