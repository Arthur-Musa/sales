import React from 'react';
import { MessageCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Conversation {
  id: string;
  clientName: string;
  phone: string;
  status: 'active' | 'waiting_payment' | 'completed' | 'abandoned';
  lastMessage: string;
  timestamp: string;
  aiConfidence: number;
}

const conversations: Conversation[] = [
  {
    id: '1',
    clientName: 'Maria Santos',
    phone: '+55 11 99999-1234',
    status: 'waiting_payment',
    lastMessage: 'Link de pagamento enviado',
    timestamp: '2 min',
    aiConfidence: 95
  },
  {
    id: '2',
    clientName: 'João Oliveira',
    phone: '+55 11 88888-5678',
    status: 'completed',
    lastMessage: 'Apólice entregue com sucesso',
    timestamp: '5 min',
    aiConfidence: 98
  },
  {
    id: '3',
    clientName: 'Ana Costa',
    phone: '+55 11 77777-9012',
    status: 'active',
    lastMessage: 'Coletando documentos...',
    timestamp: '1 min',
    aiConfidence: 87
  },
  {
    id: '4',
    clientName: 'Pedro Lima',
    phone: '+55 11 66666-3456',
    status: 'abandoned',
    lastMessage: 'Abandonou na cotação',
    timestamp: '1h',
    aiConfidence: 72
  }
];

const statusConfig = {
  active: { color: 'bg-blue-100 text-blue-800', icon: MessageCircle },
  waiting_payment: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  abandoned: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
};

export function ConversationList() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Conversas WhatsApp</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Monitoramento em tempo real</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {conversations.map((conversation) => {
          const config = statusConfig[conversation.status];
          const IconComponent = config.icon;
          
          return (
            <div key={conversation.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{conversation.clientName}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{conversation.phone}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} mb-1`}>
                    <IconComponent className="w-3 h-3 mr-1 hidden sm:block" />
                    <span className="hidden sm:inline">{conversation.status.replace('_', ' ')}</span>
                    <span className="sm:hidden">•</span>
                  </div>
                  <p className="text-xs text-gray-500">{conversation.timestamp}</p>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs sm:text-sm text-gray-600 truncate flex-1 mr-2">{conversation.lastMessage}</p>
                <div className="text-xs text-gray-500">
                  IA: {conversation.aiConfidence}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}