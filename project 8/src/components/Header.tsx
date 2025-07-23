import React from 'react';
import React, { useState } from 'react';
import { Settings, Share } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenConfig?: () => void;
  onOpenProfile?: () => void;
}

const Navigation: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = ({ activeTab, onTabChange }) => {
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

export function Header({ activeTab, onTabChange, onOpenConfig, onOpenProfile }: HeaderProps) {
  // Mock user data for development
  const user = {
    full_name: 'Carlos Silva (Demo)',
    email: 'demo@olga-ai.com',
    role: 'admin'
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <button 
              onClick={() => onTabChange('pipeline')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-gray-900 font-medium text-base">Olga</h1>
              </div>
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <Navigation activeTab={activeTab} onTabChange={onTabChange} />
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button className="hidden sm:block p-2 rounded-md hover:bg-gray-50 transition-colors">
              <Share className="w-4 h-4 text-gray-500" />
            </button>
            <button 
              onClick={onOpenConfig}
              className="hidden sm:block p-2 rounded-md hover:bg-gray-50 text-gray-500 transition-colors"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="relative group">
              <button className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-xs">
                  {user ? getInitials(user.full_name) : 'U'}
                </div>
                <span className="hidden sm:block text-gray-900 font-medium text-sm">
                  {user ? user.full_name.split(' ')[0] : 'Usuário'}
                </span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-blue-600 capitalize">{user?.role}</p>
                  </div>
                  <button 
                    onClick={onOpenProfile}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Meu Perfil
                  </button>
                  <button 
                    onClick={() => alert('Configurações de conta em desenvolvimento')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Configurações da Conta
                  </button>
                  <div className="border-t border-gray-100">
                    <button 
                      onClick={() => alert('Logout desabilitado durante desenvolvimento')}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'pipeline', label: 'Pipeline' },
                { id: 'sales', label: 'Vendas' },
                { id: 'commissions', label: 'Comissões' },
                { id: 'issuance', label: 'Emissão' },
                { id: 'recovery', label: 'Recuperação' },
                { id: 'reports', label: 'Relatórios' },
                { id: 'users', label: 'Usuários' },
                { id: 'config', label: 'Config' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}