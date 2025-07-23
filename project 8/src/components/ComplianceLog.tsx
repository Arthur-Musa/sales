import React from 'react';
import { Shield, Download, Search } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  client: string;
  details: string;
  compliant: boolean;
}

const logEntries: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:32:15',
    action: 'Consentimento LGPD Coletado',
    user: 'Sistema IA',
    client: 'Maria Santos',
    details: 'Opt-in confirmado via WhatsApp',
    compliant: true
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:30:42',
    action: 'Apólice Emitida',
    user: 'Sistema',
    client: 'João Silva',
    details: 'PDF gerado e enviado automaticamente',
    compliant: true
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:28:10',
    action: 'Dados Acessados',
    user: 'Carlos Silva',
    client: 'Ana Costa',
    details: 'Consulta dashboard - autorizado',
    compliant: true
  }
];

export function ComplianceLog() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Compliance & Auditoria</h3>
              <p className="text-sm text-gray-600">LGPD/SUSEP</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-1 font-medium text-gray-600">Timestamp</th>
                <th className="text-left py-2 px-1 font-medium text-gray-600">Ação</th>
                <th className="text-left py-2 px-1 font-medium text-gray-600">Usuário</th>
                <th className="text-left py-2 px-1 font-medium text-gray-600">Cliente</th>
                <th className="text-left py-2 px-1 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {logEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-1 text-gray-600">{entry.timestamp}</td>
                  <td className="py-3 px-1">
                    <div>
                      <p className="font-medium text-gray-900">{entry.action}</p>
                      <p className="text-xs text-gray-500">{entry.details}</p>
                    </div>
                  </td>
                  <td className="py-3 px-1 text-gray-600">{entry.user}</td>
                  <td className="py-3 px-1 text-gray-600">{entry.client}</td>
                  <td className="py-3 px-1">
                    {entry.compliant ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ⚠ Revisar
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}