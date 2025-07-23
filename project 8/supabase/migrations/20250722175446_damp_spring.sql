/*
  # Sistema de Recuperação e Comissões

  1. Tabelas
    - `recovery_campaigns` - Campanhas de recuperação de vendas
    - `commissions` - Comissões por venda
    - `commission_rules` - Regras de cálculo de comissão

  2. Segurança
    - RLS habilitado
    - Controle de acesso por perfil
    - Auditoria de alterações
*/

-- Enums para recovery e commissions
CREATE TYPE recovery_status AS ENUM ('ativo', 'pausado', 'concluido', 'cancelado');
CREATE TYPE commission_status AS ENUM ('pendente', 'aprovada', 'paga', 'rejeitada');

-- Tabela de campanhas de recuperação
CREATE TABLE IF NOT EXISTS recovery_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  sale_id uuid REFERENCES sales(id),
  status recovery_status DEFAULT 'ativo',
  trigger_reason text NOT NULL,
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  next_attempt_at timestamptz,
  success boolean DEFAULT false,
  success_at timestamptz,
  recovery_value decimal(10,2),
  campaign_type text DEFAULT 'abandono', -- 'abandono', 'pagamento_falhou', 'checkout_expirado'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de comissões
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  amount decimal(10,2) NOT NULL,
  percentage decimal(5,2) NOT NULL,
  base_value decimal(10,2) NOT NULL,
  status commission_status DEFAULT 'pendente',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de regras de comissão
CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  user_role user_role,
  percentage decimal(5,2) NOT NULL,
  min_amount decimal(10,2) DEFAULT 0,
  max_amount decimal(10,2),
  conditions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_recovery_campaigns_lead_id ON recovery_campaigns(lead_id);
CREATE INDEX IF NOT EXISTS idx_recovery_campaigns_status ON recovery_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_recovery_campaigns_next_attempt ON recovery_campaigns(next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_commissions_sale_id ON commissions(sale_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commission_rules_product_id ON commission_rules(product_id);

-- RLS
ALTER TABLE recovery_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- Políticas para recovery_campaigns
CREATE POLICY "Authenticated users can read recovery campaigns"
  ON recovery_campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operadores can manage recovery campaigns"
  ON recovery_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador', 'vendas')
    )
  );

-- Políticas para commissions
CREATE POLICY "Users can read own commissions"
  ON commissions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Gestores can manage commissions"
  ON commissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Políticas para commission_rules
CREATE POLICY "Authenticated users can read commission rules"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage commission rules"
  ON commission_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers
CREATE TRIGGER update_recovery_campaigns_updated_at
  BEFORE UPDATE ON recovery_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_rules_updated_at
  BEFORE UPDATE ON commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular comissão automaticamente
CREATE OR REPLACE FUNCTION calculate_commission(sale_id_param uuid)
RETURNS void AS $$
DECLARE
  sale_record sales%ROWTYPE;
  rule_record commission_rules%ROWTYPE;
  commission_amount decimal(10,2);
  seller_role user_role;
BEGIN
  -- Buscar dados da venda
  SELECT * INTO sale_record
  FROM sales
  WHERE id = sale_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Buscar role do vendedor
  SELECT role INTO seller_role
  FROM users
  WHERE id = sale_record.seller_id;
  
  -- Buscar regra de comissão aplicável
  SELECT * INTO rule_record
  FROM commission_rules
  WHERE product_id = sale_record.product_id
    AND user_role = seller_role
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
    AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
    AND (min_amount IS NULL OR sale_record.value >= min_amount)
    AND (max_amount IS NULL OR sale_record.value <= max_amount)
  ORDER BY percentage DESC
  LIMIT 1;
  
  IF FOUND THEN
    commission_amount := sale_record.value * (rule_record.percentage / 100);
    
    -- Inserir comissão
    INSERT INTO commissions (
      sale_id,
      user_id,
      amount,
      percentage,
      base_value,
      status
    ) VALUES (
      sale_id_param,
      sale_record.seller_id,
      commission_amount,
      rule_record.percentage,
      sale_record.value,
      'pendente'
    );
  END IF;
END;
$$ language plpgsql;

-- Trigger para calcular comissão quando venda é paga
CREATE OR REPLACE FUNCTION trigger_commission_calculation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pago' AND OLD.status != 'pago' AND NEW.seller_id IS NOT NULL THEN
    PERFORM calculate_commission(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER calculate_commission_on_sale
  AFTER UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION trigger_commission_calculation();