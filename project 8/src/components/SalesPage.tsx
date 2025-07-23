import React, { useState } from 'react';
import { useSales } from '../hooks/useSales';
import { 
  Search, 
  Eye, 
  MessageCircle, 
  MoreVertical, 
  RefreshCw, 
  Clock,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  Zap,
  X
} from 'lucide-react';


interface SalesPageProps {
  onViewSale?: (saleId: string) => void;
}


const statusConfig = {
  pago: { 
    label: 'Pago', 
    color: 'bg-green-100 text-green-800',
    subtext: 'Emitida'
  },
  perdido: { 
    label: 'Perdido', 
    color: 'bg-red-100 text-red-800',
    subtext: ''
  },
  pendente: { 
    label: 'Pendente', 
    color: 'bg-yellow-100 text-yellow-800',
    subtext: 'Aguard. Docs'
  },
  qualificado: { 
    label: 'Qualificado', 
    color: 'bg-blue-100 text-blue-800',
    subtext: 'Gerando proposta'
  },
  proposta: { 
    label: 'Proposta Enviada', 
    color: 'bg-purple-100 text-purple-800',
    subtext: 'Aguard. resposta'
  }
};

export function SalesPage({ onViewSale }: SalesPageProps) {
  const { sales, loading, error, updateSaleStatus, createStripeCheckout } = useSales();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [productFilter, setProductFilter] = useState('Todos');
  const [lossReasonFilter, setLossReasonFilter] = useState('Todos');
  const [periodFilter, setPeriodFilter] = useState('Últimos 7 dias');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filtrar vendas baseado nos filtros
  const filteredSales = React.useMemo(() => {
    return sales.filter(sale => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          sale.clients?.full_name?.toLowerCase().includes(searchLower) ||
          sale.clients?.phone?.includes(searchTerm) ||
          sale.clients?.cpf_cnpj?.includes(searchTerm);
        if (!matchesSearch) return false;
      }
      
      if (statusFilter !== 'Todos' && sale.status !== statusFilter.toLowerCase()) {
        return false;
      }
      
      if (productFilter !== 'Todos' && sale.products?.category !== productFilter.toLowerCase()) {
        return false;
      }
      
      return true;
    });
  }, [sales, searchTerm, statusFilter, productFilter]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredSales.map(sale => sale.id));
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

  const handleUpdateStatus = async (saleId: string, status: string, lossReason?: string) => {
    try {
      await updateSaleStatus(saleId, status, lossReason);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleCreateCheckout = async (saleId: string) => {
    try {
      await createStripeCheckout(saleId);
      alert('Link de pagamento criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      alert('Erro ao criar link de pagamento');
    }
  };

  const getActionButtons = (sale: any) => {
    const baseButtons = [
      <button 
        key="view"
        onClick={() => onViewSale?.(sale.id)}
        className="text-blue-600 hover:text-blue-900 p-1" 
        title="Ver detalhes"
      >
        <Eye className="w-4 h-4" />
      </button>,
      <button 
        key="whatsapp"
        className="text-green-600 hover:text-green-900 p-1" 
        title="WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
    ];

    switch (sale.status) {
      case 'perdido':
        return [
          ...baseButtons,
          <button 
            key="recover"
            className="text-orange-600 hover:text-orange-900 p-1" 
            title="Iniciar recuperação"
          >
            <RefreshCw className="w-4 h-4" />
          </button>,
          <button 
            key="history"
            className="text-purple-600 hover:text-purple-900 p-1" 
            title="Histórico/Logs"
          >
            <Clock className="w-4 h-4" />
          </button>
        ];
      case 'pendente':
        return [
          ...baseButtons,
          <button 
            key="complete"
            onClick={() => handleUpdateStatus(sale.id, 'pago')}
            className="text-yellow-600 hover:text-yellow-900 p-1" 
            title="Marcar como concluída"
          >
            <Check className="w-4 h-4" />
          </button>
        ];
      case 'qualificado':
        return [
          ...baseButtons,
          <button 
            key="accelerate"
            onClick={() => handleCreateCheckout(sale.id)}
            className="text-indigo-600 hover:text-indigo-900 p-1" 
            title="Acelerar processo"
          >
            <Zap className="w-4 h-4" />
          </button>
        ];
      default:
        return [
          ...baseButtons,
          <button 
            key="history"
            className="text-purple-600 hover:text-purple-900 p-1" 
            title="Histórico/Logs"
          >
            <Clock className="w-4 h-4" />
          </button>
        ];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar vendas: {error}</p>
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
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Gestão de Vendas/Propostas</h2>
            <p className="text-sm sm:text-base text-gray-600">Gerenciar ciclo de vida de propostas, status e acompanhamento de conversão</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button className="hidden sm:flex border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 items-center space-x-2 text-sm">
              <Download className="w-4 h-4" />
              <span>Exportar Lista</span>
            </button>
            <button 
              onClick={() => setShowBulkActions(true)}
              className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-md font-medium hover:bg-gray-800 flex items-center space-x-1 sm:space-x-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Ações em Lote</span>
              <span className="sm:hidden">Ações</span>
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Busca Geral */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input 
                type="text" 
                placeholder="Nome, telefone, CPF, proposta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option>Todos</option>
                <option>Lead</option>
                <option>Qualificado</option>
                <option>Proposta Enviada</option>
                <option>Pago</option>
                <option>Perdido</option>
                <option>Pendente</option>
              </select>
            </div>

            {/* Filtro por Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
              <select 
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option>Todos</option>
                <option>Seguro Auto</option>
                <option>Seguro Vida</option>
                <option>Seguro Residencial</option>
                <option>Seguro Empresarial</option>
              </select>
            </div>

            {/* Filtro por Motivo de Perda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo Perda</label>
              <select 
                value={lossReasonFilter}
                onChange={(e) => setLossReasonFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option>Todos</option>
                <option>Preço Alto</option>
                <option>Sem Interesse</option>
                <option>Já Tem Seguro</option>
                <option>Não Respondeu</option>
                <option>Erro Técnico</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-4 border-t border-gray-200 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Período:</span>
              <select 
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option>Últimos 7 dias</option>
                <option>Últimos 30 dias</option>
                <option>Este mês</option>
                <option>Último mês</option>
                <option>Personalizado</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                Limpar Filtros
              </button>
              <button className="px-3 py-1 bg-gray-900 text-white rounded text-sm hover:bg-gray-800">
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Lista Detalhada de Propostas */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-medium text-gray-900">Lista Detalhada de Propostas</h3>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-xs sm:text-sm text-gray-600">{filteredSales.length} propostas</span>
                <div className="hidden sm:flex items-center space-x-1">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">1-{Math.min(50, filteredSales.length)} de {filteredSales.length}</span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
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
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => {
                  const initials = getInitials(sale.clients?.full_name || 'Cliente');
                  const bgColor = getRandomBgColor();
                  const textColor = getRandomTextColor();
                  
                  return (
                  <tr 
                    key={sale.id} 
                    className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-sm ${
                      selectedRows.includes(sale.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={(e) => {
                      if (!e.target.closest('button') && !e.target.closest('input')) {
                        handleSelectRow(sale.id);
                      }
                    }}
                  >
                    <td className="px-3 sm:px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedRows.includes(sale.id)}
                        onChange={() => handleSelectRow(sale.id)}
                        className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 sm:w-10 h-8 sm:h-10 ${bgColor} rounded-full flex items-center justify-center ${textColor} font-medium text-xs`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">{sale.clients?.full_name || 'Cliente'}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">{sale.clients?.phone}</div>
                          <div className="text-xs text-gray-400 truncate hidden sm:block">{sale.clients?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{sale.products?.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{sale.products?.description}</div>
                      <div className="text-xs text-gray-400 hidden sm:block">{sale.products?.category}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{formatCurrency(sale.value)}</div>
                      <div className="text-xs text-gray-500">{sale.installments}x</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[sale.status].color}`}>
                        {statusConfig[sale.status].label}
                      </span>
                      <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                        {sale.status === 'perdido' && sale.loss_reason ? sale.loss_reason : statusConfig[sale.status].subtext}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="text-xs sm:text-sm text-gray-900">{sale.seller_type === 'ia' ? 'IA Olga' : 'Vendedor'}</div>
                      <div className="text-xs text-gray-500 hidden sm:block">{sale.seller_type === 'ia' ? 'Automático' : 'Manual'}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="text-xs sm:text-sm text-gray-900">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getActionButtons(sale)}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-gray-700">Mostrando</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>50</option>
                  <option>100</option>
                  <option>200</option>
                </select>
                <span className="text-xs sm:text-sm text-gray-700">de {filteredSales.length} propostas</span>
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50">
                  Anterior
                </button>
                <button className="px-2 sm:px-3 py-1 bg-gray-900 text-white rounded text-xs sm:text-sm">1</button>
                <button className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 hidden sm:block">2</button>
                <button className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 hidden sm:block">3</button>
                <span className="text-gray-500 hidden sm:inline">...</span>
                <button className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 hidden sm:block">{Math.ceil(filteredSales.length / 50)}</button>
                <button className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50">
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Ações em Lote */}
        {showBulkActions && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ações em Lote</h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                    Atualizar Status para "Pago"
                  </button>
                    onClick={() => {
                      alert(`Iniciando recuperação para ${selectedRows.length} vendas`);
                      setShowBulkActions(false);
                    }}
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                    Marcar como "Perdido"
                  </button>
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                    Iniciar Recuperação de Venda
                    onClick={() => {
                      alert(`Exportando ${selectedRows.length} vendas selecionadas`);
                      setShowBulkActions(false);
                    }}
                  </button>
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                    Exportar Selecionados
                  </button>
                  <button className="w-full text-left px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50">
                    Excluir Selecionados
                  </button>
                </div>
                <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => {
                      alert(`Atualizando ${selectedRows.length} vendas para "Pago"`);
                      setShowBulkActions(false);
                    }}
                    className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                    onClick={() => {
                      alert(`Marcando ${selectedRows.length} vendas como "Perdido"`);
                      setShowBulkActions(false);
                    }}
                    onClick={() => setShowBulkActions(false)}
                  >
                    Cancelar
                  </button>
                  <button className="px-3 sm:px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm">
                    Executar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
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