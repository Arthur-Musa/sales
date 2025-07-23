import React, { useState } from 'react';
import { useCommissions } from '../hooks/useCommissions';
import { 
  Search, 
  Eye, 
  Download, 
  MoreVertical, 
  RefreshCw, 
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Calendar,
  Filter,
  FileText
} from 'lucide-react';


interface CommissionsPageProps {
  onBack?: () => void;
}


const statusConfig = {
  paga: { 
    label: 'Paga', 
    color: 'bg-green-100 text-green-800',
    actions: ['view', 'download']
  },
  pendente: { 
    label: 'Pendente', 
    color: 'bg-orange-100 text-orange-800',
    actions: ['view', 'approve', 'reject']
  },
  processando: { 
    label: 'Processando', 
    color: 'bg-blue-100 text-blue-800',
    actions: ['view', 'cancel']
  },
  aprovada: { 
    label: 'Aprovada', 
    color: 'bg-blue-100 text-blue-800',
    actions: ['view', 'pay']
  },
  em_atraso: { 
    label: 'Em Atraso', 
    color: 'bg-red-100 text-red-800',
    actions: ['view', 'urgent_pay']
  },
  cancelada: { 
    label: 'Cancelada', 
    color: 'bg-gray-100 text-gray-800',
    actions: ['view']
  },
  rejeitada: { 
    label: 'Rejeitada', 
    color: 'bg-red-100 text-red-800',
    actions: ['view', 'review']
  }
};

export function CommissionsPage({ onBack }: CommissionsPageProps) {
  const { commissions, loading, error, approveCommission, rejectCommission, markAsPaid, bulkApprove } = useCommissions();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sellerFilter, setSellerFilter] = useState('Todos');
  const [productFilter, setProductFilter] = useState('Todos');
  const [periodFilter, setPeriodFilter] = useState('Este mês');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filtrar comissões
  const filteredCommissions = React.useMemo(() => {
    return commissions.filter(commission => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          commission.sales?.clients?.full_name?.toLowerCase().includes(searchLower) ||
          commission.users?.full_name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      if (statusFilter !== 'Todos' && commission.status !== statusFilter.toLowerCase()) {
        return false;
      }
      
      return true;
    });
  }, [commissions, searchTerm, statusFilter]);

  // Calcular métricas
  const metrics = React.useMemo(() => {
    const totalCommissions = commissions.length;
    const totalValue = commissions.reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = commissions.filter(c => c.status === 'paga').length;
    const pendingCommissions = commissions.filter(c => c.status === 'pendente').length;
    
    return {
      totalCommissions,
      totalValue,
      paidCommissions,
      pendingCommissions
    };
  }, [commissions]);
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredCommissions.map(commission => commission.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleApprove = async (commissionId: string) => {
    try {
      await approveCommission(commissionId);
    } catch (error) {
      console.error('Erro ao aprovar comissão:', error);
    }
  };

  const handleReject = async (commissionId: string, reason: string) => {
    try {
      await rejectCommission(commissionId, reason);
    } catch (error) {
      console.error('Erro ao rejeitar comissão:', error);
    }
  };

  const handleMarkAsPaid = async (commissionId: string, reference: string) => {
    try {
      await markAsPaid(commissionId, reference);
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    }
  };

  const getActionButtons = (commission: any) => {
    const config = statusConfig[commission.status];
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
        {actions.includes('download') && (
          <button 
            className="text-green-600 hover:text-green-900 p-1" 
            title="Download comprovante"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
        {actions.includes('approve') && (
          <button 
            onClick={() => handleApprove(commission.id)}
            className="text-green-600 hover:text-green-900 p-1" 
            title="Aprovar comissão"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        {actions.includes('reject') && (
          <button 
            onClick={() => handleReject(commission.id, 'Rejeitada pelo gestor')}
            className="text-red-600 hover:text-red-900 p-1" 
            title="Rejeitar comissão"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {actions.includes('pay') && (
          <button 
            onClick={() => handleMarkAsPaid(commission.id, `PAY_${Date.now()}`)}
            className="text-blue-600 hover:text-blue-900 p-1" 
            title="Processar pagamento"
          >
            <DollarSign className="w-4 h-4" />
          </button>
        )}
        {actions.includes('cancel') && (
          <button 
            className="text-blue-600 hover:text-blue-900 p-1 animate-spin" 
            title="Processando..."
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        {actions.includes('urgent_pay') && (
          <button 
            className="text-red-600 hover:text-red-900 p-1" 
            title="Pagamento urgente"
          >
            <DollarSign className="w-4 h-4" />
          </button>
        )}
        {actions.includes('review') && (
          <button 
            className="text-purple-600 hover:text-purple-900 p-1" 
            title="Revisar comissão"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando comissões...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar comissões: {error}</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Gestão de Comissões</h2>
            <p className="text-gray-600">Acompanhe e gerencie todas as comissões dos vendedores</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center space-x-2 text-sm">
              <Download className="w-4 h-4" />
              <span>Exportar Lista</span>
            </button>
            <button 
              onClick={() => setShowBulkActions(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center space-x-2 text-sm"
            >
              <DollarSign className="w-4 h-4" />
              <span>Processar Pagamentos</span>
            </button>
          </div>
        </div>

        {/* Métricas Resumo */}
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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-md">Total</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.totalCommissions}</p>
              <p className="text-gray-600 text-sm">Comissões este mês</p>
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
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-md">Pagas</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.paidCommissions}</p>
              <p className="text-gray-600 text-sm">Comissões pagas</p>
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
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded-md">Pendentes</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.pendingCommissions}</p>
              <p className="text-gray-600 text-sm">Aguardando aprovação</p>
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
              <span className="text-purple-600 text-xs font-medium bg-purple-50 px-2 py-1 rounded-md">Valor</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(metrics.totalValue)}</p>
              <p className="text-gray-600 text-sm">Total em comissões</p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div 
          className="p-6 rounded-2xl border mb-8"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(226, 232, 240, 0.6)',
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Busca Geral */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cliente, vendedor, proposta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option>Todos</option>
                <option>Paga</option>
                <option>Pendente</option>
                <option>Aprovada</option>
                <option>Processando</option>
                <option>Em Atraso</option>
                <option>Cancelada</option>
                <option>Rejeitada</option>
              </select>
            </div>

            {/* Filtro por Vendedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor</label>
              <select 
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option>Todos</option>
                <option>IA Olga</option>
                <option>Maria Oliveira</option>
                <option>João Santos</option>
                <option>Pedro Silva</option>
              </select>
            </div>

            {/* Filtro por Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Produto</label>
              <select 
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option>Todos</option>
                <option>Seguro Auto</option>
                <option>Seguro Vida</option>
                <option>Seguro Residencial</option>
                <option>Seguro Empresarial</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Período:</span>
              <select 
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option>Este mês</option>
                <option>Último mês</option>
                <option>Últimos 3 meses</option>
                <option>Este ano</option>
                <option>Personalizado</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center space-x-1">
                <Filter className="w-4 h-4" />
                <span>Limpar Filtros</span>
              </button>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Lista Detalhada de Comissões */}
        <div 
          className="rounded-2xl border"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(226, 232, 240, 0.6)',
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Lista Detalhada de Comissões</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filteredCommissions.length} comissões encontradas</span>
                <div className="flex items-center space-x-1">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">1-{Math.min(50, filteredCommissions.length)} de {filteredCommissions.length}</span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input 
                      type="checkbox" 
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Venda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Com.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Com.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Venda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pag. Prev.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommissions.map((commission) => {
                  const initials = getInitials(commission.sales?.clients?.full_name || 'Cliente');
                  const bgColor = getRandomBgColor();
                  const textColor = getRandomTextColor();
                  
                  return (
                  <tr 
                    key={commission.id} 
                    className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-sm ${
                      selectedRows.includes(commission.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={(e) => {
                      if (!e.target.closest('button') && !e.target.closest('input')) {
                        handleSelectRow(commission.id);
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedRows.includes(commission.id)}
                        onChange={() => handleSelectRow(commission.id)}
                        className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center ${textColor} font-medium text-xs`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{commission.sales?.clients?.full_name || 'Cliente'}</div>
                          <div className="text-sm text-gray-500">{commission.sales?.clients?.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">#{commission.sale_id.slice(0, 8)}</div>
                      <div className="text-xs text-gray-500">{new Date(commission.sales?.created_at || '').toLocaleDateString('pt-BR')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{commission.sales?.products?.name}</div>
                      <div className="text-sm text-gray-500">{commission.sales?.products?.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(commission.base_value)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-600">{commission.percentage.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${
                        commission.status === 'paga' ? 'text-green-600' :
                        commission.status === 'pendente' ? 'text-orange-600' :
                        commission.status === 'aprovada' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {formatCurrency(commission.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[commission.status].color}`}>
                        {statusConfig[commission.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{new Date(commission.sales?.created_at || '').toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-gray-500">{new Date(commission.sales?.created_at || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${
                        commission.paid_at ? 
                        (commission.status === 'paga' ? 'text-gray-500' : 'text-blue-600') : 
                        'text-gray-500'
                      }`}>
                        {commission.paid_at ? new Date(commission.paid_at).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getActionButtons(commission)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Mostrando</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>50</option>
                  <option>100</option>
                  <option>200</option>
                </select>
                <span className="text-sm text-gray-700">de {filteredCommissions.length} comissões</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Anterior
                </button>
                <button className="px-3 py-1 bg-gray-900 text-white rounded text-sm">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">3</button>
                <span className="text-gray-500">...</span>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">{Math.ceil(filteredCommissions.length / 50)}</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Ações em Lote */}
        {showBulkActions && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ações em Lote - Comissões</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      if (selectedRows.length === 0) {
                        alert('Selecione pelo menos uma comissão para aprovar em lote.');
                        return;
                      }
                      bulkApprove(selectedRows);
                    }}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Aprovar Comissões Selecionadas
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedRows.length === 0) {
                        alert('Selecione pelo menos uma comissão para processar pagamentos.');
                        return;
                      }
                      alert(`Processando pagamentos para ${selectedRows.length} comissões`);
                      setShowBulkActions(false);
                    }}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Processar Pagamentos
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedRows.length === 0) {
                        alert('Selecione pelo menos uma comissão para gerar relatório.');
                        return;
                      }
                      alert(`Gerando relatório para ${selectedRows.length} comissões`);
                      setShowBulkActions(false);
                    }}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Gerar Relatório Selecionadas
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedRows.length === 0) {
                        alert('Selecione pelo menos uma comissão para exportar.');
                        return;
                      }
                      alert(`Exportando ${selectedRows.length} comissões para financeiro`);
                      setShowBulkActions(false);
                    }}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Exportar para Financeiro
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedRows.length === 0) {
                        alert('Selecione pelo menos uma comissão para cancelar.');
                        return;
                      }
                      if (confirm(`Tem certeza que deseja cancelar ${selectedRows.length} comissões?`)) {
                        alert(`Cancelando ${selectedRows.length} comissões`);
                        setShowBulkActions(false);
                      }
                    }}
                    className="w-full text-left px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
                  >
                    Cancelar Comissões
                  </button>
                </div>
                <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setShowBulkActions(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedRows.length === 0) {
                        alert('Selecione pelo menos uma comissão para executar ações.');
                        return;
                      }
                      alert(`Executando ações para ${selectedRows.length} comissões`);
                      setShowBulkActions(false);
                    }}
                    className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
                  >
                    Executar
                  </button>
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
              <span>Total: {formatCurrency(metrics.totalValue)}</span>
              <span>•</span>
              <span>Pagas: {metrics.paidCommissions} | Pendentes: {metrics.pendingCommissions}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Funções auxiliares
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getRandomBgColor(): string {
  const colors = [
    'bg-blue-100', 'bg-green-100', 'bg-purple-100', 
    'bg-orange-100', 'bg-red-100', 'bg-yellow-100'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomTextColor(): string {
  const colors = [
    'text-blue-600', 'text-green-600', 'text-purple-600',
    'text-orange-600', 'text-red-600', 'text-yellow-600'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}