import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Globe,
  Mail,
  MessageCircle,
  CreditCard,
  Shield,
  Database,
  Zap
} from 'lucide-react';
import { api } from '../lib/supabase';

interface SystemConfig {
  key: string;
  value: any;
  description?: string;
  is_sensitive: boolean;
  category: string;
}

const configCategories = {
  'integrations': {
    title: 'Integrações',
    icon: Globe,
    color: 'bg-blue-100 text-blue-600'
  },
  'email': {
    title: 'Email',
    icon: Mail,
    color: 'bg-green-100 text-green-600'
  },
  'whatsapp': {
    title: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-100 text-green-600'
  },
  'payments': {
    title: 'Pagamentos',
    icon: CreditCard,
    color: 'bg-purple-100 text-purple-600'
  },
  'security': {
    title: 'Segurança',
    icon: Shield,
    color: 'bg-red-100 text-red-600'
  },
  'database': {
    title: 'Banco de Dados',
    icon: Database,
    color: 'bg-gray-100 text-gray-600'
  },
  'automation': {
    title: 'Automação',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-600'
  }
};

export function SystemConfigPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemConfigs();
      
      // Organize configs by category
      const organizedConfigs = data.map(config => ({
        ...config,
        category: getCategoryFromKey(config.key)
      }));
      
      setConfigs(organizedConfigs);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromKey = (key: string): string => {
    if (key.includes('email')) return 'email';
    if (key.includes('whatsapp')) return 'whatsapp';
    if (key.includes('stripe') || key.includes('payment')) return 'payments';
    if (key.includes('jwt') || key.includes('secret') || key.includes('key')) return 'security';
    if (key.includes('database') || key.includes('db')) return 'database';
    if (key.includes('n8n') || key.includes('automation')) return 'automation';
    return 'integrations';
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(key);
      const newValue = editedValues[key];
      await api.updateSystemConfig(key, newValue);
      
      // Update local state
      setConfigs(prev => prev.map(config => 
        config.key === key ? { ...config, value: newValue } : config
      ));
      
      // Clear edited value
      setEditedValues(prev => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
      
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(null);
    }
  };

  const toggleSensitiveVisibility = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleValueChange = (key: string, value: any) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderConfigValue = (config: SystemConfig) => {
    const currentValue = editedValues[config.key] !== undefined ? editedValues[config.key] : config.value;
    const isEdited = editedValues[config.key] !== undefined;

    if (config.is_sensitive && !showSensitive[config.key]) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="password"
            value="••••••••••••"
            disabled
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
          <button
            onClick={() => toggleSensitiveVisibility(config.key)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      );
    }

    if (typeof currentValue === 'object') {
      return (
        <textarea
          value={JSON.stringify(currentValue, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleValueChange(config.key, parsed);
            } catch {
              // Invalid JSON, keep as string for now
              handleValueChange(config.key, e.target.value);
            }
          }}
          className={`w-full px-3 py-2 border rounded-md font-mono text-sm ${
            isEdited ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
          }`}
          rows={4}
        />
      );
    }

    if (typeof currentValue === 'boolean') {
      return (
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentValue}
            onChange={(e) => handleValueChange(config.key, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            {currentValue ? 'Habilitado' : 'Desabilitado'}
          </span>
        </label>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <input
          type={config.is_sensitive ? 'password' : 'text'}
          value={currentValue || ''}
          onChange={(e) => handleValueChange(config.key, e.target.value)}
          className={`flex-1 px-3 py-2 border rounded-md ${
            isEdited ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
          }`}
          placeholder={config.description}
        />
        {config.is_sensitive && (
          <button
            onClick={() => toggleSensitiveVisibility(config.key)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            {showSensitive[config.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  };

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Configurações do Sistema</h2>
            <p className="text-gray-600">Gerencie integrações, APIs e configurações globais</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchConfigs}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recarregar</span>
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-900">Atenção</h4>
              <p className="text-sm text-yellow-800">
                Alterações nas configurações podem afetar o funcionamento do sistema. 
                Teste em ambiente de desenvolvimento antes de aplicar em produção.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Categories */}
        <div className="space-y-6">
          {Object.entries(groupedConfigs).map(([categoryKey, categoryConfigs]) => {
            const category = configCategories[categoryKey as keyof typeof configCategories];
            const IconComponent = category?.icon || Settings;

            return (
              <div key={categoryKey} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${category?.color || 'bg-gray-100 text-gray-600'} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category?.title || categoryKey}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {categoryConfigs.length} configuração(ões)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {categoryConfigs.map((config) => {
                    const isEdited = editedValues[config.key] !== undefined;
                    const isSaving = saving === config.key;

                    return (
                      <div key={config.key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">{config.key}</h4>
                              {config.is_sensitive && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                  Sensível
                                </span>
                              )}
                              {isEdited && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  Modificado
                                </span>
                              )}
                            </div>
                            {config.description && (
                              <p className="text-sm text-gray-600">{config.description}</p>
                            )}
                          </div>
                          
                          {isEdited && (
                            <button
                              onClick={() => handleSave(config.key)}
                              disabled={isSaving}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isSaving ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Valor
                          </label>
                          {renderConfigValue(config)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Test Connections */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Testar Conexões</h3>
            <p className="text-sm text-gray-600">Verificar se as integrações estão funcionando</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span>Testar WhatsApp</span>
              </button>
              
              <button className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>Testar Email</span>
              </button>
              
              <button className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>Testar Stripe</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}