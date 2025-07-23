import React from 'react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'sales', label: 'Vendas/Propostas' },
    { id: 'commissions', label: 'Comissões' },
    { id: 'issuance', label: 'Emissão' },
    { id: 'recovery', label: 'Recuperação' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'users', label: 'Usuários' }
  ];

  return (
    <nav className="hidden md:flex space-x-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative py-2 text-sm transition-colors ${
            activeTab === tab.id
              ? 'text-gray-900 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute -bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>
          )}
        </button>
      ))}
    </nav>
  );
};