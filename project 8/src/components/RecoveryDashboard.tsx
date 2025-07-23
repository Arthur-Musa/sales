import React from 'react';
import { RefreshCw, TrendingUp, Users, MessageSquare } from 'lucide-react';

interface RecoveryData {
  totalAbandoned: number;
  recovered: number;
  inProgress: number;
  recoveryRate: string;
}

const recoveryData: RecoveryData = {
  totalAbandoned: 127,
  recovered: 34,
  inProgress: 18,
  recoveryRate: '26.8%'
};

export function RecoveryDashboard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recuperação de Vendas</h3>
            <p className="text-sm text-gray-600 mt-1">Automação de reengajamento</p>
          </div>
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-red-500 mr-1" />
            </div>
            <p className="text-2xl font-bold text-red-600">{recoveryData.totalAbandoned}</p>
            <p className="text-sm text-gray-600">Abandonados</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-500 mr-1" />
            </div>
            <p className="text-2xl font-bold text-green-600">{recoveryData.recovered}</p>
            <p className="text-sm text-gray-600">Recuperados</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Taxa de Recuperação</span>
            <span className="font-semibold text-green-600">{recoveryData.recoveryRate}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: recoveryData.recoveryRate }}></div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-gray-600">Em andamento</span>
            <span className="font-medium text-orange-600">{recoveryData.inProgress}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Iniciar Campanha</span>
          </button>
        </div>
      </div>
    </div>
  );
}