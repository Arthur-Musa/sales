/*
  # Fix User Creation and Lead Management

  1. Database Functions
    - Create function to handle user creation from auth
    - Fix tenant assignment for new users
    - Add lead creation function

  2. Triggers
    - Auto-create user profile on auth signup
    - Set default tenant for new users

  3. Policies
    - Allow user profile creation
    - Allow lead creation for authenticated users
*/

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_tenant_id uuid;
BEGIN
  -- Get or create a default tenant
  SELECT id INTO default_tenant_id 
  FROM tenants 
  WHERE slug = 'default' 
  LIMIT 1;
  
  -- If no default tenant exists, create one
  IF default_tenant_id IS NULL THEN
    INSERT INTO tenants (name, slug, email, status)
    VALUES ('Default Tenant', 'default', 'admin@olga-ai.com', 'active')
    RETURNING id INTO default_tenant_id;
  END IF;

  -- Insert user profile
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    tenant_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operador'),
    true,
    default_tenant_id,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create leads
CREATE OR REPLACE FUNCTION public.create_lead(
  p_phone text,
  p_full_name text DEFAULT NULL,
  p_product_interest text DEFAULT NULL,
  p_source text DEFAULT 'manual'
)
RETURNS uuid AS $$
DECLARE
  v_client_id uuid;
  v_lead_id uuid;
  v_tenant_id uuid;
BEGIN
  -- Get current user's tenant
  SELECT tenant_id INTO v_tenant_id
  FROM users 
  WHERE id = auth.uid();
  
  -- If no tenant, use default
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id 
    FROM tenants 
    WHERE slug = 'default' 
    LIMIT 1;
  END IF;

  -- Find or create client
  SELECT id INTO v_client_id
  FROM clients
  WHERE phone = p_phone AND tenant_id = v_tenant_id;
  
  IF v_client_id IS NULL THEN
    INSERT INTO clients (
      phone,
      full_name,
      tenant_id,
      lgpd_consent,
      created_at,
      updated_at
    )
    VALUES (
      p_phone,
      COALESCE(p_full_name, 'Cliente ' || p_phone),
      v_tenant_id,
      false,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_client_id;
  END IF;

  -- Create lead
  INSERT INTO leads (
    client_id,
    phone,
    source,
    status,
    product_interest,
    ai_score,
    ai_confidence,
    tenant_id,
    created_at,
    updated_at
  )
  VALUES (
    v_client_id,
    p_phone,
    p_source,
    'novo',
    p_product_interest,
    50,
    0.5,
    v_tenant_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_lead_id;

  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Users can create own profile" ON users;
CREATE POLICY "Users can create own profile" ON users
  FOR INSERT 
  WITH CHECK (true); -- Allow system to create profiles

-- Update RLS policies for leads table
DROP POLICY IF EXISTS "Users can create leads" ON leads;
CREATE POLICY "Users can create leads" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    ) OR
    tenant_id = (
      SELECT id FROM tenants WHERE slug = 'default'
    )
  );

-- Update RLS policies for clients table
DROP POLICY IF EXISTS "Users can create clients" ON clients;
CREATE POLICY "Users can create clients" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    ) OR
    tenant_id = (
      SELECT id FROM tenants WHERE slug = 'default'
    )
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_lead TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated;