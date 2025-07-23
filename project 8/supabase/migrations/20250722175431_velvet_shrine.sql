/*
  # Sistema WhatsApp

  1. Tabelas
    - `whatsapp_conversations` - Conversas ativas
    - `whatsapp_messages` - Histórico de mensagens
    - `whatsapp_templates` - Templates de mensagem

  2. Segurança
    - RLS habilitado
    - Logs de todas as interações
    - Controle de acesso por perfil
*/

-- Enums para WhatsApp
CREATE TYPE conversation_status AS ENUM ('active', 'paused', 'closed', 'abandoned');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_type AS ENUM ('text', 'image', 'document', 'audio', 'video', 'location', 'template');

-- Tabela de conversas WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  lead_id uuid REFERENCES leads(id),
  phone text NOT NULL,
  status conversation_status DEFAULT 'active',
  ai_active boolean DEFAULT true,
  ai_confidence decimal(3,2) DEFAULT 0.0,
  last_message_at timestamptz DEFAULT now(),
  assigned_to uuid REFERENCES users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  message_id text, -- ID da mensagem no WhatsApp
  direction message_direction NOT NULL,
  type message_type DEFAULT 'text',
  content text,
  media_url text,
  template_name text,
  template_params jsonb,
  timestamp timestamptz DEFAULT now(),
  delivered boolean DEFAULT false,
  read boolean DEFAULT false,
  failed boolean DEFAULT false,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Tabela de templates WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL, -- 'onboarding', 'qualification', 'proposal', 'payment', 'recovery', 'policy'
  content text NOT NULL,
  variables jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  success_rate decimal(5,2) DEFAULT 0.0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_client_id ON whatsapp_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_templates(category);

-- RLS
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_conversations
CREATE POLICY "Authenticated users can read conversations"
  ON whatsapp_conversations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operadores can manage conversations"
  ON whatsapp_conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'operador', 'vendas')
    )
  );

-- Políticas para whatsapp_messages
CREATE POLICY "Authenticated users can read messages"
  ON whatsapp_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create messages"
  ON whatsapp_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para whatsapp_templates
CREATE POLICY "Authenticated users can read templates"
  ON whatsapp_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores can manage templates"
  ON whatsapp_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Triggers
CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();