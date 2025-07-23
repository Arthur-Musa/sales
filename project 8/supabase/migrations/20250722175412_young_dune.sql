/*
  # Pagamentos e Apólices

  1. Tabelas
    - `payments` - Transações de pagamento via Stripe
    - `policies` - Apólices emitidas automaticamente
    - `policy_documents` - Documentos gerados

  2. Segurança
    - RLS habilitado
    - Auditoria completa de transações
    - Controle de acesso a documentos
*/

-- Enums para status
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'canceled', 'refunded');
CREATE TYPE policy_status AS ENUM ('processando', 'emitida', 'entregue', 'erro', 'cancelada');

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  stripe_checkout_session_id text UNIQUE,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'BRL',
  status payment_status DEFAULT 'pending',
  payment_method text,
  stripe_fee decimal(10,2),
  net_amount decimal(10,2),
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de apólices
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_number text UNIQUE NOT NULL,
  sale_id uuid REFERENCES sales(id) NOT NULL,
  client_id uuid REFERENCES clients(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  status policy_status DEFAULT 'processando',
  insurer text NOT NULL,
  coverage_start_date date NOT NULL,
  coverage_end_date date NOT NULL,
  pdf_url text,
  pdf_generated_at timestamptz,
  emission_time interval,
  delivery_whatsapp boolean DEFAULT false,
  delivery_email boolean DEFAULT false,
  delivery_attempts integer DEFAULT 0,
  last_delivery_attempt timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de documentos de apólice
CREATE TABLE IF NOT EXISTS policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES policies(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- 'policy', 'certificate', 'endorsement'
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_client_id ON policies(client_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policy_documents_policy_id ON policy_documents(policy_id);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;

-- Políticas para payments
CREATE POLICY "Authenticated users can read payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador')
    )
  );

-- Políticas para policies
CREATE POLICY "Authenticated users can read policies"
  ON policies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operadores can manage policies"
  ON policies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador')
    )
  );

-- Políticas para policy_documents
CREATE POLICY "Authenticated users can read policy documents"
  ON policy_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage policy documents"
  ON policy_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador')
    )
  );

-- Triggers
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de apólice
CREATE OR REPLACE FUNCTION generate_policy_number()
RETURNS text AS $$
DECLARE
  year_suffix text;
  sequence_num text;
BEGIN
  year_suffix := EXTRACT(YEAR FROM now())::text;
  
  SELECT LPAD((COUNT(*) + 1)::text, 8, '0')
  INTO sequence_num
  FROM policies
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now());
  
  RETURN year_suffix || sequence_num;
END;
$$ language plpgsql;

-- Trigger para gerar número de apólice automaticamente
CREATE OR REPLACE FUNCTION set_policy_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.policy_number IS NULL OR NEW.policy_number = '' THEN
    NEW.policy_number := generate_policy_number();
  END IF;
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER set_policy_number_trigger
  BEFORE INSERT ON policies
  FOR EACH ROW
  EXECUTE FUNCTION set_policy_number();