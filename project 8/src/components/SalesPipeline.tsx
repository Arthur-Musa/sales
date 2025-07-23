import React from 'react';

interface PipelineStage {
  name: string;
  count: number;
  value: string;
  color: string;
}

const pipelineData: PipelineStage[] = [
  { name: 'Leads', count: 342, value: 'R$ 89.4K', color: 'bg-blue-500' },
  { name: 'Qualificados', count: 156, value: 'R$ 67.2K', color: 'bg-indigo-500' },
  { name: 'Cotação', count: 89, value: 'R$ 45.8K', color: 'bg-purple-500' },
  { name: 'Pagamento', count: 34, value: 'R$ 28.1K', color: 'bg-orange-500' },
  { name: 'Fechados', count: 23, value: 'R$ 21.7K', color: 'bg-green-500' }
];

export function SalesPipeline() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Pipeline de Vendas</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Conversão em tempo real</p>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {pipelineData.map((stage, index) => (
            <div key={stage.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                <span className="text-sm sm:text-base font-medium text-gray-900">{stage.name}</span>
              </div>
              
              <div className="text-right">
                <p className="text-sm sm:text-base font-semibold text-gray-900">{stage.count}</p>
                <p className="text-xs sm:text-sm text-gray-600">{stage.value}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Taxa de Conversão:</span>
            <span className="font-semibold text-green-600">6.7%</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm mt-1">
            <span className="text-gray-600">Ticket Médio:</span>
            <span className="font-semibold text-gray-900">R$ 943</span>
          </div>
        </div>
      </div>
    </div>
  );
}