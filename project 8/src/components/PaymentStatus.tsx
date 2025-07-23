import React from 'react';
import { CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface Payment {
  id: string;
  clientName: string;
  amount: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  policyIssued: boolean;
}

const payments: Payment[] = [
  {
    id: 'pay_1',
    clientName: 'Maria Santos',
    amount: 'R$ 847,50',
    method: 'PIX',
    status: 'completed',
    timestamp: '14:32',
    policyIssued: true
  },
  {
    id: 'pay_2',
    clientName: 'Carlos Freitas',
    amount: 'R$ 1.200,00',
    method: 'Cartão',
    status: 'pending',
    timestamp: '14:28',
    policyIssued: false
  },
  {
    id: 'pay_3',
    clientName: 'Ana Silva',
    amount: 'R$ 650,80',
    method: 'PIX',
    status: 'failed',
    timestamp: '14:15',
    policyIssued: false
  }
];

const statusConfig = {
  completed: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  failed: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle }
};

export function PaymentStatus() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pagamentos Stripe</h3>
            <p className="text-sm text-gray-600 mt-1">Status em tempo real</p>
          </div>
          <CreditCard className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {payments.map((payment) => {
          const config = statusConfig[payment.status];
          const IconComponent = config.icon;
          
          return (
            <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <IconComponent className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{payment.clientName}</p>
                    <p className="text-sm text-gray-500">{payment.method} • {payment.timestamp}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{payment.amount}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color} ${config.bg}`}>
                      {payment.status}
                    </span>
                    {payment.policyIssued && (
                      <span className="text-xs text-green-600">📄 Emitida</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}