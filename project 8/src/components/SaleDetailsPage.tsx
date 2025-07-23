import React from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Clock, 
  MessageCircle, 
  Download, 
  Send, 
  FileText, 
  MoreHorizontal,
  CreditCard,
  CheckCircle,
  Share,
  RefreshCw,
  X
} from 'lucide-react';

interface SaleDetailsPageProps {
  onBack: () => void;
}

export function SaleDetailsPage({ onBack }: SaleDetailsPageProps) {
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
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Pipeline</button>
                <button className="text-gray-900 font-medium relative py-2 text-sm">
                  Vendas
                  <div className="absolute -bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>
                </button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Comissões</button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Emissão</button>
                <button className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm">Relatórios</button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-md hover:bg-gray-50 transition-colors">
                <Share className="w-4 h-4 text-gray-500" />
              </button>
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

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 flex items-center space-x-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Vendas</span>
            </button>
            <span className="text-gray-900 font-medium">Maria José Silva</span>
          </div>
          <div className="flex items-center space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center space-x-2 text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 flex items-center space-x-2 text-sm">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium text-xl">
                MJ
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Maria José Silva</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>maria.jose@email.com</span>
                  <span>•</span>
                  <span>(11) 99876-5432</span>
                  <span>•</span>
                  <span>CPF: 123.456.789-00</span>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              Pago - Apólice Emitida
            </span>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Valor Total</div>
              <div className="text-xl font-semibold text-gray-900">R$ 1.247,50</div>
              <div className="text-xs text-gray-500">12x R$ 103,96</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Produto</div>
              <div className="text-xl font-semibold text-gray-900">Seguro Auto</div>
              <div className="text-xs text-gray-500">Honda Civic 2022</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Tempo Conversão</div>
              <div className="text-xl font-semibold text-gray-900">2h 34min</div>
              <div className="text-xs text-gray-500">Lead → Pago</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Emissão</div>
              <div className="text-xl font-semibold text-gray-900">1min 23s</div>
              <div className="text-xs text-gray-500">Pago → Apólice</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-base font-medium text-gray-900">Jornada do Cliente</h3>
                <p className="text-sm text-gray-500">Histórico completo da automação IA</p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Timeline Item 1 */}
                  <div className="relative pl-8">
                    <div className="absolute left-2 top-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                    <div className="absolute left-2.5 top-4 bottom-0 w-px bg-gray-200"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">Lead Capturado</h4>
                          <span className="text-xs text-gray-500">11:45</span>
                        </div>
                        <p className="text-sm text-gray-600">Cliente iniciou conversa via WhatsApp solicitando cotação para Honda Civic 2022</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            IA: Onboarding
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Item 2 */}
                  <div className="relative pl-8">
                    <div className="absolute left-2 top-1 w-2 h-2 bg-purple-500 rounded-full border-2 border-white shadow-sm"></div>
                    <div className="absolute left-2.5 top-4 bottom-0 w-px bg-gray-200"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">Qualificação IA</h4>
                          <span className="text-xs text-gray-500">11:52</span>
                        </div>
                        <p className="text-sm text-gray-600">IA coletou dados do veículo, perfil de uso e histórico. Cliente qualificado automaticamente</p>
                        <div className="mt-2 space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700">
                            IA: Qualificação
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                            Score: 87/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Item 3 */}
                  <div className="relative pl-8">
                    <div className="absolute left-2 top-1 w-2 h-2 bg-yellow-500 rounded-full border-2 border-white shadow-sm"></div>
                    <div className="absolute left-2.5 top-4 bottom-0 w-px bg-gray-200"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">Simulação e Proposta</h4>
                          <span className="text-xs text-gray-500">12:03</span>
                        </div>
                        <p className="text-sm text-gray-600">IA gerou 3 opções de cobertura. Cliente escolheu cobertura intermediária</p>
                        <div className="mt-3">
                          <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <div className="font-medium text-gray-900 mb-2">Proposta Selecionada:</div>
                            <div className="text-gray-600">
                              • Cobertura: Compreensiva<br />
                              • Franquia: R$ 1.890<br />
                              • Seguradora: Porto Seguro<br />
                              • Valor: R$ 1.247,50 (12x)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Item 4 */}
                  <div className="relative pl-8">
                    <div className="absolute left-2 top-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                    <div className="absolute left-2.5 top-4 bottom-0 w-px bg-gray-200"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">Pagamento Concluído</h4>
                          <span className="text-xs text-gray-500">14:19</span>
                        </div>
                        <p className="text-sm text-gray-600">Pagamento aprovado via PIX - Stripe. Confirmação automática em 23 segundos</p>
                        <div className="mt-2 space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                            PIX Aprovado
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            ID: px_1234567890
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Item 5 */}
                  <div className="relative pl-8">
                    <div className="absolute left-2 top-1 w-2 h-2 bg-gray-900 rounded-full border-2 border-white shadow-sm"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">Apólice Emitida</h4>
                          <span className="text-xs text-gray-500">14:20</span>
                        </div>
                        <p className="text-sm text-gray-600">Apólice gerada automaticamente e enviada via WhatsApp. Processo concluído</p>
                        <div className="mt-2 space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-700">
                            Nº Apólice: 00123456789
                          </span>
                          <button className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                            <Download className="w-3 h-3 mr-1" />
                            Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* WhatsApp Conversation Preview */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-medium text-gray-900">Conversa WhatsApp</h4>
                  <span className="ml-auto text-xs text-gray-500">Últimas mensagens</span>
                </div>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto space-y-3">
                <div className="max-w-72 bg-white border border-gray-200 rounded-lg rounded-bl-sm p-3">
                  <p className="text-sm text-gray-800">Olá! Gostaria de uma cotação para meu Honda Civic 2022.</p>
                  <div className="text-xs text-gray-500 mt-1">11:45</div>
                </div>
                <div className="max-w-72 bg-green-100 rounded-lg rounded-br-sm p-3 ml-auto">
                  <p className="text-sm text-gray-800">🚗 Perfeito! Vou te ajudar com a cotação do seu Honda Civic. Para começar, preciso de algumas informações...</p>
                  <div className="text-xs text-gray-600 mt-1 flex items-center justify-between">
                    <span>11:45</span>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                </div>
                <div className="max-w-72 bg-white border border-gray-200 rounded-lg rounded-bl-sm p-3">
                  <p className="text-sm text-gray-800">Pago! Muito fácil pelo PIX 😊</p>
                  <div className="text-xs text-gray-500 mt-1">14:20</div>
                </div>
                <div className="max-w-72 bg-green-100 rounded-lg rounded-br-sm p-3 ml-auto">
                  <p className="text-sm text-gray-800">🎉 Parabéns! Seu seguro foi aprovado e a apólice está sendo emitida. Você receberá o documento em instantes!</p>
                  <div className="text-xs text-gray-600 mt-1 flex items-center justify-between">
                    <span>14:20</span>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button className="w-full text-sm text-green-600 font-medium hover:text-green-700">
                  Ver conversa completa
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Ações Rápidas</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span>Enviar mensagem</span>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>Reenviar apólice</span>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                  <span>Iniciar renovação</span>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center space-x-2">
                  <X className="w-4 h-4 text-red-400" />
                  <span>Cancelar apólice</span>
                </button>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Detalhes do Pagamento</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Método:</span>
                  <span className="text-gray-900 font-medium">PIX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-700 font-medium">Aprovado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="text-gray-900 font-medium">R$ 1.247,50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa Stripe:</span>
                  <span className="text-gray-900">R$ 3,99</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comissão:</span>
                  <span className="text-gray-900 font-medium">R$ 187,13</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Líquido:</span>
                    <span className="text-gray-900 font-semibold">R$ 1.055,38</span>
                  </div>
                </div>
              </div>
            </div>

            {/* IA Insights */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Insights IA</h4>
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-700 font-medium mb-1">Conversão Rápida</div>
                  <div className="text-xs text-blue-600">Cliente converteu 40% mais rápido que a média</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-700 font-medium mb-1">Alto Score</div>
                  <div className="text-xs text-green-600">Perfil ideal para renovação automática</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-700 font-medium mb-1">Cross-sell</div>
                  <div className="text-xs text-purple-600">Oportunidade para seguro residencial</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}