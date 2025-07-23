import React, { useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { MetricsCard } from './MetricsCard';
import { ConversationList } from './ConversationList';
import { SalesPipeline } from './SalesPipeline';
import { RecoveryDashboard } from './RecoveryDashboard';
import { PaymentStatus } from './PaymentStatus';
import { ComplianceLog } from './ComplianceLog';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageCircle, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  Eye,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react';

const statusConfig = {
  novo: { 
    label: 'Novo Lead', 
    color: 'bg-blue-100 text-blue-800',
    actions: ['view', 'qualify', 'assign']
  },
  qualificado: { 
    label: 'Qualificado', 
    color: 'bg-green-100 text-green-800',
    actions: ['view', 'quote', 'call']
  },
  proposta_enviada: { 
    label: 'Proposta Enviada', 
    color: 'bg-purple-100 text-purple-800',
    actions: ['view', 'follow_up', 'call']
  },
  aguardando_pagamento: { 
    label: 'Aguardando Pagamento', 
    color: 'bg-yellow-100 text-yellow-800',
    actions: ['view', 'payment_link', 'follow_up']
  },
  pago: { 
    label: 'Fechado/Pago', 
    color: 'bg-green-100 text-green-800',
    actions: ['view', 'policy', 'welcome_kit']
  },
  perdido: { 
    label: 'Perdido', 
    color: 'bg-red-100 text-red-800',
    actions: ['view', 'recover', 'analyze']
  },
  abandonado: { 
    label: 'Abandonado', 
    color: 'bg-gray-100 text-gray-800',
    actions: ['view', 'recover', 'reactivate']
  }
};

export function PipelinePage() {
  const { leads, loading, error, createLead, updateLeadStatus } = useLeads();
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [newLead, setNewLead] = useState({
    phone: '',
    full_name: '',
    product_interest: '',
    source: 'manual'
  });

  // Filtrar leads
  const filteredLeads = React.useMemo(() => {
    return leads.filter(lead => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          lead.clients?.full_name?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(searchTerm) ||
          lead.product_interest?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      if (statusFilter !== 'Todos' && lead.status !== statusFilter.toLowerCase()) {
        return false;
      }
      
      return true;
    });
  }, [leads, searchTerm, statusFilter]);

  // Calcular métricas
  const metrics = React.useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'novo').length;
    const qualifiedLeads = leads.filter(l => l.status === 'qualificado').length;
    const closedLeads = leads.filter(l => l.status === 'pago').length;
    const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;
    
    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      closedLeads,
      conversionRate
    };
  }, [leads]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLead(newLead);
      setShowNewLeadModal(false);
      setNewLead({ phone: '', full_name: '', product_interest: '', source: 'manual' });
    } catch (error) {
      console.error('Erro ao criar lead:', error);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      
      // Mostrar feedback visual para automação
      if (newStatus === 'pago') {
        alert('Lead fechado! Iniciando automação:\n✅ Emissão de apólice\n✅ Kit Boas Vindas\n✅ Notificações');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getActionButtons = (lead: any) => {
    const config = statusConfig[lead.status];
    const actions = config.actions;

    return (
      <div className="flex items-center space-x-2">
        {actions.includes('view') && (
          <button 
            className="text-blue-600 hover:text-blue-900 p-1" 
            title="Ver detalhes"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        {actions.includes('qualify') && (
          <button 
            onClick={() => handleUpdateStatus(lead.id, 'qualificado')}
            className="text-green-600 hover:text-green-900 p-1" 
            title="Qualificar lead"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        {actions.includes('quote') && (
          <button 
            onClick={() => handleUpdateStatus(lead.id, 'proposta_enviada')}
            className="text-purple-600 hover:text-purple-900 p-1" 
            title="Enviar proposta"
          >
            <Mail className="w-4 h-4" />
          </button>
        )}
        {actions.includes('payment_link') && (
          <button 
            onClick={() => handleUpdateStatus(lead.id, 'aguardando_pagamento')}
            className="text-yellow-600 hover:text-yellow-900 p-1" 
            title="Enviar link de pagamento"
          >
            <DollarSign className="w-4 h-4" />
          </button>
        )}
        {actions.includes('call') && (
          <button 
            className="text-blue-600 hover:text-blue-900 p-1" 
            title="Ligar para cliente"
          >
            <Phone className="w-4 h-4" />
          </button>
        )}
        {actions.includes('follow_up') && (
          <button 
            className="text-orange-600 hover:text-orange-900 p-1" 
            title="Follow-up"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        )}
        {actions.includes('policy') && (
          <button 
            className="text-green-600 hover:text-green-900 p-1" 
            title="Ver apólice emitida"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        {actions.includes('welcome_kit') && (
          <button 
            className="text-purple-600 hover:text-purple-900 p-1" 
            title="Kit Boas Vindas enviado"
          >
            <Zap className="w-4 h-4" />
          </button>
        )}
        {actions.includes('recover') && (
          <button 
            onClick={() => handleUpdateStatus(lead.id, 'qualificado')}
            className="text-orange-600 hover:text-orange-900 p-1" 
            title="Iniciar recuperação"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomBgColor = (): string => {
    const colors = [
      'bg-blue-100', 'bg-green-100', 'bg-purple-100', 
      'bg-orange-100', 'bg-red-100', 'bg-yellow-100'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getRandomTextColor = (): string => {
    const colors = [
      'text-blue-600', 'text-green-600', 'text-purple-600',
      'text-orange-600', 'text-red-600', 'text-yellow-600'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar pipeline: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Pipeline de Vendas</h2>
            <p className="text-sm sm:text-base text-gray-600">Acompanhe leads, conversões e automações em tempo real</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button className="hidden sm:flex border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 items-center space-x-2 text-sm">
              <Filter className="w-4 h-4" />
              <span>Filtros Avançados</span>
            </button>
            <button 
              onClick={() => setShowNewLeadModal(true)}
              className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-md font-medium hover:bg-gray-800 flex items-center space-x-1 sm:space-x-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Lead</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <MetricsCard
            title="Total de Leads"
            value={metrics.totalLeads}
            change={`+${metrics.newLeads} novos`}
            changeType="positive"
            icon={Users}
            iconColor="bg-blue-500"
          />
          <MetricsCard
            title="Qualificados"
            value={metrics.qualifiedLeads}
            change={`${((metrics.qualifiedLeads / metrics.totalLeads) * 100).toFixed(1)}% do total`}
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-green-500"
          />
          <MetricsCard
            title="Fechados"
            value={metrics.closedLeads}
            change={`${metrics.conversionRate.toFixed(1)}% conversão`}
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-purple-500"
          />
          <MetricsCard
            title="IA Ativa"
            value="87%"
            change="+5% este mês"
            changeType="positive"
            icon={MessageCircle}
            iconColor="bg-orange-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Pipeline Overview */}
          <div className="lg:col-span-2">
            <SalesPipeline />
          </div>
          
          {/* WhatsApp Conversations */}
          <div>
            <ConversationList />
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Leads Ativos</h3>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar leads..."
                    className="w-32 sm:w-auto pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Todos</option>
                  <option>Novo</option>
                  <option>Qualificado</option>
                  <option>Proposta Enviada</option>
                  <option>Aguardando Pagamento</option>
                  <option>Pago</option>
                  <option>Perdido</option>
                  <option>Abandonado</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score IA</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  const initials = getInitials(lead.clients?.full_name || 'Lead');
                  const bgColor = getRandomBgColor();
                  const textColor = getRandomTextColor();
                  
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 sm:w-10 h-8 sm:h-10 ${bgColor} rounded-full flex items-center justify-center ${textColor} font-medium text-xs`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900">{lead.clients?.full_name || 'Lead sem nome'}</div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate">{lead.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{lead.product_interest || 'Não especificado'}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-12 sm:w-16 bg-gray-200 rounded-full h-2 ${
                            lead.ai_score >= 80 ? 'bg-green-200' :
                            lead.ai_score >= 60 ? 'bg-yellow-200' :
                            'bg-red-200'
                          }`}>
                            <div 
                              className={`h-2 rounded-full ${
                                lead.ai_score >= 80 ? 'bg-green-500' :
                                lead.ai_score >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${lead.ai_score}%` }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{lead.ai_score}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[lead.status].color}`}>
                          {statusConfig[lead.status].label}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="text-xs sm:text-sm text-gray-900 capitalize">{lead.source}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="text-xs sm:text-sm text-gray-900">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</div>
                        <div className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        {getActionButtons(lead)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <RecoveryDashboard />
          <PaymentStatus />
          <ComplianceLog />
        </div>

        {/* Modal para Novo Lead */}
        {showNewLeadModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Lead</h3>
                <form onSubmit={handleCreateLead} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input 
                      type="tel" 
                      value={newLead.phone}
                      onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome (opcional)</label>
                    <input 
                      type="text" 
                      value={newLead.full_name}
                      onChange={(e) => setNewLead({...newLead, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Nome do cliente"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interesse</label>
                    <select 
                      value={newLead.product_interest}
                      onChange={(e) => setNewLead({...newLead, product_interest: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um produto</option>
                      <option value="Seguro Auto">Seguro Auto</option>
                      <option value="Seguro Vida">Seguro Vida</option>
                      <option value="Seguro Residencial">Seguro Residencial</option>
                      <option value="Seguro Empresarial">Seguro Empresarial</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origem</label>
                    <select 
                      value={newLead.source}
                      onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="manual">Manual</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="website">Website</option>
                      <option value="facebook">Facebook</option>
                      <option value="google">Google</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button 
                      type="button"
                      onClick={() => setShowNewLeadModal(false)}
                      className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-3 sm:px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm"
                    >
                      Criar Lead
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}