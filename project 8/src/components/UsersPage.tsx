import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus, 
  Download, 
  Clock, 
  Users, 
  Shield, 
  BarChart3, 
  CheckCircle,
  X,
  Mail,
  RotateCcw
} from 'lucide-react';

const roleConfig = {
  admin: { 
    label: 'Super Admin', 
    color: 'role-admin',
    description: 'Acesso total ao sistema',
    permissions: [
      'Acesso total ao sistema',
      'Gerenciar usuários',
      'Configurações administrativas',
      'Relatórios financeiros'
    ]
  },
  gestor: { 
    label: 'Manager', 
    color: 'role-manager',
    description: 'Gestão de vendas',
    permissions: [
      'Gerenciar equipe de vendas',
      'Relatórios de performance',
      'Aprovar comissões',
      'Configurar campanhas'
    ]
  },
  vendas: { 
    label: 'Vendedor', 
    color: 'role-vendedor',
    description: 'Vendas e propostas',
    permissions: [
      'Visualizar vendas e propostas',
      'Criar e editar propostas',
      'Acessar pipeline de vendas',
      'Ver próprias comissões'
    ]
  },
  operador: { 
    label: 'Operador', 
    color: 'role-operador',
    description: 'Suporte técnico',
    permissions: [
      'Suporte a clientes',
      'Emissão de apólices',
      'Relatórios operacionais',
      'Gestão de documentos'
    ]
  },
  cobranca: { 
    label: 'Cobrança', 
    color: 'role-viewer',
    description: 'Gestão financeira',
    permissions: [
      'Gestão de pagamentos',
      'Cobrança de clientes',
      'Relatórios financeiros',
      'Controle de inadimplência'
    ]
  }
};

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  inativo: { label: 'Inativo', color: 'bg-red-100 text-red-800' },
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  bloqueado: { label: 'Bloqueado', color: 'bg-red-100 text-red-800' }
};

export function UsersPage() {
  const { users, loading, error, createUser, updateUser, deactivateUser, reactivateUser, inviteUser, resendInvite } = useUsers();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    department: ''
  });

  // Filtrar usuários
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          user.full_name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      if (roleFilter !== 'Todas' && user.role !== roleFilter.toLowerCase()) {
        return false;
      }
      
      const userStatus = user.is_active ? 'ativo' : 'inativo';
      if (statusFilter !== 'Todos' && userStatus !== statusFilter.toLowerCase()) {
        return false;
      }
      
      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Calcular estatísticas
  const stats = React.useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const inactiveUsers = users.filter(u => !u.is_active).length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const managerUsers = users.filter(u => u.role === 'gestor').length;
    const salesUsers = users.filter(u => u.role === 'vendas').length;
    const operatorUsers = users.filter(u => u.role === 'operador').length;
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      managerUsers,
      salesUsers,
      operatorUsers
    };
  }, [users]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredUsers.map(user => user.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleInviteUser = async () => {
    try {
      await inviteUser(newUser.email, newUser.role, newUser.name);
      setShowNewUserModal(false);
      setNewUser({ name: '', email: '', role: '', department: '' });
    } catch (error) {
      console.error('Erro ao convidar usuário:', error);
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      await resendInvite(userId);
    } catch (error) {
      console.error('Erro ao reenviar convite:', error);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateUser(userId);
      } else {
        await reactivateUser(userId);
      }
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
    }
  };

  const getActionButtons = (user: any) => {
    const baseButtons = [
      <button 
        key="edit"
        className="text-blue-600 hover:text-blue-900 p-1" 
        title="Editar usuário"
      >
        <Edit className="w-4 h-4" />
      </button>
    ];

    if (user.role === 'gestor') {
      baseButtons.push(
        <button 
          key="team"
          className="text-purple-600 hover:text-purple-900 p-1" 
          title="Ver equipe"
        >
          <Users className="w-4 h-4" />
        </button>
      );
    }

    if (user.role === 'vendas') {
      baseButtons.push(
        <button 
          key="performance"
          className="text-green-600 hover:text-green-900 p-1" 
          title="Ver desempenho"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
      );
    }

    if (!user.is_active && !user.last_login) {
      baseButtons.push(
        <button 
          key="resend"
          onClick={() => handleResendInvite(user.id)}
          className="text-blue-600 hover:text-blue-900 p-1" 
          title="Reenviar convite"
        >
          <Mail className="w-4 h-4" />
        </button>
      );
    }

    if (!user.is_active && user.last_login) {
      baseButtons.push(
        <button 
          key="reactivate"
          onClick={() => handleToggleUserStatus(user.id, false)}
          className="text-green-600 hover:text-green-900 p-1" 
          title="Reativar usuário"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      );
    }

    baseButtons.push(
      <button 
        key="logs"
        className="text-gray-400 hover:text-gray-600 p-1" 
        title="Ver logs de acesso"
      >
        <Clock className="w-4 h-4" />
      </button>
    );

    if (!user.is_active) {
      baseButtons.push(
        <button 
          key="delete"
          className="text-red-600 hover:text-red-900 p-1" 
          title={!user.last_login ? 'Cancelar convite' : 'Remover usuário'}
        >
          {!user.last_login ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        </button>
      );
    }

    return baseButtons;
  };

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleInviteUser();
  };

  const getPermissionsForRole = (role: string) => {
    return roleConfig[role as keyof typeof roleConfig]?.permissions || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar usuários: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6 max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Gestão de Usuários</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Empresa XYZ Ltda • CNPJ: 00.123.456/0001-78</span>
              <span>•</span>
              <span>Plano: Enterprise • {stats.totalUsers}/100 usuários</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center space-x-2 text-sm">
              <Download className="w-4 h-4" />
              <span>Exportar Usuários</span>
            </button>
            <button 
              onClick={() => setShowNewUserModal(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 flex items-center space-x-2 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Convidar Usuário</span>
            </button>
          </div>
        </div>

        {/* Estatísticas dos Usuários */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-md">{stats.totalUsers}/100</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</p>
              <p className="text-gray-600 text-sm">Total de Usuários</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeUsers} ativos • {stats.inactiveUsers} inativos</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-yellow-600 text-xs font-medium bg-yellow-50 px-2 py-1 rounded-md">Admin</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.adminUsers}</p>
              <p className="text-gray-600 text-sm">Administradores</p>
              <p className="text-xs text-gray-500 mt-1">Acesso total</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-md">Manager</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.managerUsers}</p>
              <p className="text-gray-600 text-sm">Gerentes</p>
              <p className="text-xs text-gray-500 mt-1">Gestão de equipes</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-md">Vendas</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.salesUsers}</p>
              <p className="text-gray-600 text-sm">Vendedores</p>
              <p className="text-xs text-gray-500 mt-1">Equipe comercial</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-medium bg-purple-50 px-2 py-1 rounded-md">Outros</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.operatorUsers}</p>
              <p className="text-gray-600 text-sm">Operadores</p>
              <p className="text-xs text-gray-500 mt-1">Suporte e operação</p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar usuários</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Nome, email, departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Função/Role</label>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option>Todas</option>
                <option>Admin</option>
                <option>Manager</option>
                <option>Vendedor</option>
                <option>Operador</option>
                <option>Cobrança</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option>Todos</option>
                <option>Ativo</option>
                <option>Inativo</option>
                <option>Pendente</option>
                <option>Bloqueado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Lista de Usuários</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filteredUsers.length} usuários</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input 
                      type="checkbox" 
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função/Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const initials = getInitials(user.full_name);
                  const bgColor = getRandomBgColor();
                  const textColor = getRandomTextColor();
                  const userStatus = user.is_active ? 'ativo' : (!user.last_login ? 'pendente' : 'inativo');
                  
                  return (
                  <tr 
                    key={user.id} 
                    className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-sm ${
                      selectedRows.includes(user.id) ? 'bg-blue-50 border-blue-200' : ''
                    } ${!user.is_active ? 'opacity-75' : ''}`}
                    onClick={(e) => {
                      if (!e.target.closest('button') && !e.target.closest('input')) {
                        handleSelectRow(user.id);
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedRows.includes(user.id)}
                        onChange={() => handleSelectRow(user.id)}
                        className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center ${textColor} font-medium text-sm`}>
                          {initials}
                        </div>
                        <div>
                          <div className={`font-medium ${!user.is_active ? 'text-gray-500' : 'text-gray-900'}`}>
                            {user.full_name}
                          </div>
                          <div className={`text-sm ${!user.is_active ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            {userStatus === 'pendente' ? `Convite enviado: ${new Date(user.created_at).toLocaleDateString('pt-BR')}` : `Usuário desde: ${new Date(user.created_at).toLocaleDateString('pt-BR')}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`role-badge ${roleConfig[user.role].color}`}>
                        {roleConfig[user.role].label}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{roleConfig[user.role].description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">Comercial</div>
                      <div className="text-xs text-gray-500">{roleConfig[user.role].label}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${userStatus === 'pendente' ? 'text-gray-500' : 'text-gray-900'}`}>
                        {user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {userStatus === 'pendente' ? 'Nunca acessou' : 
                         user.is_active ? 'Ativo' : 'Inativo'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[userStatus].color}`}>
                        {statusConfig[userStatus].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getActionButtons(user)}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Mostrando</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                </select>
                <span className="text-sm text-gray-700">de {filteredUsers.length} usuários</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  onClick={() => alert('Página anterior')}
                >
                  Anterior
                </button>
                <button className="px-3 py-1 bg-gray-900 text-white rounded text-sm">1</button>
                <button 
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  onClick={() => alert('Página 2')}
                >
                  2
                </button>
                <button 
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  onClick={() => alert('Próxima página')}
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Convite de Usuário */}
        {showNewUserModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Convidar Novo Usuário</h3>
                  <button 
                    onClick={() => setShowNewUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmitNewUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                    <input 
                      type="text" 
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent" 
                      placeholder="João Silva"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email corporativo</label>
                    <input 
                      type="email" 
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent" 
                      placeholder="joao.silva@empresaxyz.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Função/Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione uma função</option>
                      <option value="vendas">Vendedor</option>
                      <option value="operador">Operador</option>
                      <option value="gestor">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="cobranca">Cobrança</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <select 
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione um departamento</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Operações">Operações</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="Diretoria">Diretoria</option>
                      <option value="TI">TI</option>
                    </select>
                  </div>
                  
                  {/* Permissões específicas por role */}
                  {newUser.role && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Permissões da Função</h4>
                      <div className="space-y-2 text-xs text-gray-600">
                        {getPermissionsForRole(newUser.role).map((permission, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
                    <button 
                      type="button"
                      onClick={() => setShowNewUserModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
                    >
                      Enviar Convite
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .role-badge {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
        }
        .role-admin { background: #fef3c7; color: #92400e; }
        .role-manager { background: #dbeafe; color: #1e40af; }
        .role-vendedor { background: #d1fae5; color: #065f46; }
        .role-operador { background: #f3e8ff; color: #7c3aed; }
        .role-viewer { background: #f1f5f9; color: #475569; }
      `}</style>
    </div>
  );
}

// Funções auxiliares
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRandomBgColor(): string {
  const colors = [
    'bg-blue-100', 'bg-green-100', 'bg-purple-100', 
    'bg-orange-100', 'bg-red-100', 'bg-yellow-100'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomTextColor(): string {
  const colors = [
    'text-blue-600', 'text-green-600', 'text-purple-600',
    'text-orange-600', 'text-red-600', 'text-yellow-600'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}