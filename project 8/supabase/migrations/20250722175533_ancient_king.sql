/*
  # Dados Iniciais do Sistema

  1. Produtos padrão de seguro
  2. Templates de mensagem WhatsApp
  3. Configurações do sistema
  4. Regras de comissão padrão
  5. Usuário admin inicial
*/

-- Inserir produtos padrão
INSERT INTO products (name, category, description, base_price, commission_rate, max_installments, config) VALUES
('Seguro Auto Básico', 'auto', 'Cobertura básica para veículos', 800.00, 0.15, 12, '{"coverage": "basic", "deductible": 1500}'),
('Seguro Auto Completo', 'auto', 'Cobertura completa com assistência 24h', 1200.00, 0.18, 12, '{"coverage": "comprehensive", "deductible": 1000}'),
('Seguro Vida Individual', 'vida', 'Proteção individual com cobertura básica', 500.00, 0.20, 12, '{"coverage_amount": 100000, "beneficiaries": 2}'),
('Seguro Vida Familiar', 'vida', 'Proteção familiar completa', 800.00, 0.22, 12, '{"coverage_amount": 250000, "beneficiaries": 4}'),
('Seguro Residencial Básico', 'residencial', 'Proteção básica para residências', 600.00, 0.16, 12, '{"coverage": "fire_theft", "max_value": 200000}'),
('Seguro Residencial Completo', 'residencial', 'Proteção completa com assistência', 900.00, 0.19, 12, '{"coverage": "comprehensive", "max_value": 500000}'),
('Seguro Empresarial PME', 'empresarial', 'Proteção para pequenas e médias empresas', 1500.00, 0.25, 12, '{"coverage": "basic_commercial", "employees": 50}'),
('Seguro Viagem Nacional', 'viagem', 'Cobertura para viagens nacionais', 150.00, 0.30, 1, '{"coverage": "national", "duration": 30}'),
('Seguro Viagem Internacional', 'viagem', 'Cobertura para viagens internacionais', 300.00, 0.35, 1, '{"coverage": "international", "duration": 30}');

-- Inserir regras de comissão padrão
INSERT INTO commission_rules (product_id, user_role, percentage, min_amount, conditions, created_by) 
SELECT 
  p.id,
  'vendas'::user_role,
  CASE 
    WHEN p.category = 'auto' THEN 15.0
    WHEN p.category = 'vida' THEN 20.0
    WHEN p.category = 'residencial' THEN 16.0
    WHEN p.category = 'empresarial' THEN 25.0
    WHEN p.category = 'viagem' THEN 30.0
  END,
  0,
  '{"auto_approval": true}',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM products p;

-- Inserir templates de mensagem WhatsApp
INSERT INTO whatsapp_templates (name, category, content, variables) VALUES
('onboarding_inicial', 'onboarding', 
'👋 Olá! Sou a Olga, sua assistente de seguros! Posso te ajudar com:

🚗 Seguro Auto
🏠 Seguro Residencial  
❤️ Seguro de Vida
✈️ Seguro Viagem

O que você precisa hoje?', '[]'),

('qualificacao_auto', 'qualification',
'🚙 Perfeito! Para cotar seu seguro auto, preciso de algumas informações:

1️⃣ Qual o modelo e ano do seu {{vehicle_type}}?
2️⃣ Qual seu CEP?
3️⃣ Você tem garage?
4️⃣ Já teve sinistros nos últimos 3 anos?

Me conte essas informações para gerar sua cotação! 😊', '["vehicle_type"]'),

('proposta_enviada', 'proposal',
'🎉 {{client_name}}, sua proposta está pronta!

📋 {{product_name}}
💰 {{value}}
📅 {{installments}}

✅ Cobertura: {{coverage}}
🏢 Seguradora: {{insurer}}

Quer prosseguir com esta proposta?', '["client_name", "product_name", "value", "installments", "coverage", "insurer"]'),

('link_pagamento', 'payment',
'💳 {{client_name}}, finalize seu seguro agora!

📋 {{product_name}}
💰 {{value}}

👇 Clique aqui para pagar:
{{payment_link}}

✅ PIX (instantâneo)
💳 Cartão (parcelado)

Após o pagamento, sua apólice é emitida automaticamente! 🚀', '["client_name", "product_name", "value", "payment_link"]'),

('apolice_emitida', 'policy',
'🎉 Parabéns {{client_name}}! Seu seguro foi aprovado!

📄 Apólice: {{policy_number}}
🏢 Seguradora: {{insurer}}
📅 Vigência: {{start_date}} a {{end_date}}

📎 Sua apólice: {{policy_url}}

Seu seguro já está ativo! Para dúvidas, é só responder aqui. 😊', '["client_name", "policy_number", "insurer", "start_date", "end_date", "policy_url"]'),

('recuperacao_abandono_1', 'recovery',
'Oi {{client_name}}! 👋 

Notei que você não concluiu sua cotação de seguro. Precisa de ajuda? 

Sua cotação está guardada e você pode finalizar em 2 minutos! 

É só responder aqui 😊', '["client_name"]'),

('recuperacao_pagamento_falhou', 'recovery',
'Opa {{client_name}}! 😅 

Parece que houve um probleminha no pagamento. Vamos tentar novamente? 

Posso gerar um novo link de pagamento agora mesmo! ⚡', '["client_name"]'),

('segunda_via_apolice', 'policy',
'📄 {{client_name}}, aqui está sua apólice:

🔢 Número: {{policy_number}}
📅 Vigência: {{start_date}} a {{end_date}}

📎 {{policy_url}}

Precisa de mais alguma coisa?', '["client_name", "policy_number", "start_date", "end_date", "policy_url"]');

-- Inserir configurações do sistema
INSERT INTO system_configs (key, value, description, is_sensitive) VALUES
('whatsapp_api_config', '{"base_url": "", "token": "", "instance_id": ""}', 'Configurações da API do WhatsApp (Z-API)', true),
('stripe_config', '{"public_key": "", "webhook_secret": ""}', 'Configurações do Stripe', true),
('ai_config', '{"confidence_threshold": 0.7, "auto_response": true, "escalation_threshold": 0.3}', 'Configurações da IA', false),
('business_hours', '{"start": "08:00", "end": "18:00", "timezone": "America/Sao_Paulo", "days": [1,2,3,4,5]}', 'Horário de funcionamento', false),
('email_config', '{"smtp_host": "", "smtp_port": 587, "username": "", "password": ""}', 'Configurações de email', true),
('company_info', '{"name": "Olga AI", "cnpj": "50.707.445/0001-84", "address": "WeWork - Av. das Nações Unidas, 14261, São Paulo - SP", "phone": "(11) 97825-9695", "email": "contato@olga-ai.com"}', 'Informações da empresa', false),
('susep_config', '{"registration": "", "compliance_level": "full", "audit_retention_days": 2555}', 'Configurações SUSEP', false),
('lgpd_config', '{"data_retention_days": 1825, "consent_required": true, "anonymization_enabled": true}', 'Configurações LGPD', false);

-- Inserir usuário admin padrão (será criado via auth.users)
-- Este será criado automaticamente quando o primeiro usuário se registrar com role 'admin'

-- Inserir dados de exemplo para demonstração
INSERT INTO clients (cpf_cnpj, full_name, email, phone, lgpd_consent, lgpd_consent_date) VALUES
('123.456.789-00', 'Maria José Silva', 'maria.jose@email.com', '+5511999999999', true, now()),
('987.654.321-00', 'João Santos Oliveira', 'joao.santos@email.com', '+5511888888888', true, now()),
('456.789.123-00', 'Ana Costa Lima', 'ana.costa@email.com', '+5511777777777', true, now()),
('789.123.456-00', 'Pedro Martins', 'pedro.martins@email.com', '+5511666666666', true, now()),
('321.654.987-00', 'Lucia Fernandes', 'lucia.fernandes@email.com', '+5511555555555', true, now());

-- Inserir leads de exemplo
INSERT INTO leads (client_id, phone, status, product_interest, ai_score, ai_confidence, source)
SELECT 
  c.id,
  c.phone,
  CASE 
    WHEN c.full_name = 'Maria José Silva' THEN 'pago'::lead_status
    WHEN c.full_name = 'João Santos Oliveira' THEN 'perdido'::lead_status
    WHEN c.full_name = 'Ana Costa Lima' THEN 'aguardando_pagamento'::lead_status
    WHEN c.full_name = 'Pedro Martins' THEN 'qualificado'::lead_status
    ELSE 'novo'::lead_status
  END,
  CASE 
    WHEN c.full_name = 'Maria José Silva' THEN 'Seguro Auto'
    WHEN c.full_name = 'João Santos Oliveira' THEN 'Seguro Vida'
    WHEN c.full_name = 'Ana Costa Lima' THEN 'Seguro Residencial'
    WHEN c.full_name = 'Pedro Martins' THEN 'Seguro Auto'
    ELSE 'Seguro Vida'
  END,
  CASE 
    WHEN c.full_name = 'Maria José Silva' THEN 95
    WHEN c.full_name = 'João Santos Oliveira' THEN 72
    WHEN c.full_name = 'Ana Costa Lima' THEN 87
    WHEN c.full_name = 'Pedro Martins' THEN 89
    ELSE 65
  END,
  CASE 
    WHEN c.full_name = 'Maria José Silva' THEN 0.95
    WHEN c.full_name = 'João Santos Oliveira' THEN 0.72
    WHEN c.full_name = 'Ana Costa Lima' THEN 0.87
    WHEN c.full_name = 'Pedro Martins' THEN 0.89
    ELSE 0.65
  END,
  'whatsapp'
FROM clients c;