import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Smile, Phone, MessageCircle, AlertTriangle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular loading por 1 segundo
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1000);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    
    // Simular loading por 1 segundo
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '-3s'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                <div className="w-6 sm:w-8 h-6 sm:h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-900 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-gray-900 font-bold text-xl sm:text-2xl">Olga</h1>
                <p className="text-gray-500 text-xs sm:text-sm">Colaboradora Digital</p>
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {isResetPassword ? 'Recuperar Senha' : 
                 isSignUp ? 'Criar Conta' : 
                 'Bem-vindo de volta!'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {isResetPassword ? 'Digite seu email para recuperar a senha' :
                 isSignUp ? 'Crie sua conta para acessar a plataforma' :
                 'Entre na sua conta para acessar a plataforma'}
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div 
            className="p-6 sm:p-8 rounded-2xl border border-gray-200/80 relative"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.12)'
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Name Field (only for sign up) */}
              {isSignUp && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Seu nome completo"
                    required={isSignUp}
                  />
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="seu@email.com"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Password Field (not for reset password) */}
              {!isResetPassword && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pl-11 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember & Forgot (only for login) */}
              {!isSignUp && !isResetPassword && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                      Lembrar de mim
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 
                 isResetPassword ? 'Enviar Email de Recuperação' :
                 isSignUp ? 'Criar Conta' : 
                 'Entrar na Plataforma'}
              </button>

              {/* Mode Toggle */}
              <div className="relative my-4 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {isResetPassword ? 'Lembrou da senha?' :
                     isSignUp ? 'Já tem uma conta?' : 
                     'Não tem acesso ainda?'}
                  </span>
                </div>
              </div>

              {/* Mode Switch Button */}
              <button
                type="button"
                onClick={() => {
                  if (isResetPassword) {
                    setIsResetPassword(false);
                  } else {
                    setIsSignUp(!isSignUp);
                  }
                }}
                className="w-full py-3 px-4 border-2 border-blue-300 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
              >
                <span>
                  {isResetPassword ? 'Voltar ao Login' :
                   isSignUp ? 'Fazer Login' : 
                   'Criar Nova Conta'}
                </span>
              </button>

              {/* Demo Button (only for login) */}
              {!isSignUp && !isResetPassword && (
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 border-2 border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 disabled:opacity-50"
                >
                  <Smile className="w-5 h-5" />
                  <span>Acesso Demo</span>
                </button>
              )}
            </form>

            {/* Quick Access Panel */}
            <div className="mt-4 sm:mt-6 space-y-3">
              {/* Demo Access */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Smile className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Acesso Demo</h4>
                    <p className="text-xs text-gray-600">
                      Clique em "Acesso Demo" para testar a plataforma
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">Quer implementar na sua empresa?</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs">
                    <a
                      href="mailto:contato@olga-ai.com"
                      className="text-green-600 font-semibold hover:text-green-700 flex items-center space-x-1 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      <span>contato@olga-ai.com</span>
                    </a>
                    <a
                      href="tel:+5511978259695"
                      className="text-green-600 font-semibold hover:text-green-700 flex items-center space-x-1 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>(11) 97825-9695</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white w-full mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Logo e Descrição */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 sm:w-8 h-6 sm:h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 sm:w-5 h-4 sm:h-5 bg-gray-900 rounded-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg">Olga</h3>
                  <p className="text-gray-400 text-xs">Colaboradora Digital</p>
                </div>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm">
                IA especializada em seguros com total compliance SUSEP.
              </p>
            </div>

            {/* Contato */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs sm:text-sm">Contato</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <a
                    href="mailto:contato@olga-ai.com"
                    className="text-gray-300 hover:text-white transition-colors text-xs sm:text-sm"
                  >
                    contato@olga-ai.com
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <a
                    href="tel:+5511978259695"
                    className="text-gray-300 hover:text-white transition-colors text-xs sm:text-sm"
                  >
                    (11) 97825-9695
                  </a>
                </div>
              </div>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs sm:text-sm">Empresa</h4>
              <div className="text-gray-300 text-xs space-y-1">
                <div>CNPJ: 50.707.445/0001-84</div>
                <div className="hidden sm:block">WeWork - Av. das Nações Unidas, 14261</div>
                <div className="sm:hidden">WeWork - São Paulo</div>
                <div>São Paulo - SP, 04533-085</div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-4 sm:mt-6 pt-4 sm:pt-6 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-gray-400 text-xs mb-2 md:mb-0">
              © 2025 Olga AI. Todos os direitos reservados.
            </div>
            <div className="flex items-center space-x-3 text-gray-400 text-xs">
              <span>✓ SUSEP</span>
              <span>✓ LGPD</span>
              <span>✓ ISO 27001</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}