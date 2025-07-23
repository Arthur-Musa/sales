import React, { useState } from 'react';
import { usePolicies } from '../hooks/usePolicies';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download, 
  MessageCircle, 
  Mail, 
  RefreshCw, 
  Zap, 
  X, 
  Edit3,
  RotateCcw,
  Eye,
  Gift
} from 'lucide-react';


const statusConfig = {
  emitida: { 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  processando: { 
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    iconColor: 'text-blue-600'
  },
  erro: { 
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
    iconColor: 'text-red-600'
  },
  entregue: { 
    color: 'bg-purple-100 text-purple-800',
    icon: FileText,
    iconColor: 'text-purple-600'
  }
};

interface IssuancePageProps {
  onOpenWelcomeKit?: () => void;
}

export function IssuancePage({ onOpenWelcomeKit }: IssuancePageProps) {
  const { policies, loading, error, reemitPolicy } = usePolicies();
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [insurerFilter, setInsurerFilter] = useState('Todas');
  const [productFilter, setProductFilter] = useState('Todos');
  const [periodFilter, setPeriodFilter] = useState('Hoje');

  // Filtrar apólices
  const filteredPolicies = React.useMemo(() => {
    return policies.filter(policy => {
      if (statusFilter !== 'Todos' && policy.status !== statusFilter.toLowerCase()) {
        return false;
      }
      if (insurerFilter !== 'Todas' && policy.insurer !== insurerFilter) {
        return false;
      }
      return true;
    });
  }, [policies, statusFilter, insurerFilter]);

  // Calcular métricas
  const metrics = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayPolicies = policies.filter(p => p.created_at.startsWith(today));
    
    return {
      emittedToday: todayPolicies.filter(p => p.status === 'emitida').length,
      processing: policies.filter(p => p.status === 'processando').length,
      errors: policies.filter(p => p.status === 'erro').length,
      successRate: policies.length > 0 ? 
        ((policies.filter(p => p.status === 'emitida').length / policies.length) * 100).toFixed(1) : 
        '0'
    };
  }, [policies]);

  const handleBulkReemit = async () => {
    const errorPolicies = filteredPolicies.filter(p => p.status === 'erro');
    if (errorPolicies.length === 0) {
      alert('Não há apólices com erro para reemitir.');
      return;
    }
    
    if (confirm(`Reemitir ${errorPolicies.length} apólices com erro?`)) {
      try {
        // Simular reemissão em lote
        for (const policy of errorPolicies) {
          await handleReemit(policy.id);
        }
        alert(`${errorPolicies.length} apólices foram reenviadas para reemissão.`);
      } catch (error) {
        alert('Erro ao reemitir apólices em lote.');
      }
    }
  };

  const handleReemit = async (policyId: string) => {
    try {
      await reemitPolicy(policyId);
    } catch (error) {
      console.error('Erro ao reemitir apólice:', error);
    }
  };
  const auditLogs = [
    {
      timestamp: '22/01/2025 14:32:47',
      policy: '#00123456789',
      action: 'Emissão Concluída',
      status: 'Sucesso',
      details: 'Apólice emitida em 47s - Enviada via WhatsApp'
    },
    {
      timestamp: '22/01/2025 14:17:45',
      policy: '#456789123',
      action: 'Tentativa Emissão',
      status: 'Falha',
      details: 'Timeout API Porto Seguro - 30s'
    },
    {
      timestamp: '22/01/2025 14:15:20',
      policy: '#00123456788',
      action: '2ª Via Solicitada',
      status: 'Processado',
      details: 'Cliente solicitou reenvio por email'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando apólices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar apólices: {error}</p>
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Emissão de Apólices</h2>
              <p className="text-gray-600">Acompanhar e auditar emissão/entrega automática de apólices após pagamento</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleBulkReemit}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reemitir Lote</span>
              </button>
              <button 
                onClick={onOpenWelcomeKit}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                title="Gerar Kit Boas Vindas para cliente"
              >
                <Gift className="w-4 h-4" />
                <span>Kit Boas Vindas</span>
              </button>
              <button 
                onClick={() => setShowAuditModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                <FileText className="w-4 h-4" />
                <span>Logs/Auditoria</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alertas de Erro de Integração */}
        <div className="mb-8">
          <div 
            className="p-4 rounded-lg border-l-4 border-red-500"
            style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-red-900">Alerta: 5 Apólices com Erro de Integração</h4>
                  <p className="text-sm text-red-700">Porto Seguro - Instabilidade no sistema. Última tentativa: há 15min</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filteredPolicies.length} apólices</span>
                <button className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700">
                  Tentar Novamente
                </button>
                <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status de Emissão Overview */}
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
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-md">+8</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.emittedToday}</p>
              <p className="text-gray-600 text-sm">Emitidas hoje</p>
              <p className="text-xs text-gray-500 mt-1">Tempo médio: 45 seg</p>
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
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-md">23</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.processing}</p>
              <p className="text-gray-600 text-sm">Em processamento</p>
              <p className="text-xs text-gray-500 mt-1">Aguardando seguradoras</p>
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
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-md">Atenção</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.errors}</p>
              <p className="text-gray-600 text-sm">Com erro</p>
              <p className="text-xs text-gray-500 mt-1">Falha na integração</p>
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
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-medium bg-purple-50 px-2 py-1 rounded-md">98.7%</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.successRate}%</p>
              <p className="text-gray-600 text-sm">Taxa de sucesso</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
            </div>
          </div>
        </div>

        {/* Filtros e Lista de Apólices */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filtros */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option>Todos</option>
                  <option>Emitida</option>
                  <option>Processando</option>
                  <option>Erro</option>
                  <option>Entregue</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seguradora</label>
                <select 
                  value={insurerFilter}
                  onChange={(e) => setInsurerFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option>Todas</option>
                  <option>Porto Seguro</option>
                  <option>Bradesco Seguros</option>
                  <option>SulAmérica</option>
                  <option>Azul Seguros</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produto</label>
                <select 
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option>Todos</option>
                  <option>Auto</option>
                  <option>Vida</option>
                  <option>Residencial</option>
                  <option>Empresarial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <select 
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option>Hoje</option>
                  <option>Últimos 7 dias</option>
                  <option>Últimos 30 dias</option>
                  <option>Este mês</option>
                  <option>Personalizado</option>
                </select>
              </div>
              
              <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm">
                Aplicar Filtros
              </button>
            </div>
          </div>

          {/* Lista de Apólices */}
          <div 
            className="lg:col-span-3 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Lista de Apólices</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">184 apólices</span>
                  <button className="text-gray-500 hover:text-gray-700">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {filteredPolicies.map((policy) => {
                const config = statusConfig[policy.status];
                const IconComponent = config.icon;
                
                return (
                  <div 
                    key={policy.id} 
                    className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                      policy.status === 'processando' ? 'border-blue-200 bg-blue-50' :
                      policy.status === 'erro' ? 'border-red-200 bg-red-50' :
                      'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${policy.status === 'emitida' ? 'bg-green-100' : policy.status === 'processando' ? 'bg-blue-100' : policy.status === 'erro' ? 'bg-red-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                          <IconComponent className={`w-5 h-5 ${config.iconColor} ${policy.status === 'processando' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {policy.status === 'processando' ? `Proposta #${policy.policy_number}` : `Apólice #${policy.policy_number}`}
                          </h4>
                          <p className="text-sm text-gray-600">{policy.clients?.full_name} - {policy.products?.name}</p>
                          <p className="text-xs text-gray-500">{policy.products?.description} - {policy.insurer}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.color}`}>
                          {policy.status === 'emitida' ? 'Emitida' : 
                           policy.status === 'processando' ? 'Processando' :
                           policy.status === 'erro' ? 'Erro' : 'Entregue'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{getTimeAgo(policy.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium text-gray-900 ml-1">{formatCurrency(policy.sales?.value || 0)}</span>
                      </div>
                      <div>
                        {policy.status === 'emitida' ? (
                          <>
                            <span className="text-gray-600">Emissão:</span>
                            <span className="font-medium text-gray-900 ml-1">{policy.emission_time}</span>
                          </>
                        ) : policy.status === 'processando' ? (
                          <>
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium text-blue-600 ml-1">Aguardando API</span>
                          </>
                        ) : policy.status === 'erro' ? (
                          <>
                            <span className="text-gray-600">Erro:</span>
                            <span className="font-medium text-red-600 ml-1">API Timeout</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-600">Entregas:</span>
                            <span className="font-medium text-gray-900 ml-1">WhatsApp ✓ Email ✓</span>
                          </>
                        )}
                      </div>
                      <div>
                        {policy.status === 'emitida' ? (
                          <>
                            <span className="text-gray-600">Entrega:</span>
                            <span className="font-medium text-green-600 ml-1">
                              {policy.delivery_whatsapp ? 'WhatsApp ✓' : 'Pendente'}
                            </span>
                          </>
                        ) : policy.status === 'processando' ? (
                          <>
                            <span className="text-gray-600">Tentativas:</span>
                            <span className="font-medium text-gray-900 ml-1">{policy.delivery_attempts}/3</span>
                          </>
                        ) : policy.status === 'erro' ? (
                          <>
                            <span className="text-gray-600">Tentativas:</span>
                            <span className="font-medium text-gray-900 ml-1">{policy.delivery_attempts}/3</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-600">2ª Via:</span>
                            <span className="font-medium text-orange-600 ml-1">2ª via solicitada</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {policy.status === 'erro' && (
                      <div className="bg-red-100 rounded p-2 mb-3">
                        <p className="text-xs text-red-800">
                          <strong>Erro:</strong> {policy.error_message || 'Erro na emissão'}. 
                          Última tentativa falhada: {new Date(policy.last_delivery_attempt || policy.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        {policy.status === 'processando' ? `Iniciado: ${new Date(policy.created_at).toLocaleString('pt-BR')} - Em processamento...` :
                         policy.status === 'erro' ? `Falhou em: ${new Date(policy.created_at).toLocaleString('pt-BR')}` :
                         `Processamento: ${new Date(policy.created_at).toLocaleString('pt-BR')}`}
                      </div>
                      <div className="flex space-x-2">
                        {policy.status === 'emitida' && (
                          <>
                            <button className="text-blue-600 hover:text-blue-800 p-1" title="Download PDF">
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = policy.pdf_url || '#';
                                link.download = `apolice_${policy.policy_number}.pdf`;
                                link.click();
                                alert(`Baixando apólice ${policy.policy_number}`);
                              }}
                              onClick={() => handleReemit(policy.id)}
                              className="text-green-600 hover:text-green-800 p-1" title="Reenviar WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button className="text-purple-600 hover:text-purple-800 p-1" title="Ver logs">
                              <FileText className="w-4 h-4" />
                              onClick={() => alert(`Visualizando logs da apólice ${policy.policy_number}`)}
                            </button>
                          </>
                        )}
                        {policy.status === 'processando' && (
                          <>
                            <button className="text-blue-600 hover:text-blue-800 p-1" title="Acelerar processamento">
                              onClick={() => alert(`Acelerando processamento da apólice ${policy.policy_number}`)}
                              onClick={() => alert(`Abrindo correção manual para ${policy.policy_number}`)}
                              <Zap className="w-4 h-4" />
                            </button>
                            <button className="text-purple-600 hover:text-purple-800 p-1" title="Correção manual">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {policy.status === 'erro' && (
                          <>
                            <button className="text-blue-600 hover:text-blue-800 p-1" title="Segunda via instantânea">
                              onClick={() => {
                                handleReemit(policy.id);
                                alert(`Gerando segunda via para ${policy.policy_number}`);
                              }}
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-800 p-1" title="Reenviar por email">
                              onClick={() => alert(`Reenviando por email: ${policy.policy_number}`)}
                              onClick={() => alert(`Visualizando histórico de entregas: ${policy.policy_number}`)}
                              <Mail className="w-4 h-4" />
                            </button>
                            <button className="text-purple-600 hover:text-purple-800 p-1" title="Histórico entregas">
                              <Clock className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal para Logs de Auditoria */}
        {showAuditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-5/6 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Logs de Auditoria - Emissão</h3>
                  <button 
                    onClick={() => setShowAuditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Timestamp</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Apólice</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ação</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {auditLogs.map((log, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-gray-900">{log.timestamp}</td>
                          <td className="px-4 py-2 text-gray-900">{log.policy}</td>
                          <td className="px-4 py-2 text-gray-900">{log.action}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              log.status === 'Sucesso' ? 'bg-green-100 text-green-800' :
                              log.status === 'Falha' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="font-medium">Olga AI</span>
            </button>
            <div className="flex items-center space-x-6 text-xs">
              <span>© 2025 Olga AI</span>
              <span>•</span>
              <span>SUSEP • LGPD • Auditoria Completa</span>
              <span>•</span>
              <span>Taxa de sucesso: {metrics.successRate}%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Funções auxiliares
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins}min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays}d`;
}