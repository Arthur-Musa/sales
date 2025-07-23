import React, { useState } from 'react';
import { 
  BarChart3, 
  Lightbulb, 
  Shield, 
  DollarSign, 
  Plus, 
  Clock, 
  Settings, 
  Download, 
  CheckCircle, 
  RefreshCw, 
  FileText, 
  Calendar,
  Filter,
  Archive,
  Zap
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'vendas' | 'compliance' | 'fiscal' | 'ia';
  lastGenerated: string;
  schedule: 'manual' | 'agendado' | 'diario' | 'mensal';
  iconColor: string;
  bgColor: string;
}

interface ExportHistory {
  id: string;
  filename: string;
  description: string;
  status: 'concluido' | 'processando' | 'arquivado';
  progress?: number;
  timestamp: string;
  records: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: string;
  nextRun: string;
  status: 'ativo' | 'pausado';
}

interface ReportsPageProps {
  onViewSalesReport?: () => void;
  onViewAIPerformance?: () => void;
  onViewCompliance?: () => void;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Relatório de Vendas',
    description: 'Performance de vendas detalhada',
    category: 'vendas',
    lastGenerated: '2h atrás',
    schedule: 'agendado',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: '2',
    name: 'Performance IA',
    description: 'Automação e eficiência da IA',
    category: 'ia',
    lastGenerated: '1h atrás',
    schedule: 'manual',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: '3',
    name: 'Compliance SUSEP',
    description: 'Auditoria e conformidade',
    category: 'compliance',
    lastGenerated: 'Hoje 08:00',
    schedule: 'diario',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: '4',
    name: 'Relatório Fiscal',
    description: 'Movimentação financeira',
    category: 'fiscal',
    lastGenerated: 'Ontem 23:59',
    schedule: 'mensal',
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  }
];

const exportHistory: ExportHistory[] = [
  {
    id: '1',
    filename: 'vendas_janeiro_2025.csv',
    description: 'Relatório de Vendas - 1,247 registros',
    status: 'concluido',
    timestamp: 'há 30min',
    records: '1,247'
  },
  {
    id: '2',
    filename: 'compliance_susep_mensal.pdf',
    description: 'Compliance SUSEP - 234,567 registros',
    status: 'processando',
    progress: 65,
    timestamp: 'há 15min',
    records: '234,567'
  },
  {
    id: '3',
    filename: 'performance_ia_dezembro.pdf',
    description: 'Performance IA - há 2 dias',
    status: 'arquivado',
    timestamp: 'há 2 dias',
    records: '45,123'
  }
];

const scheduledReports: ScheduledReport[] = [
  {
    id: '1',
    name: 'Vendas Diário',
    frequency: 'Todo dia às 08:00',
    nextRun: 'amanhã 08:00',
    status: 'ativo'
  },
  {
    id: '2',
    name: 'Compliance Mensal',
    frequency: 'Todo dia 1º às 06:00',
    nextRun: '01/02 06:00',
    status: 'ativo'
  },
  {
    id: '3',
    name: 'Fiscal Trimestral',
    frequency: 'A cada 3 meses',
    nextRun: 'Pausado temporariamente',
    status: 'pausado'
  }
];

export function ReportsPage({ onViewSalesReport, onViewAIPerformance, onViewCompliance }: ReportsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [autoEmail, setAutoEmail] = useState(true);
  const [autoCompression, setAutoCompression] = useState(true);
  const [cloudBackup, setCloudBackup] = useState(false);
  const [defaultFormat, setDefaultFormat] = useState('CSV');
  const [retention, setRetention] = useState(90);

  const getReportIcon = (category: string) => {
    switch (category) {
      case 'vendas':
        return BarChart3;
      case 'ia':
        return Lightbulb;
      case 'compliance':
        return Shield;
      case 'fiscal':
        return DollarSign;
      default:
        return FileText;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return CheckCircle;
      case 'processando':
        return RefreshCw;
      case 'arquivado':
        return Archive;
      default:
        return FileText;
    }
  };

  const handleReportClick = (template: ReportTemplate) => {
    if (template.id === '1' && onViewSalesReport) {
      onViewSalesReport();
    } else if (template.id === '2' && onViewAIPerformance) {
      onViewAIPerformance();
    } else if (template.id === '3' && onViewCompliance) {
      onViewCompliance();
    } else {
      alert(`Gerando relatório: ${template.name}`);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Relatórios & Exportações</h2>
              <p className="text-gray-600">Extrair insights estratégicos e gerar documentos operacionais/fiscais customizados</p>
            </div>
                onClick={() => alert('Criando novo relatório personalizado')}
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Novo Relatório</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                onClick={() => alert('Abrindo gerenciador de agendamentos')}
                <Clock className="w-4 h-4" />
                <span>Agendamentos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
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
              <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-md">Este mês</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">127</p>
              <p className="text-gray-600 text-sm">Relatórios gerados</p>
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
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-md">Automático</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">23</p>
              <p className="text-gray-600 text-sm">Agendamentos ativos</p>
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
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-medium bg-purple-50 px-2 py-1 rounded-md">Grande volume</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">2.4M</p>
              <p className="text-gray-600 text-sm">Registros exportados</p>
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
                <CheckCircle className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded-md">Compliance</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">100%</p>
              <p className="text-gray-600 text-sm">Taxa conformidade</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Relatórios Rápidos */}
          <div className="lg:col-span-2">
            <div 
              className="p-6 rounded-2xl border mb-6"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(226, 232, 240, 0.6)',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Relatórios Rápidos</h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSelectedCategory('Todos')}
                    className={`px-3 py-1 rounded text-sm ${selectedCategory === 'Todos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('Vendas')}
                    className={`px-3 py-1 rounded text-sm ${selectedCategory === 'Vendas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Vendas
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('Compliance')}
                    className={`px-3 py-1 rounded text-sm ${selectedCategory === 'Compliance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Compliance
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('Fiscais')}
                    className={`px-3 py-1 rounded text-sm ${selectedCategory === 'Fiscais' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Fiscais
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template) => {
                  const IconComponent = getReportIcon(template.category);
                  
                  return (
                    <div 
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all cursor-pointer"
                      onClick={() => handleReportClick(template)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${template.bgColor} rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`w-5 h-5 ${template.iconColor}`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.description}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button className="p-1 text-blue-600 hover:text-blue-800" title="Gerar CSV">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-800" title="Gerar PDF">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {template.category === 'vendas' && 'Inclui: Conversão, pipeline, vendedores, produtos'}
                        {template.category === 'ia' && 'Inclui: Taxa automação, tempo resposta, assertividade'}
                        {template.category === 'compliance' && 'Inclui: Logs auditoria, transações, validações'}
                        {template.category === 'fiscal' && 'Inclui: Faturamento, impostos, comissões'}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Última geração: {template.lastGenerated}</span>
                        <span className={`px-2 py-1 rounded ${
                          template.schedule === 'agendado' ? 'bg-green-100 text-green-800' :
                          template.schedule === 'diario' ? 'bg-green-100 text-green-800' :
                          template.schedule === 'mensal' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {template.schedule === 'agendado' ? 'Agendado' :
                           template.schedule === 'diario' ? 'Diário' :
                           template.schedule === 'mensal' ? 'Mensal' :
                           'Manual'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Histórico de Exportações */}
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
                <h3 className="text-lg font-semibold text-gray-900">Histórico de Exportações</h3>
                <button className="text-sm text-gray-500 hover:text-gray-700">Ver todos</button>
              </div>

              <div className="space-y-3">
                {exportHistory.map((export_) => {
                  const StatusIcon = getStatusIcon(export_.status);
                  
                  return (
                    <div 
                      key={export_.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        export_.status === 'concluido' ? 'bg-green-50 border-green-200' :
                        export_.status === 'processando' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          export_.status === 'concluido' ? 'bg-green-100' :
                          export_.status === 'processando' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          <StatusIcon className={`w-4 h-4 ${
                            export_.status === 'concluido' ? 'text-green-600' :
                            export_.status === 'processando' ? 'text-blue-600 animate-spin' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{export_.filename}</div>
                          <div className="text-sm text-gray-600">{export_.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {export_.status === 'processando' && export_.progress && (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${export_.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-blue-600">{export_.progress}%</span>
                          </div>
                        )}
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          export_.status === 'concluido' ? 'bg-green-100 text-green-800' :
                          export_.status === 'processando' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {export_.status === 'concluido' ? 'Concluído' :
                           export_.status === 'processando' ? 'Processando' :
                           'Arquivado'}
                        </span>
                        {export_.status === 'concluido' && (
                          <button className="text-green-600 hover:text-green-800 p-1">
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = '#';
                              link.download = export_.filename;
                              link.click();
                              alert(`Baixando ${export_.filename}`);
                            }}
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agendamentos Ativos */}
            <div 
              className="p-6 rounded-2xl border"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(226, 232, 240, 0.6)',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
              }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agendamentos Ativos</h3>
              <div className="space-y-4">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{report.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        report.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status === 'ativo' ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">{report.frequency}</div>
                    <div className="text-xs text-gray-500">Próxima: {report.nextRun}</div>
                  </div>
                ))}
              </div>
                onClick={() => alert('Abrindo gerenciador de agendamentos')}

              <button className="w-full mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                Gerenciar Agendamentos
              </button>
            </div>

            {/* Templates Personalizados */}
            <div 
              className="p-6 rounded-2xl border"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(226, 232, 240, 0.6)',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
              }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Templates Personalizados</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Relatório Executivo</div>
                    <div className="text-xs text-gray-500">Para diretoria</div>
                  </div>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">Auditoria Externa</div>
                    <div className="text-xs text-gray-500">SUSEP/ANS</div>
                  </div>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium">Performance IA</div>
                    <div className="text-xs text-gray-500">Otimização</div>
                  </div>
                </button>
              </div>
                onClick={() => alert('Abrindo criador de templates')}

              <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Criar Template
              </button>
            </div>

            {/* Configurações de Export */}
            <div 
              className="p-6 rounded-2xl border"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(226, 232, 240, 0.6)',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)'
              }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Auto-envio por email</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoEmail}
                      onChange={(e) => setAutoEmail(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Compressão automática</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoCompression}
                      onChange={(e) => setAutoCompression(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Backup na nuvem</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={cloudBackup}
                      onChange={(e) => setCloudBackup(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Formato padrão</label>
                  <select 
                    value={defaultFormat}
                    onChange={(e) => setDefaultFormat(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option>CSV</option>
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>JSON</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retenção (dias)</label>
                  <input 
                    type="number" 
                    value={retention}
                    onChange={(e) => setRetention(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}