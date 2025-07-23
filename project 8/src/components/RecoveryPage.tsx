import React, { useState } from 'react';
import { 
  Clock, 
  MessageCircle, 
  CheckCircle, 
  DollarSign, 
  Settings, 
  Plus, 
  Eye, 
  Edit, 
  ExternalLink, 
  Play, 
  Pause, 
  Trash2, 
  Send, 
  X,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface RecoveryCampaign {
  id: string;
  name: string;
  description: string;
  status: 'ativa' | 'pausada' | 'concluida';
  type: 'abandono_pagamento' | 'sem_resposta' | 'cotacao_nao_aceita' | 'retomada_interesse';
  leadsTarget: number;
  messagesSent: number;
  conversions: number;
  conversionRate: number;
  nextSend: string;
  iconColor: string;
  bgColor: string;
}

interface RecoveryLead {
  id: string;
  clientName: string;
  phone: string;
  product: string;
  productDetails: string;
  value: string;
  reason: 'abandono_pagamento' | 'sem_resposta' | 'cotacao_nao_aceita';
  lastAttempt: string;
  status: 'aguardando' | 'programado' | 'recuperado';
  initials: string;
  bgColor: string;
  textColor: string;
}

const campaigns: RecoveryCampaign[] = [
  {
    id: '1',
    name: 'Abandono de Pagamento',
    description: 'Clientes que não finalizaram pagamento',
    status: 'ativa',
    type: 'abandono_pagamento',
    leadsTarget: 47,
    messagesSent: 34,
    conversions: 12,
    conversionRate: 25.5,
    nextSend: 'em 2h',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: '2',
    name: 'Follow-up Qualificação',
    description: 'Leads que pararam na qualificação',
    status: 'ativa',
    type: 'sem_resposta',
    leadsTarget: 89,
    messagesSent: 67,
    conversions: 18,
    conversionRate: 20.2,
    nextSend: 'amanhã 9h',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: '3',
    name: 'Retomada Interesse',
    description: 'Clientes antigos sem atividade',
    status: 'pausada',
    type: 'retomada_interesse',
    leadsTarget: 234,
    messagesSent: 156,
    conversions: 8,
    conversionRate: 5.1,
    nextSend: 'Pausada há 3 dias',
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
];

const recoveryLeads: RecoveryLead[] = [
  {
    id: '1',
    clientName: 'Lucia Costa',
    phone: '(11) 99999-9999',
    product: 'Seguro Auto',
    productDetails: 'Honda Civic',
    value: 'R$ 1.456',
    reason: 'abandono_pagamento',
    lastAttempt: '2h atrás',
    status: 'aguardando',
    initials: 'LC',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600'
  },
  {
    id: '2',
    clientName: 'Pedro Martins',
    phone: '(11) 88888-8888',
    product: 'Seguro Vida',
    productDetails: '500k cobertura',
    value: 'R$ 890',
    reason: 'sem_resposta',
    lastAttempt: '1 dia atrás',
    status: 'programado',
    initials: 'PM',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  {
    id: '3',
    clientName: 'Ana Santos',
    phone: '(11) 77777-7777',
    product: 'Seguro Residencial',
    productDetails: 'Apt 85m²',
    value: 'R$ 2.150',
    reason: 'cotacao_nao_aceita',
    lastAttempt: '3 dias atrás',
    status: 'recuperado',
    initials: 'AS',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600'
  }
];

const reasonConfig = {
  abandono_pagamento: { label: 'Abandono pagamento', color: 'bg-red-100 text-red-800' },
  sem_resposta: { label: 'Sem resposta', color: 'bg-yellow-100 text-yellow-800' },
  cotacao_nao_aceita: { label: 'Cotação não aceita', color: 'bg-purple-100 text-purple-800' }
};

const statusConfig = {
  aguardando: { label: 'Aguardando', color: 'bg-orange-100 text-orange-800' },
  programado: { label: 'Programado', color: 'bg-blue-100 text-blue-800' },
  recuperado: { label: 'Recuperado', color: 'bg-green-100 text-green-800' }
};

export function RecoveryPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [filterReason, setFilterReason] = useState('Todos os motivos');

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'abandono_pagamento':
        return Clock;
      case 'sem_resposta':
        return MessageCircle;
      case 'retomada_interesse':
        return TrendingUp;
      default:
        return Clock;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Recuperação de Vendas</h2>
              <p className="text-gray-600">Campanhas automáticas para recuperar leads e vendas perdidas</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                <Settings className="w-4 h-4" />
                <span>Configurar Campanhas</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                <Plus className="w-4 h-4" />
                <span>Nova Campanha</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded-md">Ativo</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">156</p>
              <p className="text-gray-600 text-sm">Leads para recuperar</p>
            </div>
          </div>

          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-md">+23</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">89</p>
              <p className="text-gray-600 text-sm">Mensagens enviadas hoje</p>
            </div>
          </div>

          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-md">18%</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">34</p>
              <p className="text-gray-600 text-sm">Vendas recuperadas</p>
            </div>
          </div>

          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-medium bg-purple-50 px-2 py-1 rounded-md">+R$ 8.9k</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">R$ 47.2k</p>
              <p className="text-gray-600 text-sm">Valor recuperado</p>
            </div>
          </div>
        </div>

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Campaigns */}
          <div 
            className="lg:col-span-2 p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Campanhas Ativas</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button className="px-3 py-1 bg-white rounded-md text-sm font-medium text-gray-900 shadow-sm">Todas</button>
                  <button className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Automáticas</button>
                  <button className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Manuais</button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const IconComponent = getCampaignIcon(campaign.type);
                
                return (
                  <div 
                    key={campaign.id}
                    className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                      campaign.status === 'pausada' ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${campaign.bgColor} rounded-lg flex items-center justify-center`}>
                          <IconComponent className={`w-5 h-5 ${campaign.iconColor}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                          <p className="text-sm text-gray-600">{campaign.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          campaign.status === 'ativa' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'pausada' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {campaign.status === 'ativa' ? 'Ativa' : 
                           campaign.status === 'pausada' ? 'Pausada' : 'Concluída'}
                        </span>
                        <div className="flex space-x-1">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{campaign.leadsTarget}</div>
                        <div className="text-xs text-gray-600">Leads alvo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{campaign.messagesSent}</div>
                        <div className="text-xs text-gray-600">Mensagens</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{campaign.conversions}</div>
                        <div className="text-xs text-gray-600">Convertidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{campaign.conversionRate}%</div>
                        <div className="text-xs text-gray-600">Taxa</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        {campaign.status === 'pausada' ? campaign.nextSend : `Próximo envio: ${campaign.nextSend}`}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">Ver detalhes</button>
                        {campaign.status === 'ativa' ? (
                          <button className="text-orange-600 hover:text-orange-800 text-xs font-medium">Pausar</button>
                        ) : campaign.status === 'pausada' ? (
                          <>
                            <button className="text-green-600 hover:text-green-800 text-xs font-medium">Reativar</button>
                            <button className="text-red-600 hover:text-red-800 text-xs font-medium">Excluir</button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recovery Insights */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights de Recuperação</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Alta Performance</span>
                </div>
                <p className="text-sm text-green-800">Mensagens de abandono de pagamento têm 25% de conversão</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Horário Ideal</span>
                </div>
                <p className="text-sm text-blue-800">Melhor resposta entre 14h-16h nos dias úteis</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Atenção</span>
                </div>
                <p className="text-sm text-orange-800">47 leads sem contato há mais de 7 dias</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Melhores Horários</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">14h - 16h</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">9h - 11h</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">72%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">19h - 21h</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '58%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">58%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recovery Queue */}
        <div 
          className="p-6 rounded-2xl border"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(226, 232, 240, 0.6)',
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Fila de Recuperação</h3>
            <div className="flex items-center space-x-3">
              <select 
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option>Todos os motivos</option>
                <option>Abandono pagamento</option>
                <option>Sem resposta</option>
                <option>Cotação não aceita</option>
              </select>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                <TrendingUp className="w-4 h-4" />
                <span>Processar Lote</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 font-medium text-gray-700">
                    <input type="checkbox" className="rounded border-gray-300 text-gray-600 focus:ring-gray-500" />
                  </th>
                  <th className="text-left py-3 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-3 font-medium text-gray-700">Produto</th>
                  <th className="text-left py-3 font-medium text-gray-700">Valor</th>
                  <th className="text-left py-3 font-medium text-gray-700">Motivo</th>
                  <th className="text-left py-3 font-medium text-gray-700">Última Tentativa</th>
                  <th className="text-left py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recoveryLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <input type="checkbox" className="rounded border-gray-300 text-gray-600 focus:ring-gray-500" />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${lead.bgColor} rounded-full flex items-center justify-center ${lead.textColor} font-medium text-xs`}>
                          {lead.initials}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{lead.clientName}</div>
                          <div className="text-xs text-gray-500">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm font-medium text-gray-900">{lead.product}</div>
                      <div className="text-xs text-gray-500">{lead.productDetails}</div>
                    </td>
                    <td className="py-4 text-sm font-medium text-gray-900">{lead.value}</td>
                    <td className="py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${reasonConfig[lead.reason].color}`}>
                        {reasonConfig[lead.reason].label}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-600">{lead.lastAttempt}</td>
                    <td className="py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusConfig[lead.status].color}`}>
                        {statusConfig[lead.status].label}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        {lead.status === 'recuperado' ? (
                          <button className="text-green-600 hover:text-green-800 p-1" title="Ver conversa">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button className="text-blue-600 hover:text-blue-800 p-1" title="Enviar mensagem">
                              <Send className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-800 p-1" title="Ver conversa">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-red-600 p-1" title="Descartar">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}