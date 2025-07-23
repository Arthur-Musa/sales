/*
  # Leads e Vendas

  1. Tabelas
    - `leads` - Leads capturados via WhatsApp/outros canais
    - `sales` - Propostas e vendas convertidas
    - `lead_interactions` - Histórico de interações

  2. Segurança
    - RLS habilitado
    - Controle por perfil de usuário
    - Auditoria de alterações
*/

-- Enums para status
CREATE TYPE lead_status AS ENUM ('novo', 'qualificado', 'proposta_enviada', 'aguardando_pagamento', 'pago', 'perdido', 'abandonado');
CREATE TYPE sale_status AS ENUM ('lead', 'qualificado', 'proposta', 'aguardando_pagamento', 'pago', 'perdido', 'pendente', 'cancelado');
CREATE TYPE interaction_type AS ENUM ('whatsapp', 'email', 'telefone', 'sistema');

-- Tabela de leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  phone text NOT NULL,
  source text DEFAULT 'whatsapp',
  status lead_status DEFAULT 'novo',
  product_interest text,
  ai_score integer DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_confidence decimal(3,2) DEFAULT 0.0 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  assigned_to uuid REFERENCES users(id),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de vendas/propostas
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  client_id uuid REFERENCES clients(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  status sale_status DEFAULT 'lead',
  value decimal(10,2) NOT NULL,
  installments integer DEFAULT 1,
  installment_value decimal(10,2),
  coverage_details jsonb DEFAULT '{}',
  loss_reason text,
  seller_id uuid REFERENCES users(id),
  seller_type text DEFAULT 'ia',
  conversion_time interval,
  proposal_sent_at timestamptz,
  payment_link_sent_at timestamptz,
  closed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de interações com leads
CREATE TABLE IF NOT EXISTS lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type interaction_type NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content text,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas para leads
CREATE POLICY "Authenticated users can read leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operadores can manage leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador', 'vendas')
    )
  );

-- Políticas para sales
CREATE POLICY "Authenticated users can read sales"
  ON sales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operadores can manage sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador', 'vendas')
    )
  );

-- Políticas para lead_interactions
CREATE POLICY "Authenticated users can read interactions"
  ON lead_interactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operadores can create interactions"
  ON lead_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador', 'vendas')
    )
  );

-- Triggers
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular tempo de conversão
CREATE OR REPLACE FUNCTION calculate_conversion_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    NEW.conversion_time = NEW.updated_at - NEW.created_at;
    NEW.closed_at = NEW.updated_at;
  END IF;
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER calculate_sale_conversion_time
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION calculate_conversion_time();