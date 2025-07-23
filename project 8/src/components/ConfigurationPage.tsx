import React, { useState } from 'react';
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
  Zap,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Users,
  Building,
  Heart,
  Home,
  Car,
  ArrowLeft
} from 'lucide-react';

interface ConfigurationPageProps {
  onBack?: () => void;
}

export function ConfigurationPage({ onBack }: ConfigurationPageProps) {
  // Mock user data for development
  const user = {
    full_name: 'Carlos Silva (Demo)',
    email: 'demo@olga-ai.com',
    role: 'admin'
  };
  
  const [activeTab, setActiveTab] = useState('produtos');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

  const toggleSensitiveVisibility = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddProduct = () => {
    const formData = new FormData(document.querySelector('#addProductForm') as HTMLFormElement);
    const productData = {
      name: formData.get('name'),
      category: formData.get('category'),
      description: formData.get('description'),
      commission: formData.get('commission')
    };
    console.log('Adicionando produto:', productData);
    alert(`Produto "${productData.name}" adicionado com sucesso!`);
    setShowAddProductModal(false);
  };

  const handleConfirmRestore = () => {
    console.log('Restaurando configurações para o padrão');
    alert('Todas as configurações foram restauradas para os valores padrão!');
    setShowRestoreModal(false);
  };

  const editProduct = (productType: string) => {
    console.log(`Editando produto: ${productType}`);
    alert(`Abrindo editor para ${productType}`);
  };

  const editTemplate = (templateType: string) => {
    console.log(`Editando template: ${templateType}`);
    alert(`Abrindo editor de template: ${templateType}`);
  };

  const toggleIntegration = (integration: string) => {
    console.log(`Alternando integração: ${integration}`);
    alert(`Integração ${integration} ${Math.random() > 0.5 ? 'ativada' : 'desativada'}`);
  };

  const products = [
    {
      id: 'auto',
      name: 'Seguro Auto',
      description: 'Cobertura completa para veículos',
      commission: 8,
      status: 'ativo',
      icon: Car,
      color: 'bg-blue-100 text-blue-600',
      lastUpdate: 'há 2 dias'
    },
    {
      id: 'vida',
      name: 'Seguro Vida',
      description: 'Proteção familiar e individual',
      commission: 12,
      status: 'ativo',
      icon: Heart,
      color: 'bg-green-100 text-green-600',
      lastUpdate: 'há 1 semana'
    },
    {
      id: 'residencial',
      name: 'Seguro Residencial',
      description: 'Casa, apartamento e conteúdo',
      commission: 6,
      status: 'ativo',
      icon: Home,
      color: 'bg-purple-100 text-purple-600',
      lastUpdate: 'há 3 dias'
    },
    {
      id: 'empresarial',
      name: 'Seguro Empresarial',
      description: 'Proteção para negócios',
      commission: 10,
      status: 'desenvolvimento',
      icon: Building,
      color: 'bg-orange-100 text-orange-600',
      lastUpdate: 'Em desenvolvimento'
    }
  ];

  const integrations = [
    {
      id: 'zapi',
      name: 'ZAPI WhatsApp',
      description: 'Integração oficial do WhatsApp',
      status: 'conectado',
      icon: MessageCircle,
      color: 'bg-green-100 text-green-600',
      config: {
        token: 'sk_live_4e•••••7dc',
        instance: 'olga-insurance-bot'
      }
    },
    {
      id: 'stripe',
      name: 'Stripe Payments',
      description: 'Gateway de pagamentos',
      status: 'conectado',
      icon: CreditCard,
      color: 'bg-blue-100 text-blue-600',
      config: {
        secretKey: 'sk_live_4e•••••7dc',
        webhookUrl: 'https://api.olga.com/webhooks/stripe'
      }
    },
    {
      id: 'n8n',
      name: 'n8n Automation',
      description: 'Orquestração de workflows',
      status: 'conectado',
      icon: Zap,
      color: 'bg-indigo-100 text-indigo-600',
      config: {
        endpoint: 'https://n8n.olga-ai.com',
        apiKey: 'n8n_api_xxx...xxxxx'
      }
    },
    {
      id: 'sendgrid',
      name: 'SendGrid E-mail',
      description: 'Envio de e-mails transacionais',
      status: 'conectado',
      icon: Mail,
      color: 'bg-red-100 text-red-600',
      config: {
        apiKey: 'SG.xxxxxxxxxxxxxxxx',
        domain: 'mail.olga-ai.com'
      }
    }
  ];

  const templates = [
    {
      id: 'saudacao',
      name: 'Saudação Inicial',
      description: 'Primeira mensagem enviada aos novos leads',
      content: 'Olá! 👋 Sou a Olga, sua assistente virtual para seguros. Vi que você tem interesse em proteção e posso te ajudar com uma cotação personalizada! Como posso te ajudar hoje?',
      responseRate: 87,
      status: 'ativo',
      lastUpdate: 'há 2 semanas'
    },
    {
      id: 'qualificacao',
      name: 'Qualificação Auto',
      description: 'Coleta de dados para seguro automotivo',
      content: 'Perfeito! Para fazer uma cotação precisa do seu seguro auto, preciso de alguns dados: • Qual o modelo e ano do veículo? • CEP onde fica guardado? • Você é o condutor principal?',
      responseRate: 64,
      status: 'ativo',
      lastUpdate: 'há 1 semana'
    },
    {
      id: 'followup',
      name: 'Follow-up 24h',
      description: 'Mensagem automática após 24h sem resposta',
      content: 'Oi! Notei que você estava interessado em seguro, mas não conseguimos finalizar. Tenho uma proposta especial que pode interessar você! Que tal conversarmos mais um pouco? 😊',
      responseRate: 23,
      status: 'testando',
      lastUpdate: 'Em teste A/B'
    },
    {
      id: 'proposta',
      name: 'Proposta Enviada',
      description: 'Confirmação de envio da proposta',
      content: '✅ Pronto! Acabei de enviar sua proposta personalizada. Encontrei o melhor preço para seu perfil: R$ {valor} com cobertura completa. Para contratar, é só clicar no link e fazer o pagamento!',
      responseRate: 45,
      status: 'ativo',
      lastUpdate: 'há 3 dias'
    }
  ];

  const renderProductsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Produtos */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Catálogo de Produtos</h3>
          <button 
            onClick={() => setShowAddProductModal(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 flex items-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Produto</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {products.map((product) => {
            const IconComponent = product.icon;
            return (
              <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${product.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.description}</div>
                    <div className="text-xs text-gray-500">Última atualização: {product.lastUpdate}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    product.status === 'ativo' ? 'bg-green-100 text-green-800' :
                    product.status === 'desenvolvimento' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status === 'ativo' ? 'Ativo' : 
                     product.status === 'desenvolvimento' ? 'Desenvolvimento' : 'Inativo'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{product.commission}% comissão</span>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => editProduct(product.id)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configurações Gerais de Produtos */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Gerais</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aprovação Automática</label>
            <div className="flex items-center space-x-3">
              <input type="number" defaultValue="5000" className="w-24 border border-gray-300 rounded px-3 py-2 text-sm" />
              <span className="text-sm text-gray-600">até R$ (sem aprovação)</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desconto Máximo IA</label>
            <div className="flex items-center space-x-3">
              <input type="number" defaultValue="15" className="w-16 border border-gray-300 rounded px-3 py-2 text-sm" />
              <span className="text-sm text-gray-600">% máximo</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Emissão Automática</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Cobrança Automática</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

          <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors text-sm">
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );

  const renderRegrasTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuração de Comissões */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Regras de Comissão</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Editar em Lote</button>
        </div>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-600">{product.description}</div>
              </div>
              <div className="flex items-center space-x-3">
                <input type="number" defaultValue={product.commission} className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right" />
                <span className="text-sm text-gray-600">%</span>
                <button className="text-blue-600 hover:text-blue-700 p-1">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors text-sm">
            Salvar Todas as Alterações
          </button>
        </div>
      </div>

      {/* Regras de Aprovação */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regras de Aprovação</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Limite Automático Global</label>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">R$</span>
              <input type="number" defaultValue="5000" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desconto Máximo IA</label>
            <div className="flex items-center space-x-3">
              <input type="number" defaultValue="15" className="w-20 border border-gray-300 rounded px-2 py-1 text-sm" />
              <span className="text-sm text-gray-600">% sobre valor da apólice</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aprovação Gerencial</label>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Acima de R$</span>
              <input type="number" defaultValue="10000" className="w-24 border border-gray-300 rounded px-2 py-1 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aprovação Diretoria</label>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Acima de R$</span>
              <input type="number" defaultValue="50000" className="w-24 border border-gray-300 rounded px-2 py-1 text-sm" />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Notificações de Aprovação</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Email automático</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">WhatsApp</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>
            </div>
          </div>

          <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors text-sm">
            Atualizar Regras
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsuariosTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Usuários */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Usuários do Sistema</h3>
          <button className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 flex items-center space-x-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>Convidar Usuário</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-700">Usuário</th>
                <th className="text-left py-3 font-medium text-gray-700">Perfil</th>
                <th className="text-left py-3 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 font-medium text-gray-700">Último Acesso</th>
                <th className="text-left py-3 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-medium text-xs">
                    {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user?.full_name || 'Usuário Demo'}</div>
                    <div className="text-xs text-gray-500">{user?.email || 'demo@olga-ai.com'}</div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </td>
                <td className="py-3">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">Ativo</span>
                </td>
                <td className="py-3 text-gray-600">Agora</td>
                <td className="py-3">
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Perfis de Acesso */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Perfis de Acesso</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-yellow-900">Administrador</h4>
              <span className="text-xs text-gray-500">1 usuário</span>
            </div>
            <div className="text-xs text-gray-600 mb-3">Acesso total ao sistema, configurações e usuários</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Todas as permissões</span>
              </div>
            </div>
          </div>
        </div>
        
        <button className="w-full mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm">
          Gerenciar Permissões
        </button>
      </div>
    </div>
  );

  const renderIntegracoesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {integrations.map((integration) => {
        const IconComponent = integration.icon;
        return (
          <div key={integration.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-600">{integration.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 text-sm font-medium">Conectado</span>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    defaultChecked 
                    onChange={() => toggleIntegration(integration.id)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
            <div className="space-y-4">
              {Object.entries(integration.config).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </label>
                  <div className="flex space-x-2">
                    <input 
                      type={key.includes('key') || key.includes('token') ? 'password' : 'text'} 
                      value={value} 
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" 
                      readOnly 
                    />
                    {(key.includes('key') || key.includes('token')) && (
                      <button 
                        onClick={() => toggleSensitiveVisibility(key)}
                        className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        {showSensitive[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors text-sm">
                Atualizar Configuração
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Templates */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Templates de Mensagem</h3>
          <button className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 flex items-center space-x-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>Novo Template</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    template.status === 'ativo' ? 'bg-green-100 text-green-800' :
                    template.status === 'testando' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {template.status === 'ativo' ? 'Ativo' : 
                     template.status === 'testando' ? 'Testando' : 'Inativo'}
                  </span>
                  <button 
                    onClick={() => editTemplate(template.id)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 mb-3">
                "{template.content}"
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Taxa de resposta: {template.responseRate}%</span>
                <span>Última atualização: {template.lastUpdate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variáveis e Performance */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Variáveis Disponíveis</h3>
        <div className="space-y-3 mb-6">
          {[
            { var: '{nome}', desc: 'Nome do cliente' },
            { var: '{produto}', desc: 'Tipo de seguro' },
            { var: '{valor}', desc: 'Valor da proposta' },
            { var: '{veiculo}', desc: 'Modelo do veículo' },
            { var: '{seguradora}', desc: 'Nome da seguradora' }
          ].map((item, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
              <code className="text-blue-600">{item.var}</code> - {item.desc}
            </div>
          ))}
        </div>
        
        <h4 className="font-medium text-gray-900 mb-3">Performance dos Templates</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded">
            <div>
              <div className="text-sm font-medium text-gray-900">Taxa de Resposta</div>
              <div className="text-xs text-gray-600">Saudação Inicial</div>
            </div>
            <div className="text-lg font-bold text-green-600">87%</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
            <div>
              <div className="text-sm font-medium text-gray-900">Conversão</div>
              <div className="text-xs text-gray-600">Qualificação</div>
            </div>
            <div className="text-lg font-bold text-blue-600">64%</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
            <div>
              <div className="text-sm font-medium text-gray-900">Recuperação</div>
              <div className="text-xs text-gray-600">Follow-up</div>
            </div>
            <div className="text-lg font-bold text-orange-600">23%</div>
          </div>
        </div>
        
        <button className="w-full mt-6 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm">
          Análise Completa
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <button 
                onClick={onBack || (() => window.location.href = '/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-gray-900 font-medium text-base">Olga</h1>
                </div>
              </button>
              <nav className="hidden md:flex space-x-6">
                <button 
                  onClick={onBack || (() => window.location.href = '/')}
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm"
                >
                  Pipeline
                </button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Vendas</button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Comissões</button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Emissão</button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Relatórios</button>
                <button className="text-gray-900 font-medium relative py-2 text-sm">
                  Configurações
                  <div className="absolute -bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={onBack || (() => window.location.href = '/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md">
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-xs">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </div>
                <span className="text-gray-900 font-medium text-sm">{user?.full_name || 'Usuário'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Configurações & Parâmetros</h2>
            <p className="text-gray-600">Ajustes finos de produtos, regras comerciais, usuários e integrações externas</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center space-x-2 text-sm">
              <Database className="w-4 h-4" />
              <span>Backup Configs</span>
            </button>
            <button 
              onClick={() => setShowRestoreModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 flex items-center space-x-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restaurar Padrão</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: 'produtos', label: 'Produtos' },
                { id: 'regras', label: 'Regras & Comissões' },
                { id: 'usuarios', label: 'Usuários & Permissões' },
                { id: 'integracoes', label: 'Integrações' },
                { id: 'templates', label: 'Templates' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'produtos' && renderProductsTab()}
        {activeTab === 'regras' && renderRegrasTab()}
        {activeTab === 'usuarios' && renderUsuariosTab()}
        {activeTab === 'integracoes' && renderIntegracoesTab()}
        {activeTab === 'templates' && renderTemplatesTab()}

        {/* Modal - Restaurar Configuração Padrão */}
        {showRestoreModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Restaurar Configuração Padrão</h3>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Esta ação irá restaurar todas as configurações para os valores padrão de fábrica. 
                  <strong> Esta ação não pode ser desfeita.</strong>
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <div className="text-xs text-yellow-800">
                    <strong>O que será restaurado:</strong><br />
                    • Todas as regras de comissão<br />
                    • Configurações de produtos<br />
                    • Templates de mensagem<br />
                    • Regras de aprovação
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-3">
                  <button 
                    onClick={() => setShowRestoreModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleConfirmRestore}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Confirmar Restauração
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal - Adicionar Produto */}
        {showAddProductModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Adicionar Novo Produto</h3>
                  <button 
                    onClick={() => setShowAddProductModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form id="addProductForm" className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddProduct(); }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto</label>
                      <input name="name" type="text" placeholder="Ex: Seguro Auto Premium" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                      <select name="category" className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                        <option>Seguro Auto</option>
                        <option>Seguro Vida</option>
                        <option>Seguro Residencial</option>
                        <option>Seguro Empresarial</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea name="description" rows={3} placeholder="Descrição detalhada do produto..." className="w-full border border-gray-300 rounded px-3 py-2 text-sm"></textarea>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comissão (%)</label>
                      <input name="commission" type="number" defaultValue="8" min="0" max="100" step="0.1" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor Mínimo</label>
                      <input type="number" placeholder="0" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor Máximo</label>
                      <input type="number" placeholder="50000" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button 
                      type="button" 
                      onClick={() => setShowAddProductModal(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm"
                    >
                      Adicionar Produto
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}