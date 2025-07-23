import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Calendar, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';

interface SalesReportPageProps {
  onBack: () => void;
}

interface SalesMetrics {
  totalRevenue: number;
  totalSales: number;
  conversionRate: number;
  averageTicket: number;
  revenueGrowth: number;
  salesGrowth: number;
  conversionGrowth: number;
}

interface ProductPerformance {
  name: string;
  sales: number;
  revenue: string;
  growth: number;
  icon: string;
  color: string;
}

interface SellerPerformance {
  name: string;
  role: string;
  sales: number;
  revenue: string;
  conversion: number;
  initials: string;
  bgColor: string;
  isAI?: boolean;
}

interface SaleDetail {
  date: string;
  client: string;
  product: string;
  seller: string;
  value: string;
  commission: string;
  status: 'pago' | 'processando' | 'pendente';
}

const salesMetrics: SalesMetrics = {
  totalRevenue: 247800,
  totalSales: 127,
  conversionRate: 18.4,
  averageTicket: 1951,
  revenueGrowth: 18.2,
  salesGrowth: 12,
  conversionGrowth: 3.1
};

const productPerformance: ProductPerformance[] = [
  {
    name: 'Seguro Auto',
    sales: 67,
    revenue: 'R$ 142.5k',
    growth: 22,
    icon: '🚗',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Seguro Vida',
    sales: 34,
    revenue: 'R$ 67.2k',
    growth: 15,
    icon: '❤️',
    color: 'bg-green-100 text-green-600'
  },
  {
    name: 'Seguro Residencial',
    sales: 18,
    revenue: 'R$ 28.9k',
    growth: -5,
    icon: '🏠',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    name: 'Seguro Empresarial',
    sales: 8,
    revenue: 'R$ 9.2k',
    growth: 8,
    icon: '🏢',
    color: 'bg-orange-100 text-orange-600'
  }
];

const sellerPerformance: SellerPerformance[] = [
  {
    name: 'IA Olga',
    role: 'Assistente Virtual',
    sales: 89,
    revenue: 'R$ 156.2k',
    conversion: 22.1,
    initials: 'IA',
    bgColor: 'bg-gradient-to-r from-purple-500 to-blue-500',
    isAI: true
  },
  {
    name: 'Maria Oliveira',
    role: 'Vendedora Sênior',
    sales: 23,
    revenue: 'R$ 67.8k',
    conversion: 18.7,
    initials: 'MO',
    bgColor: 'bg-green-100 text-green-600'
  },
  {
    name: 'João Santos',
    role: 'Vendedor Pleno',
    sales: 15,
    revenue: 'R$ 23.8k',
    conversion: 12.3,
    initials: 'JS',
    bgColor: 'bg-blue-100 text-blue-600'
  }
];

const salesDetails: SaleDetail[] = [
  {
    date: '22/01/25',
    client: 'Maria José Silva',
    product: 'Seguro Auto - Honda Civic',
    seller: 'IA Olga',
    value: 'R$ 1.247,50',
    commission: 'R$ 99,80',
    status: 'pago'
  },
  {
    date: '21/01/25',
    client: 'Pedro Martins',
    product: 'Seguro Vida - 500k',
    seller: 'Maria Oliveira',
    value: 'R$ 2.890,00',
    commission: 'R$ 346,80',
    status: 'pago'
  },
  {
    date: '20/01/25',
    client: 'Ana Santos',
    product: 'Seguro Residencial',
    seller: 'IA Olga',
    value: 'R$ 1.890,00',
    commission: 'R$ 113,40',
    status: 'processando'
  }
];

const conversionFunnel = [
  { stage: 'Leads Recebidos', count: 1247, percentage: 100, color: 'from-blue-500 to-purple-500' },
  { stage: 'Qualificados', count: 892, percentage: 71.5, color: 'from-green-500 to-blue-500' },
  { stage: 'Propostas Enviadas', count: 456, percentage: 36.6, color: 'from-yellow-500 to-green-500' },
  { stage: 'Negociações', count: 234, percentage: 18.8, color: 'from-orange-500 to-yellow-500' },
  { stage: 'Vendas Fechadas', count: 127, percentage: 10.2, color: 'from-green-600 to-green-400' }
];

const statusConfig = {
  pago: { label: 'Pago', color: 'bg-green-100 text-green-800' },
  processando: { label: 'Processando', color: 'bg-yellow-100 text-yellow-800' },
  pendente: { label: 'Pendente', color: 'bg-orange-100 text-orange-800' }
};

export function SalesReportPage({ onBack }: SalesReportPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('Últimos 30 dias');
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    // Simular dados do gráfico
    setChartData([145, 178, 162, 203, 189, 221, 247, 0, 0, 0, 0, 0]);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <button 
                onClick={onBack}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-gray-900 font-medium text-base">Olga</h1>
                </div>
              </button>
              <nav className="hidden md:flex space-x-6">
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Pipeline</button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Vendas</button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Comissões</button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Emissão</button>
                <button className="text-gray-900 font-medium relative py-2 text-sm">
                  Relatórios
                  <div className="absolute -bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md">
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-xs">
                  C
                </div>
                <span className="text-gray-900 font-medium text-sm">Carlos Silva</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Relatório de Vendas</h2>
              <p className="text-gray-600">Performance detalhada de vendas, conversão e resultados</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option>Últimos 30 dias</option>
              <option>Este mês</option>
              <option>Último mês</option>
              <option>Últimos 3 meses</option>
              <option>Este ano</option>
            </select>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center space-x-2 text-sm">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
            <button className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 text-sm">
              Agendar Envio
            </button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-md">
                +{salesMetrics.revenueGrowth}%
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(salesMetrics.totalRevenue)}
              </p>
              <p className="text-gray-600 text-sm">Faturamento Total</p>
              <p className="text-xs text-gray-500 mt-1">vs. mês anterior</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-md">
                +{salesMetrics.salesGrowth}
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{salesMetrics.totalSales}</p>
              <p className="text-gray-600 text-sm">Vendas Realizadas</p>
              <p className="text-xs text-gray-500 mt-1">{(salesMetrics.totalSales / 30).toFixed(1)} vendas/dia</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-medium bg-purple-50 px-2 py-1 rounded-md">
                +{salesMetrics.conversionGrowth}%
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{salesMetrics.conversionRate}%</p>
              <p className="text-gray-600 text-sm">Taxa de Conversão</p>
              <p className="text-xs text-gray-500 mt-1">De lead para venda</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded-md">
                {formatCurrency(salesMetrics.averageTicket)}
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(salesMetrics.averageTicket)}</p>
              <p className="text-gray-600 text-sm">Ticket Médio</p>
              <p className="text-xs text-gray-500 mt-1">Por venda realizada</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de Vendas Mensais */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Evolução de Vendas</h3>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">Valor</button>
                <button className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded text-sm">Quantidade</button>
              </div>
            </div>
            <div className="h-80 flex items-end justify-between space-x-2">
              {chartData.map((value, index) => {
                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const maxValue = Math.max(...chartData.filter(v => v > 0));
                const height = value > 0 ? (value / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t transition-all duration-500 ${
                        value > 0 ? 'bg-gradient-to-t from-blue-500 to-purple-500' : 'bg-gray-200'
                      }`}
                      style={{ height: `${height}%`, minHeight: value > 0 ? '20px' : '4px' }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">{months[index]}</span>
                    {value > 0 && (
                      <span className="text-xs font-medium text-gray-900 mt-1">R$ {value}k</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Produtos */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Produtos</h3>
            <div className="space-y-4">
              {productPerformance.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${product.color} rounded-lg flex items-center justify-center text-lg`}>
                      {product.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.sales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{product.revenue}</p>
                    <p className={`text-sm ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.growth >= 0 ? '+' : ''}{product.growth}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalhes por Vendedor e Funil */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance por Vendedor */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance por Vendedor</h3>
            <div className="space-y-4">
              {sellerPerformance.map((seller, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    seller.isAI 
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${seller.bgColor} rounded-lg flex items-center justify-center ${
                      seller.isAI ? 'text-white font-bold' : 'font-bold text-lg'
                    }`}>
                      {seller.initials}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{seller.name}</h4>
                      <p className="text-sm text-gray-600">{seller.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{seller.sales} vendas</p>
                    <p className="text-sm font-medium text-green-600">{seller.revenue}</p>
                    <p className="text-xs text-gray-500">Conversão: {seller.conversion}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Funil de Conversão */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Funil de Conversão</h3>
            <div className="space-y-4">
              {conversionFunnel.map((stage, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {stage.count.toLocaleString()} {index > 0 && `(${stage.percentage}%)`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`bg-gradient-to-r ${stage.color} h-3 rounded-full transition-all duration-1000`}
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-green-900">Taxa final de conversão: 10.2%</span>
                </div>
                <p className="text-sm text-green-800 mt-1">Acima da meta de 8.5% para o período</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Detalhada */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Vendas Detalhadas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salesDetails.map((sale, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{sale.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{sale.client}</td>
                    <td className="px-6 py-4 text-gray-600">{sale.product}</td>
                    <td className="px-6 py-4 text-gray-600">{sale.seller}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{sale.value}</td>
                    <td className="px-6 py-4 text-green-600">{sale.commission}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[sale.status].color}`}>
                        {statusConfig[sale.status].label}
                      </span>
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