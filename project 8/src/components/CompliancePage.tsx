import React, { useState } from 'react';
import { 
  Shield, 
  Download, 
  Search, 
  CheckCircle, 
  FileText, 
  Lock, 
  Clock, 
  Plus, 
  Filter,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userType: 'ia' | 'admin' | 'vendedor' | 'sistema';
  action: string;
  details: string;
  ipLocation: string;
  status: 'validado' | 'autorizado' | 'conforme' | 'concluido' | 'gerado';
  initials: string;
  bgColor: string;
}

interface ComplianceMetric {
  title: string;
  value: string;
  description: string;
  badge: string;
  icon: React.ComponentType<any>;
  iconColor: string;
}

const auditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '22/01/25 14:32:47',
    user: 'IA Olga',
    userType: 'ia',
    action: 'Emissão de Apólice',
    details: 'Apólice #00123456789 • Maria José Silva • R$ 1.247,50',
    ipLocation: 'Sistema Interno',
    status: 'validado',
    initials: 'IA',
    bgColor: 'bg-purple-100'
  },
  {
    id: '2',
    timestamp: '22/01/25 11:15:23',
    user: 'Carlos Silva',
    userType: 'admin',
    action: 'Acesso ao Sistema',
    details: 'Login administrativo • Dashboard principal',
    ipLocation: '192.168.1.100 • São Paulo/SP',
    status: 'autorizado',
    initials: 'CS',
    bgColor: 'bg-blue-100'
  },
  {
    id: '3',
    timestamp: '22/01/25 09:45:12',
    user: 'Maria Oliveira',
    userType: 'vendedor',
    action: 'Consulta de Cliente',
    details: 'CPF: ***.***.***-78 • Histórico de apólices',
    ipLocation: '192.168.1.102 • São Paulo/SP',
    status: 'conforme',
    initials: 'MO',
    bgColor: 'bg-green-100'
  },
  {
    id: '4',
    timestamp: '22/01/25 08:00:01',
    user: 'Sistema',
    userType: 'sistema',
    action: 'Backup Automático',
    details: 'Backup completo • 2.847 registros • Criptografia AES-256',
    ipLocation: 'Servidor Primário',
    status: 'concluido',
    initials: 'SYS',
    bgColor: 'bg-gray-100'
  },
  {
    id: '5',
    timestamp: '21/01/25 23:59:59',
    user: 'Sistema',
    userType: 'sistema',
    action: 'Relatório Fiscal',
    details: 'Geração automática • 346 transações • Arquivo gerado',
    ipLocation: 'Sistema Interno',
    status: 'gerado',
    initials: 'SYS',
    bgColor: 'bg-gray-100'
  }
];

const complianceMetrics: ComplianceMetric[] = [
  {
    title: '347',
    description: 'Transações Validadas',
    badge: '100%',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  {
    title: '2,847',
    description: 'Logs de Auditoria',
    badge: 'Diário',
    icon: FileText,
    iconColor: 'text-blue-600'
  },
  {
    title: '100%',
    description: 'Dados Protegidos',
    badge: 'LGPD',
    icon: Lock,
    iconColor: 'text-purple-600'
  },
  {
    title: '0',
    description: 'Não Conformidades',
    badge: '0',
    icon: Clock,
    iconColor: 'text-orange-600'
  }
];

const statusConfig = {
  validado: { label: 'Validado', color: 'bg-green-100 text-green-800' },
  autorizado: { label: 'Autorizado', color: 'bg-green-100 text-green-800' },
  conforme: { label: 'Conforme', color: 'bg-green-100 text-green-800' },
  concluido: { label: 'Concluído', color: 'bg-blue-100 text-blue-800' },
  gerado: { label: 'Gerado', color: 'bg-green-100 text-green-800' }
};

const complianceChecklist = [
  { item: 'Proteção de Dados (LGPD)', status: 'Conforme' },
  { item: 'Código de Defesa do Consumidor', status: 'Validado' },
  { item: 'Transparência Comercial', status: 'Completa' },
  { item: 'Auditoria de Processos', status: 'Auditado' },
  { item: 'Relatórios Fiscais', status: 'Em dia' }
];

const auditHistory = [
  {
    title: 'Auditoria Mensal de Compliance',
    description: '347 transações validadas • 100% conformidade',
    details: 'Status: Aprovado • Relatório: #2025-01-001',
    timestamp: 'Hoje 08:00',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  {
    title: 'Backup de Logs',
    description: '2.847 registros armazenados • Criptografia AES-256',
    details: 'Local: Servidor seguro • Retenção: 7 anos',
    timestamp: 'Ontem 23:59',
    icon: FileText,
    iconColor: 'text-blue-600'
  },
  {
    title: 'Verificação LGPD',
    description: 'Políticas de privacidade atualizadas',
    details: 'Consent management • Direito ao esquecimento',
    timestamp: 'Há 3 dias',
    icon: Lock,
    iconColor: 'text-purple-600'
  }
];

export function CompliancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('Este mês');
  const [actionFilter, setActionFilter] = useState('Todas as ações');

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6 max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Relatório de Compliance</h2>
            <p className="text-gray-600">Auditoria e conformidade com regulamentações aplicáveis</p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option>Este mês</option>
              <option>Último mês</option>
              <option>Últimos 3 meses</option>
              <option>Este ano</option>
            </select>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center space-x-2 text-sm">
              <Download className="w-4 h-4" />
              <span>Exportar Relatório</span>
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 text-sm">
              Gerar Auditoria
            </button>
          </div>
        </div>

        {/* Status de Compliance */}
        <div 
          className="rounded-xl p-6 text-white mb-8"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">100% Compliance</h3>
                <p className="text-white/80">Conformidade com regulamentações aplicáveis</p>
                <p className="text-sm text-white/60 mt-1">Última verificação: hoje às 08:00</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">CNPJ</div>
              <div className="text-white/80">00.123.456/0001-78</div>
              <div className="text-sm text-white/60">Intermediação de Seguros</div>
            </div>
          </div>
        </div>

        {/* Métricas de Compliance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {complianceMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                  metric.badge === '100%' ? 'text-green-600 bg-green-50' :
                  metric.badge === 'Diário' ? 'text-blue-600 bg-blue-50' :
                  metric.badge === 'LGPD' ? 'text-purple-600 bg-purple-50' :
                  'text-orange-600 bg-orange-50'
                }`}>
                  {metric.badge}
                </span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{metric.title}</p>
                <p className="text-gray-600 text-sm">{metric.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {index === 0 ? 'Todas em conformidade' :
                   index === 1 ? 'Registros detalhados' :
                   index === 2 ? 'Conformidade LGPD' :
                   'Últimos 30 dias'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Checklist de Compliance e Histórico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Checklist de Conformidade */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Checklist de Conformidade</h3>
            <div className="space-y-4">
              {complianceChecklist.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">{item.item}</span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico de Validações */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Histórico de Auditorias</h3>
            <div className="space-y-4">
              {auditHistory.map((audit, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 ${
                    audit.iconColor === 'text-green-600' ? 'bg-green-100' :
                    audit.iconColor === 'text-blue-600' ? 'bg-blue-100' :
                    'bg-purple-100'
                  } rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <audit.icon className={`w-5 h-5 ${audit.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{audit.title}</h4>
                      <span className="text-sm text-gray-500">{audit.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{audit.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{audit.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Detalhados */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Logs de Auditoria Detalhados</h3>
              <div className="flex items-center space-x-2">
                <select 
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option>Todas as ações</option>
                  <option>Vendas</option>
                  <option>Emissões</option>
                  <option>Cancelamentos</option>
                  <option>Alterações</option>
                </select>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Filtrar
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP/Localização</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{log.timestamp}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 ${log.bgColor} rounded-full flex items-center justify-center ${
                          log.userType === 'ia' ? 'text-purple-600' :
                          log.userType === 'admin' ? 'text-blue-600' :
                          log.userType === 'vendedor' ? 'text-green-600' :
                          'text-gray-600'
                        } text-xs font-bold`}>
                          {log.initials}
                        </div>
                        <span className="font-medium text-gray-900">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.action}</td>
                    <td className="px-6 py-4 text-gray-600">{log.details}</td>
                    <td className="px-6 py-4 text-gray-600">{log.ipLocation}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[log.status].color}`}>
                        {statusConfig[log.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Mostrando</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>50</option>
                  <option>100</option>
                  <option>200</option>
                </select>
                <span className="text-sm text-gray-700">de 2,847 registros</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Anterior
                </button>
                <button className="px-3 py-1 bg-gray-900 text-white rounded text-sm">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">3</button>
                <span className="text-gray-500">...</span>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">57</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Certificações */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Código SUSEP</h4>
            <p className="text-sm text-gray-600 mb-4">Não aplicável - Intermediação</p>
            <button className="w-full bg-gray-300 text-gray-600 py-2 px-4 rounded-lg cursor-not-allowed text-sm" disabled>
              Não Emitimos
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Conformidade LGPD</h4>
            <p className="text-sm text-gray-600 mb-4">Última auditoria: 15/01/2025</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm">
              Relatório LGPD
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Auditoria de Processos</h4>
            <p className="text-sm text-gray-600 mb-4">Próxima: 01/02/2025</p>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 text-sm">
              Agendar Auditoria
            </button>
          </div>
        </div>
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
              <span>Compliance: 100%</span>
              <span>•</span>
              <span>LGPD Conforme</span>
              <span>•</span>
              <span>Intermediação de Seguros</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}