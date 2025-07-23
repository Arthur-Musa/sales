# Olga - SaaS de Vendas de Seguro via WhatsApp com IA

<p align="center">
  <img src="https://img.shields.io/badge/status-development-yellow" alt="Status">
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

## 📋 Sobre o Projeto

Olga é uma plataforma SaaS revolucionária para corretoras e MGAs que automatiza 100% da jornada de vendas de seguros via WhatsApp, utilizando IA para conversação, integração com Stripe para pagamentos e emissão instantânea de apólices.

### 🎯 Principais Features

- **Conversação IA via WhatsApp** - Bot inteligente que conduz toda a jornada de vendas
- **Pagamento Instantâneo** - Integração Stripe com PIX, cartão e boleto
- **Emissão Automática** - Apólice PDF entregue em até 30 segundos
- **Dashboard Analítico** - KPIs em tempo real e gestão multi-tenant
- **Recuperação de Vendas** - Sistema automatizado de retargeting
- **Compliance Total** - LGPD e SUSEP ready com logs imutáveis

## 🏗️ Arquitetura

```mermaid
graph TB
    subgraph "Cliente"
        WA[WhatsApp]
    end
    
    subgraph "Integrações"
        ZAPI[Z-API/WhatsApp API]
        STRIPE[Stripe API]
        GPT[OpenAI GPT-4]
    end
    
    subgraph "Backend"
        API[API Gateway NestJS]
        QUEUE[BullMQ Jobs]
        DB[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[AWS S3]
    end
    
    subgraph "Frontend"
        DASH[Dashboard Next.js]
    end
    
    WA <--> ZAPI
    ZAPI <--> API
    API <--> STRIPE
    API <--> GPT
    API <--> DB
    API <--> REDIS
    API <--> QUEUE
    API <--> S3
    DASH <--> API
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js >= 20.0.0
- Docker e Docker Compose
- Conta Stripe (desenvolvimento)
- Acesso Z-API ou WhatsApp Business API
- Chave API OpenAI

### Instalação

```bash
# Clone o repositório
git clone https://github.com/arthur-musa/sales.git
cd sales

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie os serviços Docker
docker-compose up -d

# Execute as migrations
npm run db:migrate

# Inicie o ambiente de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/olga"
REDIS_URL="redis://localhost:6379"

# WhatsApp
ZAPI_TOKEN="seu_token_aqui"
ZAPI_INSTANCE="sua_instancia"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="olga-policies"
```

## 📦 Estrutura do Projeto

```
sales/
├── apps/
│   ├── api/                 # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── whatsapp/   # Integração WhatsApp
│   │   │   │   ├── payments/   # Integração Stripe
│   │   │   │   ├── policies/   # Emissão de apólices
│   │   │   │   ├── ai/         # Integração GPT-4
│   │   │   │   └── analytics/  # Métricas e KPIs
│   │   │   ├── shared/
│   │   │   └── main.ts
│   │   └── test/
│   ├── web/                # Dashboard Next.js
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── worker/             # Background jobs
├── packages/
│   ├── database/          # Prisma schemas
│   ├── shared/            # Tipos TypeScript compartilhados
│   └── ui/                # Componentes UI reutilizáveis
├── docker/
├── scripts/
└── docs/
```

## 🔧 Desenvolvimento

### Comandos Principais

```bash
# Desenvolvimento
npm run dev              # Inicia todos os serviços em modo dev
npm run dev:api         # Apenas API
npm run dev:web         # Apenas Dashboard
npm run dev:worker      # Apenas Worker

# Database
npm run db:migrate      # Executa migrations
npm run db:seed         # Popula dados de teste
npm run db:studio       # Abre Prisma Studio

# Testes
npm run test            # Executa todos os testes
npm run test:e2e        # Testes end-to-end
npm run test:coverage   # Relatório de cobertura

# Build
npm run build           # Build de produção
npm run start           # Inicia em produção
```

### Fluxo de Desenvolvimento

1. Crie uma branch a partir de `develop`
2. Faça suas alterações seguindo os padrões do projeto
3. Escreva/atualize testes
4. Commit usando Conventional Commits
5. Abra um Pull Request

## 📊 APIs e Endpoints

### Autenticação
```http
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

### WhatsApp Webhooks
```http
POST   /api/webhooks/whatsapp/message
POST   /api/webhooks/whatsapp/status
```

### Pagamentos
```http
POST   /api/payments/create-session
POST   /api/webhooks/stripe
GET    /api/payments/:id
```

### Apólices
```http
POST   /api/policies/generate
GET    /api/policies/:id
GET    /api/policies/:id/download
```

### Analytics
```http
GET    /api/analytics/dashboard
GET    /api/analytics/funnel
GET    /api/analytics/recovery
```

## 🧪 Testes

O projeto utiliza Jest para testes unitários e Cypress para E2E:

```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E (requer ambiente rodando)
npm run test:e2e

# Cobertura
npm run test:coverage
```

Mínimo de cobertura exigido: **80%**

## 📈 Monitoramento

- **Logs**: Estruturados em JSON, agregados via Datadog
- **Métricas**: Prometheus + Grafana
- **Uptime**: Monitoramento 24/7 com alertas
- **APM**: Rastreamento de performance

## 🔐 Segurança

- Autenticação JWT com refresh tokens
- Rate limiting por IP/usuário
- Validação de entrada com class-validator
- Sanitização de dados
- Criptografia AES-256 para dados sensíveis
- Logs de auditoria imutáveis
- Compliance LGPD/SUSEP

## 🚢 Deploy

### Produção

```bash
# Build da imagem Docker
docker build -t olga-api .

# Deploy via Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Ou via Kubernetes
kubectl apply -f k8s/
```

### Ambientes

- **Development**: Local com hot-reload
- **Staging**: Réplica de produção para testes
- **Production**: Ambiente principal com HA

## 📝 Roadmap

- [x] Fase 1: Integração WhatsApp + IA
- [x] Fase 2: Stripe Payment
- [x] Fase 3: Emissão Apólice/PDF
- [ ] Fase 4: Dashboard Web
- [ ] Fase 5: Recuperação Vendas
- [ ] Fase 6: QA Final e Compliance

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Time

- **Tech Lead**: Arthur Musa
- **Backend**: TBD
- **Frontend**: TBD
- **DevOps**: TBD

## 📞 Suporte

- Email: suporte@olga.ai
- Docs: [https://docs.olga.ai](https://docs.olga.ai)
- Status: [https://status.olga.ai](https://status.olga.ai)

---

<p align="center">Made with ❤️ by Arthur Musa</p>
