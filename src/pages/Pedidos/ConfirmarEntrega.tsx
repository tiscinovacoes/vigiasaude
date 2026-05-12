import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { mockPedidosCompra, mockAtas } from '../../lib/mockData';
import { FileUpload } from '../../components/ui/FileUpload';
import { SuccessModal } from '../../components/ui/SuccessModal';

export function ConfirmarEntrega() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // States for form
  const [checkedItems, setCheckedItems] = useState({
    nf: false,
    medicamentos: false,
    lote: false,
  });
  const [nfNumber, setNfNumber] = useState('');
  const [observations, setObservations] = useState('');

  const pedido = mockPedidosCompra.find(p => p.id === id);
  const ata = mockAtas.find(a => a.id === pedido?.ataId);

  if (!pedido || pedido.status !== 'EM_TRANSITO') {
    return <div className="p-8 text-center text-gray-500">Pedido não encontrado ou não está em trânsito.</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isFormValid = checkedItems.nf && checkedItems.medicamentos && checkedItems.lote && nfNumber.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    // Simulate API Call
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/pedidos');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Confirmar Entrega - {pedido.id.toUpperCase()}</h1>
        <p className="mt-1 text-sm text-gray-500">Preencha o checklist de recebimento para o pedido vinculado à Ata {ata?.numero}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resumo do Pedido */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Resumo do Pedido</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ata:</span>
                <span className="font-medium text-gray-900">{ata?.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Itens:</span>
                <span className="font-medium text-gray-900">{pedido.itens.length}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-gray-500 font-medium">Valor Total:</span>
                <span className="font-bold text-gray-900">{formatCurrency(pedido.valorTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Checklist de Conformidade</h3>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    checked={checkedItems.nf}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, nf: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">A Nota Fiscal está em conformidade com o Pedido de Compra gerado.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    checked={checkedItems.medicamentos}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, medicamentos: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">As quantidades e integridade física dos medicamentos estão corretas.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    checked={checkedItems.lote}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, lote: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Os lotes e as datas de validade conferem com a especificação técnica mínima.</span>
                </label>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <label htmlFor="nfNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Nota Fiscal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nfNumber"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: 123456789"
                  value={nfNumber}
                  onChange={(e) => setNfNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comprovante / Canhoto Assinado
                </label>
                <FileUpload accept="image/*,application/pdf" />
              </div>

              <div>
                <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações de Recebimento
                </label>
                <textarea
                  id="observations"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Se houver alguma ressalva, descreva aqui..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={!isFormValid}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Entrega
              </button>
            </div>
          </form>
        </div>
      </div>

      <SuccessModal 
        isOpen={showModal} 
        onClose={handleModalClose}
        title="Entrega Confirmada!"
        message="A nota fiscal foi processada e o estoque virtual foi atualizado com sucesso."
        autoCloseMs={3000}
      />
    </div>
  );
}
