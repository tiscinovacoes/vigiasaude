import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

// Dados simulados do item sendo cotado
const itemCotacao = {
  id: 'med-123',
  nome: 'Dipirona Sódica 500mg/ml - Ampola 2ml',
  quantidade: 50000,
  precoBPS: 0.90,
  precoCMED: 1.20,
};

// Dados simulados de 3 fornecedores para a dispensa
const orcamentos = [
  { id: 'f1', nome: 'MedSupply Nacional LTDA', precoUnitario: 0.85, prazoEntrega: '5 dias', validadeProposta: '15/06/2026' },
  { id: 'f2', nome: 'FarmaDistribuidora Regional', precoUnitario: 0.95, prazoEntrega: '2 dias', validadeProposta: '20/06/2026' },
  { id: 'f3', nome: 'Global Health Import', precoUnitario: 1.25, prazoEntrega: '10 dias', validadeProposta: '10/06/2026' },
];

export function CompararOrcamentos() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>('');
  const [justificativa, setJustificativa] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getPriceClass = (preco: number) => {
    if (preco > itemCotacao.precoCMED) return 'text-red-600 font-bold'; // > CMED = Vermelho
    if (preco <= itemCotacao.precoBPS) return 'text-green-600 font-bold'; // <= BPS = Verde
    return 'text-gray-900'; // Entre BPS e CMED
  };

  // Encontrar o menor preço que seja menor ou igual ao BPS (Recomendação de IA)
  const recomendacao = orcamentos.reduce((prev, curr) => {
    if (curr.precoUnitario < prev.precoUnitario) return curr;
    return prev;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFornecedor || !justificativa.trim()) return;
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dispensa Emergencial - Parecer Técnico</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cotação #{id || '10293'} - {itemCotacao.nome} ({itemCotacao.quantidade.toLocaleString('pt-BR')} unidades)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informações de Referência */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-400" />
              Preços de Referência
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-sm text-gray-600">Preço Banco de Preços em Saúde (BPS)</span>
                <span className="font-bold text-green-600">{formatCurrency(itemCotacao.precoBPS)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Preço Máximo CMED</span>
                <span className="font-bold text-red-600">{formatCurrency(itemCotacao.precoCMED)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Valores acima da CMED são considerados abusivos por lei. Valores abaixo do BPS garantem economia aos cofres públicos.
            </p>
          </div>

          {/* Recomendação IA Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Sparkles className="w-24 h-24 text-indigo-600" />
            </div>
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2 relative z-10">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Recomendação Vigia Saúde
            </h3>
            <p className="text-sm text-indigo-800 mb-4 relative z-10">
              Baseado na otimização de recursos públicos, sugerimos o fornecedor:
            </p>
            <div className="bg-white p-3 rounded-lg border border-indigo-100 relative z-10">
              <p className="font-bold text-gray-900">{recomendacao.nome}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Valor Unitário:</span>
                <span className={cn("text-sm", getPriceClass(recomendacao.precoUnitario))}>
                  {formatCurrency(recomendacao.precoUnitario)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 border-t border-gray-100 pt-1">
                <span className="text-sm text-gray-500">Diferença BPS:</span>
                <span className="text-sm font-semibold text-green-600">
                  -{formatCurrency(itemCotacao.precoBPS - recomendacao.precoUnitario)} ({( (1 - (recomendacao.precoUnitario / itemCotacao.precoBPS)) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Orçamentos e Formulário */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamentos Recebidos</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                      <th className="px-4 py-3 w-10">Sel.</th>
                      <th className="px-4 py-3">Fornecedor</th>
                      <th className="px-4 py-3">P. Unitário</th>
                      <th className="px-4 py-3">Prazo Ent.</th>
                      <th className="px-4 py-3">Validade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orcamentos.map((orcamento) => {
                      const isAcimaCmed = orcamento.precoUnitario > itemCotacao.precoCMED;
                      return (
                        <tr 
                          key={orcamento.id} 
                          className={cn(
                            "border-b border-gray-100 transition-colors",
                            selectedFornecedor === orcamento.id ? "bg-blue-50" : "hover:bg-gray-50",
                            isAcimaCmed && "bg-red-50/30"
                          )}
                          onClick={() => !isAcimaCmed && setSelectedFornecedor(orcamento.id)}
                        >
                          <td className="px-4 py-3">
                            <input 
                              type="radio" 
                              name="fornecedor" 
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                              checked={selectedFornecedor === orcamento.id}
                              onChange={() => setSelectedFornecedor(orcamento.id)}
                              disabled={isAcimaCmed}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {orcamento.nome}
                            {orcamento.id === recomendacao.id && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                                IA
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={getPriceClass(orcamento.precoUnitario)}>
                              {formatCurrency(orcamento.precoUnitario)}
                            </span>
                            {isAcimaCmed && (
                              <AlertTriangle className="inline-block w-4 h-4 ml-1 text-red-500" title="Acima da CMED" />
                            )}
                          </td>
                          <td className="px-4 py-3">{orcamento.prazoEntrega}</td>
                          <td className="px-4 py-3">{orcamento.validadeProposta}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="justificativa" className="block text-sm font-medium text-gray-700 mb-1">
                  Justificativa da Escolha (Exigência TCU) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="justificativa"
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Justifique legalmente a escolha do fornecedor, focando em preço, prazo e vantajosidade para a administração pública..."
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={!selectedFornecedor || !justificativa.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmar Escolha
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <SuccessModal 
        isOpen={showModal} 
        onClose={handleModalClose}
        title="Orçamento Aprovado!"
        message="A justificativa e a escolha do fornecedor foram registradas no sistema. O pedido de compra emergencial será emitido."
        autoCloseMs={3500}
      />
    </div>
  );
}
