import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Eye, FileText, Gift, Settings, Download, Mail, MessageCircle, Globe, User, Phone, CreditCard, Calendar, CheckCircle, AlertTriangle, Loader, RefreshCw } from 'lucide-react';

interface WelcomeKitPageProps {
  onBack: () => void;
}

interface Client {
  id: string;
  full_name: string;
  cpf_cnpj?: string;
  phone: string;
  email?: string;
  address?: any;
}

interface Sale {
  id: string;
  client_id: string;
  value: number;
  status: string;
  created_at: string;
  clients: Client;
  products: {
    id: string;
    name: string;
    category: string;
    description?: string;
  };
  policies?: Policy[];
}

interface Policy {
  id: string;
  policy_number: string;
  insurer: string;
  status: string;
  coverage_start_date: string;
  coverage_end_date: string;
  pdf_url?: string;
  products: {
    name: string;
    category: string;
    description?: string;
  };
  sales: {
    value: number;
  };
}

interface SearchResult {
  type: 'client' | 'sale' | 'policy';
  id: string;
  title: string;
  subtitle: string;
  details: string;
  data: any;
}

export function WelcomeKitPage({ onBack }: WelcomeKitPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSales, setClientSales] = useState<Sale[]>([]);
  const [clientPolicies, setClientPolicies] = useState<Policy[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentPolicies, setRecentPolicies] = useState<Policy[]>([]);
  const [selectedFromRecent, setSelectedFromRecent] = useState<string | null>(null);
  const [loadingRecent, setLoadingRecent] = useState(true);
  
  // Configurações do Kit
  const [customMessage, setCustomMessage] = useState('Parabéns por escolher a Olga para sua proteção! Este kit contém todas as informações importantes sobre seus seguros. Mantenha sempre em local seguro e de fácil acesso.');
  const [selectedConsultant, setSelectedConsultant] = useState('Carlos Silva - Vendedor Senior');
  const [emissionDate, setEmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [includeQR, setIncludeQR] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [autoSend, setAutoSend] = useState(true);

  // Carregar últimas 20 apólices emitidas
  useEffect(() => {
    loadRecentPolicies();
  }, []);

  const loadRecentPolicies = async () => {
    setLoadingRecent(true);
    
    // Simular carregamento das últimas 20 apólices
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockRecentPolicies: Policy[] = [
      {
        id: 'policy-recent-1',
        policy_number: 'PS-2025-001234',
        insurer: 'Porto Seguro',
        status: 'emitida',
        coverage_start_date: '2025-01-22',
        coverage_end_date: '2026-01-22',
        pdf_url: 'https://storage.example.com/policies/ps-001234.pdf',
        products: {
          name: 'Seguro Auto',
          category: 'auto',
          description: 'Honda Civic 2022 • ABC-1D23'
        },
        sales: {
          value: 1247.50
        },
        clients: {
          id: 'client-1',
          full_name: 'Maria José Silva Santos',
          phone: '(11) 99999-1234',
          email: 'maria.silva@email.com',
          cpf_cnpj: '123.456.789-01'
        }
      },
      {
        id: 'policy-recent-2',
        policy_number: 'SA-2025-005678',
        insurer: 'SulAmérica',
        status: 'emitida',
        coverage_start_date: '2025-01-22',
        coverage_end_date: '2026-01-22',
        pdf_url: 'https://storage.example.com/policies/sa-005678.pdf',
        products: {
          name: 'Seguro Residencial',
          category: 'residencial',
          description: 'Casa Própria • 120m²'
        },
        sales: {
          value: 890.00
        },
        clients: {
          id: 'client-2',
          full_name: 'João Pedro Santos',
          phone: '(11) 88888-5678',
          email: 'joao.santos@email.com',
          cpf_cnpj: '987.654.321-00'
        }
      },
      {
        id: 'policy-recent-3',
        policy_number: 'BS-2025-009876',
        insurer: 'Bradesco Seguros',
        status: 'emitida',
        coverage_start_date: '2025-01-21',
        coverage_end_date: '2026-01-21',
        pdf_url: 'https://storage.example.com/policies/bs-009876.pdf',
        products: {
          name: 'Seguro Vida',
          category: 'vida',
          description: 'R$ 100.000 • 2 Beneficiários'
        },
        sales: {
          value: 650.00
        },
        clients: {
          id: 'client-3',
          full_name: 'Ana Costa Silva',
          phone: '(11) 77777-9012',
          email: 'ana.costa@email.com',
          cpf_cnpj: '456.789.123-45'
        }
      },
      {
        id: 'policy-recent-4',
        policy_number: 'AZ-2025-012345',
        insurer: 'Azul Seguros',
        status: 'emitida',
        coverage_start_date: '2025-01-21',
        coverage_end_date: '2026-01-21',
        pdf_url: 'https://storage.example.com/policies/az-012345.pdf',
        products: {
          name: 'Seguro Empresarial',
          category: 'empresarial',
          description: 'Escritório • R$ 200.000'
        },
        sales: {
          value: 1200.00
        },
        clients: {
          id: 'client-4',
          full_name: 'Pedro Lima Oliveira',
          phone: '(11) 66666-3456',
          email: 'pedro.lima@email.com',
          cpf_cnpj: '789.123.456-78'
        }
      },
      {
        id: 'policy-recent-5',
        policy_number: 'PS-2025-001235',
        insurer: 'Porto Seguro',
        status: 'emitida',
        coverage_start_date: '2025-01-20',
        coverage_end_date: '2026-01-20',
        pdf_url: 'https://storage.example.com/policies/ps-001235.pdf',
        products: {
          name: 'Seguro Auto',
          category: 'auto',
          description: 'Toyota Corolla 2023 • XYZ-2E34'
        },
        sales: {
          value: 1350.00
        },
        clients: {
          id: 'client-5',
          full_name: 'Carla Mendes',
          phone: '(11) 55555-7890',
          email: 'carla.mendes@email.com',
          cpf_cnpj: '321.654.987-12'
        }
      }
    ];

    setRecentPolicies(mockRecentPolicies);
    setLoadingRecent(false);
  };

  // Selecionar apólice da tabela recente
  const handleSelectFromRecent = async (policy: Policy) => {
    if (!policy.clients) return;
    
    setSelectedFromRecent(policy.id);
    setIsLoadingClient(true);
    
    // Carregar dados completos do cliente
    await loadClientData(policy.clients);
    
    // Selecionar automaticamente a apólice escolhida
    setSelectedPolicies([policy.id]);
    setSelectedFromRecent(null);
  };

  // Simular busca no banco de dados
  const performSearch = async (term: string) => {
    if (!term || term.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock de dados de busca
    const mockResults: SearchResult[] = [
      {
        type: 'client',
        id: 'client-1',
        title: 'Maria José Silva Santos',
        subtitle: '(11) 99999-1234 • maria.silva@email.com',
        details: 'CPF: 123.456.789-01 • 3 apólices ativas',
        data: {
          id: 'client-1',
          full_name: 'Maria José Silva Santos',
          cpf_cnpj: '123.456.789-01',
          phone: '(11) 99999-1234',
          email: 'maria.silva@email.com',
          address: 'Rua das Flores, 123 - Jardins, São Paulo/SP - CEP 01234-567'
        }
      },
      {
        type: 'client',
        id: 'client-2',
        title: 'João Pedro Santos',
        subtitle: '(11) 88888-5678 • joao.santos@email.com',
        details: 'CPF: 987.654.321-00 • 2 apólices ativas',
        data: {
          id: 'client-2',
          full_name: 'João Pedro Santos',
          cpf_cnpj: '987.654.321-00',
          phone: '(11) 88888-5678',
          email: 'joao.santos@email.com',
          address: 'Av. Paulista, 456 - Bela Vista, São Paulo/SP - CEP 01310-100'
        }
      },
      {
        type: 'sale',
        id: 'sale-1',
        title: 'Venda #VS-2025-001234',
        subtitle: 'Ana Costa • Seguro Auto • R$ 1.450,00',
        details: 'Pago em 20/01/25 • Apólice emitida',
        data: {
          id: 'sale-1',
          client_name: 'Ana Costa',
          value: 1450.00,
          product: 'Seguro Auto',
          status: 'pago'
        }
      }
    ].filter(result => 
      result.title.toLowerCase().includes(term.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(term.toLowerCase()) ||
      result.details.toLowerCase().includes(term.toLowerCase())
    );

    setSearchResults(mockResults);
    setIsSearching(false);
  };

  // Carregar dados do cliente selecionado
  const loadClientData = async (client: Client) => {
    setIsLoadingClient(true);
    setSelectedClient(client);
    
    // Simular carregamento de vendas e apólices
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock de vendas do cliente
    const mockSales: Sale[] = [
      {
        id: 'sale-1',
        client_id: client.id,
        value: 1247.50,
        status: 'pago',
        created_at: '2025-01-22T10:30:00Z',
        clients: client,
        products: {
          id: 'prod-1',
          name: 'Seguro Auto',
          category: 'auto',
          description: 'Honda Civic 2022'
        }
      },
      {
        id: 'sale-2',
        client_id: client.id,
        value: 890.00,
        status: 'pago',
        created_at: '2025-01-15T14:20:00Z',
        clients: client,
        products: {
          id: 'prod-2',
          name: 'Seguro Residencial',
          category: 'residencial',
          description: 'Casa Própria 120m²'
        }
      },
      {
        id: 'sale-3',
        client_id: client.id,
        value: 650.00,
        status: 'pago',
        created_at: '2025-01-20T16:45:00Z',
        clients: client,
        products: {
          id: 'prod-3',
          name: 'Seguro Vida',
          category: 'vida',
          description: 'R$ 100.000 cobertura'
        }
      }
    ];

    // Mock de apólices do cliente
    const mockPolicies: Policy[] = [
      {
        id: 'policy-1',
        policy_number: 'PS-2025-001234',
        insurer: 'Porto Seguro',
        status: 'emitida',
        coverage_start_date: '2025-01-22',
        coverage_end_date: '2026-01-22',
        pdf_url: 'https://storage.example.com/policies/ps-001234.pdf',
        products: {
          name: 'Seguro Auto',
          category: 'auto',
          description: 'Honda Civic 2022 • ABC-1D23'
        },
        sales: {
          value: 1247.50
        }
      },
      {
        id: 'policy-2',
        policy_number: 'SA-2025-005678',
        insurer: 'SulAmérica',
        status: 'emitida',
        coverage_start_date: '2025-01-15',
        coverage_end_date: '2026-01-15',
        pdf_url: 'https://storage.example.com/policies/sa-005678.pdf',
        products: {
          name: 'Seguro Residencial',
          category: 'residencial',
          description: 'Casa Própria • 120m² • R$ 350.000'
        },
        sales: {
          value: 890.00
        }
      },
      {
        id: 'policy-3',
        policy_number: 'BS-2025-009876',
        insurer: 'Bradesco Seguros',
        status: 'emitida',
        coverage_start_date: '2025-01-20',
        coverage_end_date: '2026-01-20',
        pdf_url: 'https://storage.example.com/policies/bs-009876.pdf',
        products: {
          name: 'Seguro Vida',
          category: 'vida',
          description: 'R$ 100.000 • 2 Beneficiários'
        },
        sales: {
          value: 650.00
        }
      }
    ];

    setClientSales(mockSales);
    setClientPolicies(mockPolicies);
    setSelectedPolicies(mockPolicies.map(p => p.id)); // Selecionar todas por padrão
    setIsLoadingClient(false);
  };

  // Gerar Kit PDF
  const handleGenerateKit = async () => {
    if (!selectedClient || selectedPolicies.length === 0) {
      alert('Selecione um cliente e pelo menos uma apólice.');
      return;
    }

    setIsGenerating(true);

    try {
      // Simular chamada para edge function
      const kitData = {
        clientId: selectedClient.id,
        policyIds: selectedPolicies,
        customMessage,
        consultantName: selectedConsultant,
        autoSend,
        trigger: 'manual'
      };

      console.log('Gerando Kit com dados:', kitData);
      
      // Simular geração
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      alert(`Kit Boas Vindas gerado com sucesso!\n\nCliente: ${selectedClient.full_name}\nApólices: ${selectedPolicies.length}\nEnvio automático: ${autoSend ? 'Sim' : 'Não'}`);
      
      // Reset após sucesso
      setSelectedClient(null);
      setClientSales([]);
      setClientPolicies([]);
      setSelectedPolicies([]);
      setSearchTerm('');
      setSearchResults([]);
      
    } catch (error) {
      alert('Erro ao gerar Kit Boas Vindas. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getInsurerData = (insurer: string) => {
    const insurers = {
      'Porto Seguro': { code: 'PS', color: 'bg-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
      'SulAmérica': { code: 'SA', color: 'bg-green-600', bgColor: 'bg-green-50 border-green-200' },
      'Bradesco Seguros': { code: 'BS', color: 'bg-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
      'Azul Seguros': { code: 'AZ', color: 'bg-orange-600', bgColor: 'bg-orange-50 border-orange-200' }
    };
    return insurers[insurer] || { code: 'XX', color: 'bg-gray-600', bgColor: 'bg-gray-50 border-gray-200' };
  };

  const totalValue = clientPolicies
    .filter(p => selectedPolicies.includes(p.id))
    .reduce((sum, p) => sum + p.sales.value, 0);

  // Função auxiliar para calcular tempo atrás
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'agora';
    if (diffHours < 24) return `há ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <button 
                onClick={onBack}
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
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Emissão</span>
                </button>
                <button className="text-gray-900 font-medium relative py-2 text-sm">
                  Kit Boas Vindas Manual
                  <div className="absolute -bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md">
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-xs">
                  C
                </div>
                <span className="text-gray-900 font-medium text-sm">Carlos Silva</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Kit Boas Vindas Manual</h2>
              <p className="text-sm sm:text-base text-gray-600">Busque o segurado e gere o kit personalizado para contingência</p>
            </div>
          </div>
          
          {/* Alerta de Contingência */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="text-sm sm:text-base font-medium text-yellow-900">Modo Contingência Ativo</h4>
                <p className="text-xs sm:text-sm text-yellow-800">Use esta ferramenta quando a automação estiver indisponível ou para reenvios manuais.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Busca de Segurados */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Últimas Apólices Emitidas */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Últimas Apólices Emitidas</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm text-gray-600">{recentPolicies.length} apólices</span>
                    <button 
                      onClick={loadRecentPolicies}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Atualizar lista"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {loadingRecent ? (
                  <div className="text-center py-8">
                    <Loader className="w-6 h-6 mx-auto mb-2 animate-spin text-purple-600" />
                    <p className="text-gray-600 text-sm">Carregando apólices recentes...</p>
                  </div>
                ) : (
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seguradora</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apólice</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emissão</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentPolicies.map((policy) => {
                        const insurerData = getInsurerData(policy.insurer);
                        const isSelected = selectedFromRecent === policy.id;
                        
                        return (
                          <tr 
                            key={policy.id} 
                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                              isSelected ? 'bg-purple-50 border-purple-200' : ''
                            }`}
                            onClick={() => handleSelectFromRecent(policy)}
                          >
                            <td className="px-2 sm:px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium text-xs">
                                  {policy.clients?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{policy.clients?.full_name}</div>
                                  <div className="text-xs text-gray-500">{policy.clients?.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-3">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">{policy.products.name}</div>
                              <div className="text-xs text-gray-500 truncate">{policy.products.description}</div>
                            </td>
                            <td className="px-2 sm:px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <div className={`w-5 sm:w-6 h-5 sm:h-6 ${insurerData.color} rounded flex items-center justify-center text-white font-bold text-xs`}>
                                  {insurerData.code}
                                </div>
                                <span className="text-xs sm:text-sm text-gray-900 hidden sm:inline">{policy.insurer}</span>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-3">
                              <div className="text-xs sm:text-sm font-mono text-gray-900">{policy.policy_number}</div>
                              <div className="text-xs text-gray-500 hidden sm:block">
                                {new Date(policy.coverage_start_date).toLocaleDateString('pt-BR')} - {new Date(policy.coverage_end_date).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-3">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(policy.sales.value)}
                              </div>
                              <div className="text-xs text-gray-500 hidden sm:block">por ano</div>
                            </td>
                            <td className="px-2 sm:px-4 py-3">
                              <div className="text-xs sm:text-sm text-gray-900">
                                {new Date(policy.coverage_start_date).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-xs text-gray-500 hidden sm:block">
                                {getTimeAgo(policy.coverage_start_date)}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectFromRecent(policy);
                                }}
                                disabled={isSelected}
                                className="bg-purple-600 text-white px-2 sm:px-3 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isSelected ? 'Sel...' : 'Selecionar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  💡 <strong>Dica:</strong> Clique em qualquer linha para selecionar o cliente e gerar o kit automaticamente
                </p>
              </div>
            </div>

            {/* Campo de Busca */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Buscar Segurado</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Contingência</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite nome, CPF, telefone, email ou número da apólice..."
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isSearching ? (
                    <Loader className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Resultados da Busca */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700">Resultados encontrados:</h4>
                  {searchResults.map((result) => (
                    <div 
                      key={result.id}
                      onClick={() => result.type === 'client' && loadClientData(result.data)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          result.type === 'client' ? 'bg-blue-100' :
                          result.type === 'sale' ? 'bg-green-100' :
                          'bg-purple-100'
                        }`}>
                          {result.type === 'client' ? <User className="w-4 h-4 text-blue-600" /> :
                           result.type === 'sale' ? <CreditCard className="w-4 h-4 text-green-600" /> :
                           <FileText className="w-4 h-4 text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm sm:text-base font-medium text-gray-900 truncate">{result.title}</div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate">{result.subtitle}</div>
                          <div className="text-xs text-gray-500">{result.details}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchTerm.length >= 3 && searchResults.length === 0 && !isSearching && (
                <div className="mt-4 text-center py-8">
                  <div className="text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum resultado encontrado</p>
                    <p className="text-xs sm:text-sm">Tente buscar por nome, CPF, telefone ou email</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dados do Cliente Selecionado */}
            {selectedClient && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Cliente Selecionado</h3>
                  <button
                    onClick={() => {
                      setSelectedClient(null);
                      setClientSales([]);
                      setClientPolicies([]);
                      setSelectedPolicies([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                {isLoadingClient ? (
                  <div className="text-center py-8">
                    <Loader className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-600" />
                    <p className="text-gray-600">Carregando dados do cliente...</p>
                  </div>
                ) : (
                  <>
                    {/* Dados do Cliente */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                          <p className="text-sm sm:text-base text-gray-900">{selectedClient.full_name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">CPF/CNPJ</label>
                          <p className="text-sm sm:text-base text-gray-900">{selectedClient.cpf_cnpj || 'Não informado'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Telefone</label>
                          <p className="text-sm sm:text-base text-gray-900">{selectedClient.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <p className="text-sm sm:text-base text-gray-900">{selectedClient.email || 'Não informado'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Apólices do Cliente */}
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-3">Apólices Disponíveis ({clientPolicies.length})</h4>
                      <div className="space-y-3">
                        {clientPolicies.map((policy) => {
                          const insurerData = getInsurerData(policy.insurer);
                          const isSelected = selectedPolicies.includes(policy.id);
                          
                          return (
                            <div 
                              key={policy.id}
                              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                isSelected 
                                  ? `${insurerData.bgColor} border-2` 
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedPolicies(prev => prev.filter(id => id !== policy.id));
                                } else {
                                  setSelectedPolicies(prev => [...prev, policy.id]);
                                }
                              }}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 sm:w-10 h-8 sm:h-10 ${insurerData.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                                    {insurerData.code}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm sm:text-base font-medium text-gray-900">{policy.products.name}</div>
                                    <div className="text-xs sm:text-sm text-gray-600 truncate">{policy.insurer} • {policy.products.description}</div>
                                    <div className="text-xs text-gray-500">
                                      Apólice: {policy.policy_number} • Vigência: {policy.coverage_start_date} - {policy.coverage_end_date}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <div className="text-sm sm:text-base font-medium text-gray-900">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(policy.sales.value)}
                                    </div>
                                    <div className="text-xs text-gray-500">por ano</div>
                                  </div>
                                  <div className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="rounded border-gray-300 text-purple-600"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {selectedPolicies.length > 0 && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-purple-900">
                              {selectedPolicies.length} apólice(s) selecionada(s)
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-purple-900">
                              Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}/ano
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Personalização do Kit */}
            {selectedClient && !isLoadingClient && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Personalização do Kit</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem Personalizada</label>
                    <textarea 
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none" 
                      rows={3} 
                      placeholder="Adicione uma mensagem especial para o cliente..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Consultor Responsável</label>
                      <select 
                        value={selectedConsultant}
                        onChange={(e) => setSelectedConsultant(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option>Carlos Silva - Vendedor Senior</option>
                        <option>Maria Oliveira - Vendedora Pleno</option>
                        <option>Pedro Santos - Vendedor Junior</option>
                        <option>IA Olga - Assistente Digital</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data de Emissão</label>
                      <input 
                        type="date" 
                        value={emissionDate}
                        onChange={(e) => setEmissionDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="include-qr" 
                        checked={includeQR}
                        onChange={(e) => setIncludeQR(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600" 
                      />
                      <label htmlFor="include-qr" className="ml-2 text-sm text-gray-700">Incluir QR Code</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="include-summary" 
                        checked={includeSummary}
                        onChange={(e) => setIncludeSummary(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600" 
                      />
                      <label htmlFor="include-summary" className="ml-2 text-sm text-gray-700">Incluir resumo financeiro</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="auto-send" 
                        checked={autoSend}
                        onChange={(e) => setAutoSend(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600" 
                      />
                      <label htmlFor="auto-send" className="ml-2 text-sm text-gray-700">Enviar automaticamente</label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Preview e Ações */}
          <div className="space-y-4 sm:space-y-6">
            {/* Status do Sistema */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Status do Sistema</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Automação Principal</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Indisponível</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Geração Manual</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Ativo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">WhatsApp API</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Conectado</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">PDF Generator</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Online</span>
                </div>
              </div>
            </div>

            {/* Preview do Kit */}
            {selectedClient && selectedPolicies.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div 
                  className="p-4 sm:p-6 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 sm:w-10 h-8 sm:h-10 bg-white rounded-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base text-white font-semibold">Olga</h3>
                        <p className="text-white/80 text-xs sm:text-sm">Sua Corretora Digital</p>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Kit Boas Vindas</h2>
                    <p className="text-white/90 text-xs sm:text-sm mb-3 truncate">{selectedClient.full_name}</p>
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-white text-xs">
                        {selectedPolicies.length} apólice(s) • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}/ano
                      </p>
                      <p className="text-white/80 text-xs">Proteção completa e unificada</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Conteúdo do PDF</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Capa personalizada Olga</li>
                    <li>• Dados do cliente</li>
                    <li>• {selectedPolicies.length} apólice(s) detalhada(s)</li>
                    <li>• Contatos de emergência</li>
                    <li>• Links para seguradoras</li>
                    {includeQR && <li>• QR Code de acesso</li>}
                    {includeSummary && <li>• Resumo financeiro</li>}
                    <li>• Guia de primeiros passos</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-3">
              <button 
                onClick={handleGenerateKit}
                disabled={!selectedClient || selectedPolicies.length === 0 || isGenerating}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Gerando Kit...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>Gerar Kit Manual</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => alert('Preview do kit será implementado')}
                disabled={!selectedClient || selectedPolicies.length === 0}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              
              <button 
                onClick={() => {
                  setSelectedClient(null);
                  setClientSales([]);
                  setClientPolicies([]);
                  setSelectedPolicies([]);
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Limpar Seleção
              </button>
            </div>

            {/* Histórico Recente */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Kits Recentes</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Ana Costa</div>
                    <div className="text-xs text-gray-500">2 apólices • há 1h</div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Pedro Santos</div>
                    <div className="text-xs text-gray-500">1 apólice • há 3h</div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}