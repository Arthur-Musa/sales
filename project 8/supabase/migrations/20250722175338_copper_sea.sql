/*
  # Clientes e Produtos

  1. Tabelas
    - `clients` - Dados dos clientes (LGPD compliant)
    - `products` - Catálogo de produtos de seguro
    - `product_rules` - Regras de negócio por produto

  2. Segurança
    - RLS habilitado
    - Controle de acesso por perfil
    - Logs de acesso a dados sensíveis
*/

-- Enum para tipos de pessoa
CREATE TYPE person_type AS ENUM ('fisica', 'juridica');

-- Enum para categorias de produto
CREATE TYPE product_category AS ENUM ('auto', 'vida', 'residencial', 'empresarial', 'viagem');

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf_cnpj text UNIQUE,
  person_type person_type DEFAULT 'fisica',
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  birth_date date,
  gender text,
  address jsonb,
  lgpd_consent boolean DEFAULT false,
  lgpd_consent_date timestamptz,
  lgpd_consent_ip text,
  marketing_consent boolean DEFAULT false,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category product_category NOT NULL,
  description text,
  base_price decimal(10,2) NOT NULL,
  commission_rate decimal(5,2) DEFAULT 0.15,
  max_installments integer DEFAULT 12,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de regras de produto
CREATE TABLE IF NOT EXISTS product_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  rule_type text NOT NULL, -- 'pricing', 'eligibility', 'coverage'
  conditions jsonb NOT NULL,
  actions jsonb NOT NULL,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON clients(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_rules ENABLE ROW LEVEL SECURITY;

-- Políticas para clients
CREATE POLICY "Authenticated users can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operadores can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador', 'vendas')
    )
  );

CREATE POLICY "Operadores can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador', 'vendas')
    )
  );

-- Políticas para products
CREATE POLICY "All authenticated users can read products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para product_rules
CREATE POLICY "All authenticated users can read product rules"
  ON product_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage product rules"
  ON product_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_rules_updated_at
  BEFORE UPDATE ON product_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();