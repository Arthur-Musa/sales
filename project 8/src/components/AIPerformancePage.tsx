import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  Zap,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Lightbulb,
  Activity
} from 'lucide-react';

interface AIPerformancePageProps {
  onBack: () => void;
}

interface AIMetrics {
  conversationsProcessed: number;
  averageResponseTime: number;
  accuracyRate: number;
  automationRate: number;
  uptime: number;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface InteractionType {
  name: string;
  description: string;
  count: number;
  percentage: number;
  icon: string;
  color: string;
}

interface ScriptPerformance {
  name: string;
  successRate: number;
  description: string;
  color: string;
}

interface ActivityLog {
  id: string;
  type: 'success' | 'info' | 'update';
  title: string;
  description: string;
  details: string;
  timestamp: string;
  color: string;
}

const aiMetrics: AIMetrics = {
  conversationsProcessed: 2847,
  averageResponseTime: 1.2,
  accuracyRate: 94.6,
  automationRate: 87,
  uptime: 98.7,
  sentimentAnalysis: {
    positive: 68,
    neutral: 23,
    negative: 9
  }
};

const interactionTypes: InteractionType[] = [
  {
    name: 'Qualificação',
    description: 'Coleta de dados',
    count: 1247,
    percentage: 43.8,
    icon: '📋',
    color: 'bg-blue-50 border-blue-200'
  },
  {
    name: 'Cotação',
    description: 'Geração de propostas',
    count: 891,
    percentage: 31.3,
    icon: '📊',
    color: 'bg-green-50 border-green-200'
  },
  {
    name: 'Suporte',
    description: 'Dúvidas e ajuda',
    count: 456,
    percentage: 16.0,
    icon: '💬',
    color: 'bg-purple-50 border-purple-200'
  },
  {
    name: 'Follow-up',
    description: 'Recuperação',
    count: 253,
    percentage: 8.9,
    icon: '🔄',
    color: 'bg-orange-50 border-orange-200'
  }
];

const scriptPerformance: ScriptPerformance[] = [
  {
    name: 'Saudação Inicial',
    successRate: 94.2,
    description: 'Taxa de resposta positiva',
    color: 'green'
  },
  {
    name: 'Qualificação Auto',
    successRate: 87.8,
    description: 'Taxa de conversão',
    color: 'blue'
  },
  {
    name: 'Follow-up Vendas',
    successRate: 76.5,
    description: 'Taxa de recuperação',
    color: 'purple'
  }
];

const activityLogs: ActivityLog[] = [
  {
    id: '1',
    type: 'success',
    title: 'Cotação Gerada com Sucesso',
    description: 'Cliente: Maria Silva • Produto: Seguro Auto • Valor: R$ 1.247',
    details: 'Processamento: 1.2s • Scripts utilizados: Qualificação Auto v2.3',
    timestamp: 'há 2 min',
    color: 'bg-green-50 border-green-200'
  },
  {
    id: '2',
    type: 'info',
    title: 'Conversa Iniciada',
    description: 'Cliente: Pedro Santos • Canal: WhatsApp • Interesse: Seguro Vida',
    details: 'Resposta inicial enviada • Sentimento detectado: Positivo',
    timestamp: 'há 5 min',
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: '3',
    type: 'update',
    title: 'Script Atualizado',
    description: 'Script: Qualificação Auto • Versão: 2.3 → 2.4',
    details: 'Melhorias: Detecção de objeções • Taxa de sucesso esperada: +3%',
    timestamp: 'há 1h',
    color: 'bg-purple-50 border-purple-200'
  }
];

const hourlyEfficiency = [
  { period: '00h - 06h', efficiency: 45 },
  { period: '06h - 12h', efficiency: 92 },
  { period: '12h - 18h', efficiency: 96 },
  { period: '18h - 24h', efficiency: 78 }
];

export function AIPerformancePage({ onBack }: AIPerformancePageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('Últimos 7 dias');
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    // Simular dados do gráfico de performance
    setChartData([92.3, 94.1, 96.2, 95.8, 94.6, 89.7, 87.2]);
  }, []);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'bg-green-500';
    if (efficiency >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getScriptColor = (color: string) => {
    const colors = {
      green: 'bg-green-200 border-green-200',
      blue: 'bg-blue-200 border-blue-200',
      purple: 'bg-purple-200 border-purple-200'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-200';
  };

  const getScriptBarColor = (color: string) => {
    const colors = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'info':
        return MessageCircle;
      case 'update':
        return RefreshCw;
      default:
        return Activity;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Header */}
      <header 
        className="px-8 py-4"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button 
              onClick={onBack}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-gray-900 font-semibold text-lg">Olga</h1>
                <p className="text-gray-500 text-sm">Colaboradora Digital</p>
              </div>
            </button>
            <nav className="hidden md:flex space-x-6">
              <button className="text-gray-500 hover:text-gray-900 transition-colors py-2">Pipeline</button>
              <button className="text-gray-500 hover:text-gray-900 transition-colors py-2">Vendas</button>
              <button className="text-gray-500 hover:text-gray-900 transition-colors py-2">Comissões</button>
              <button className="text-gray-500 hover:text-gray-900 transition-colors py-2">Emissão</button>
              <button className="text-gray-900 font-medium relative py-2">
                Relatórios
                <div className="absolute -bottom-0 left-0 w-full h-0.5 bg-gray-900 rounded-full"></div>
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                C
              </div>
              <span className="text-gray-900 font-medium text-sm">Carlos Silva</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Performance da IA Olga</h2>
              <p className="text-gray-600">Análise detalhada de automação, eficiência e assertividade da IA</p>
            </div>
            <div className="flex items-center space-x-3">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option>Últimos 7 dias</option>
                <option>Últimos 30 dias</option>
                <option>Este mês</option>
                <option>Personalizado</option>
              </select>
              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {/* Status Geral da IA */}
          <div 
            className="rounded-xl p-6 text-white mb-8"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">IA Olga Online</h3>
                  <p className="text-white/80">Processando conversas em tempo real</p>
                  <p className="text-sm text-white/60 mt-1">Última atualização: há 2 segundos</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{aiMetrics.uptime}%</div>
                <div className="text-white/80">Uptime</div>
                <div className="text-sm text-white/60">Últimos 30 dias</div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
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
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-md">+127</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{aiMetrics.conversationsProcessed.toLocaleString()}</p>
              <p className="text-gray-600 text-sm">Conversas processadas</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 7 dias</p>
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
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-md">-0.3s</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{aiMetrics.averageResponseTime}s</p>
              <p className="text-gray-600 text-sm">Tempo médio resposta</p>
              <p className="text-xs text-gray-500 mt-1">Meta: &lt; 2s</p>
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
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-medium bg-purple-50 px-2 py-1 rounded-md">+2.1%</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{aiMetrics.accuracyRate}%</p>
              <p className="text-gray-600 text-sm">Taxa de assertividade</p>
              <p className="text-xs text-gray-500 mt-1">Respostas adequadas</p>
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
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded-md">{aiMetrics.automationRate}%</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{aiMetrics.automationRate}%</p>
              <p className="text-gray-600 text-sm">Taxa de automação</p>
              <p className="text-xs text-gray-500 mt-1">Sem intervenção humana</p>
            </div>
          </div>
        </div>

        {/* Gráficos e Análises */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Performance */}
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
              <h3 className="text-lg font-semibold text-gray-900">Performance ao Longo do Tempo</h3>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm">Assertividade</button>
                <button className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded text-sm">Velocidade</button>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((value, index) => {
                const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
                const maxValue = Math.max(...chartData);
                const height = (value / maxValue) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full rounded-t transition-all duration-500 bg-gradient-to-t from-purple-500 to-purple-300"
                      style={{ height: `${height}%`, minHeight: '20px' }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">{days[index]}</span>
                    <span className="text-xs font-medium text-gray-900 mt-1">{value}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Análise de Sentimentos */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Análise de Sentimentos dos Clientes</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Positivo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${aiMetrics.sentimentAnalysis.positive}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{aiMetrics.sentimentAnalysis.positive}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Neutro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${aiMetrics.sentimentAnalysis.neutral}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{aiMetrics.sentimentAnalysis.neutral}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Negativo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${aiMetrics.sentimentAnalysis.negative}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{aiMetrics.sentimentAnalysis.negative}%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Excelente Performance</span>
              </div>
              <p className="text-sm text-green-800 mt-1">91% de sentimentos positivos/neutros nas interações</p>
            </div>
          </div>
        </div>

        {/* Detalhes de Funcionalidades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tipos de Interação */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tipos de Interação</h3>
            <div className="space-y-4">
              {interactionTypes.map((interaction, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${interaction.color}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg">
                      {interaction.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{interaction.name}</div>
                      <div className="text-sm text-gray-600">{interaction.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{interaction.count.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{interaction.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eficiência por Horário */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Eficiência por Horário</h3>
            <div className="space-y-3">
              {hourlyEfficiency.map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{hour.period}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getEfficiencyColor(hour.efficiency)}`}
                        style={{ width: `${hour.efficiency}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{hour.efficiency}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Pico de Performance</div>
              <div className="text-sm text-blue-800">12h às 18h - Horário comercial</div>
            </div>
          </div>

          {/* Melhores Scripts */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(226, 232, 240, 0.6)',
              boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Scripts com Melhor Performance</h3>
            <div className="space-y-4">
              {scriptPerformance.map((script, index) => (
                <div key={index} className={`p-3 border rounded-lg ${getScriptColor(script.color)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{script.name}</span>
                    <span className={`text-sm font-bold text-${script.color}-600`}>{script.successRate}%</span>
                  </div>
                  <div className="text-sm text-gray-600">{script.description}</div>
                  <div className={`w-full ${getScriptColor(script.color)} rounded-full h-1.5 mt-2`}>
                    <div 
                      className={`${getScriptBarColor(script.color)} h-1.5 rounded-full`}
                      style={{ width: `${script.successRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              Otimizar Scripts
            </button>
          </div>
        </div>

        {/* Log de Atividades */}
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
            <h3 className="text-lg font-semibold text-gray-900">Log de Atividades da IA</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {activityLogs.map((log) => {
                const IconComponent = getActivityIcon(log.type);
                
                return (
                  <div key={log.id} className={`flex items-start space-x-4 p-4 rounded-lg border ${log.color}`}>
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className={`w-5 h-5 text-${log.type === 'success' ? 'green' : log.type === 'info' ? 'blue' : 'purple'}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{log.title}</h4>
                        <span className="text-sm text-gray-500">{log.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="font-medium">Olga AI</span>
            </div>
            <div className="flex items-center space-x-6 text-xs">
              <span>© 2025 Olga AI</span>
              <span>•</span>
              <span>IA Performance: {aiMetrics.accuracyRate}%</span>
              <span>•</span>
              <span>Uptime: {aiMetrics.uptime}%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}