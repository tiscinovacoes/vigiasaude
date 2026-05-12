import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mockAtas, mockMedicamentosAta } from '../../lib/mockData';
import { FileUpload } from '../../components/ui/FileUpload';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { Scale, ArrowRight, TrendingUp } from 'lucide-react';
import { reequilibrioSchema } from './schema';
import type { ReequilibrioFormData } from './schema';
import { ValidatedInput } from '../../components/ui/Form/ValidatedInput';
import { ValidatedTextarea } from '../../components/ui/Form/ValidatedTextarea';
import { maskCurrencyBRL, parseCurrencyBRL, formatCurrencyBRL } from '../../lib/utils';

export function SolicitarReequilibrio() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [maskedPrice, setMaskedPrice] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    resetField,
    formState: { errors, isValid }
  } = useForm<ReequilibrioFormData>({
    resolver: zodResolver(reequilibrioSchema),
    mode: 'onChange',
    defaultValues: {
      novoPreco: 0,
      justificativa: '',
      itemAtaId: '',
    }
  });

  const selectedAtaId = useState('')[0]; // Keeping for compatibility with legacy logic if needed, but we'll use watch
  const watchedAtaId = watch('itemAtaId') ? mockMedicamentosAta.find(m => m.id === watch('itemAtaId'))?.ataId : '';
  const [localAtaId, setLocalAtaId] = useState('');

  const selectedMedId = watch('itemAtaId');
  const novoPreco = watch('novoPreco');

  // Derived state
  const medicamentosDisponiveis = useMemo(() => {
    return mockAtas.find(a => a.id === localAtaId) ? mockMedicamentosAta.filter(m => m.ataId === localAtaId) : [];
  }, [localAtaId]);

  const medicamentoAtual = useMemo(() => {
    return mockMedicamentosAta.find(m => m.id === selectedMedId);
  }, [selectedMedId]);

  const precoAtual = medicamentoAtual?.precoUnitario || 0;
  
  const divergenciaPercentual = precoAtual > 0 
    ? ((novoPreco - precoAtual) / precoAtual) * 100 
    : 0;

  const onFormSubmit = (data: ReequilibrioFormData) => {
    console.log('Form data:', data);
    setShowModal(true);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const masked = maskCurrencyBRL(value);
    setMaskedPrice(masked);
    const parsed = parseCurrencyBRL(masked);
    setValue('novoPreco', parsed, { shouldValidate: true });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-600" />
          Solicitar Reequilíbrio Econômico-Financeiro
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Formulário exclusivo do fornecedor para propor reajustes justificados por imprevisibilidade de mercado.
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ata de Registro de Preço *</label>
              <select 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={localAtaId}
                onChange={(e) => {
                  setLocalAtaId(e.target.value);
                  setValue('itemAtaId', '');
                }}
              >
                <option value="">Selecione uma Ata...</option>
                {mockAtas.map(ata => (
                  <option key={ata.id} value={ata.id}>{ata.numero} - Vencimento: {new Date(ata.dataFim).toLocaleDateString()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Medicamento/Item *</label>
              <select 
                {...register('itemAtaId')}
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 disabled:bg-gray-50 ${
                  errors.itemAtaId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                disabled={!localAtaId}
              >
                <option value="">Selecione o item...</option>
                {medicamentosDisponiveis.map(med => (
                  <option key={med.id} value={med.id}>{med.nome}</option>
                ))}
              </select>
              {errors.itemAtaId && <p className="mt-1 text-xs text-red-500 font-medium">{errors.itemAtaId.message}</p>}
            </div>
          </div>

          {medicamentoAtual && (
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col md:flex-row items-center gap-6 justify-between animate-in fade-in zoom-in duration-300">
              <div className="text-center md:text-left">
                <p className="text-sm font-medium text-blue-600">Preço Atual</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrencyBRL(precoAtual)}</p>
              </div>
              
              <ArrowRight className="w-6 h-6 text-blue-300 hidden md:block" />

              <div className="w-full md:w-auto flex-1 max-w-xs">
                <label className="block text-sm font-medium text-blue-600 mb-1 text-center md:text-left">Novo Preço Solicitado *</label>
                <input 
                  type="text" 
                  className={`w-full rounded-md border px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 text-center md:text-left transition-all ${
                    errors.novoPreco ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="R$ 0,00"
                  value={maskedPrice}
                  onChange={handlePriceChange}
                />
                {errors.novoPreco && <p className="mt-1 text-xs text-red-500 font-medium text-center md:text-left">{errors.novoPreco.message}</p>}
              </div>

              <div className="text-center md:text-right">
                <p className="text-sm font-medium text-blue-600">Divergência / Reajuste</p>
                <div className={`flex items-center justify-center md:justify-end gap-1 text-2xl font-bold ${divergenciaPercentual > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                  <TrendingUp className="w-5 h-5" />
                  {divergenciaPercentual.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          <ValidatedTextarea
            label="Justificativa Legal e Mercadológica *"
            register={register('justificativa')}
            error={errors.justificativa?.message}
            placeholder="Explique os motivos de força maior ou mudanças de mercado que impossibilitam o fornecimento no valor originalmente pactuado..."
            rows={4}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evidências (Notas de compra, cartas do fabricante, etc) *</label>
            <FileUpload accept="application/pdf,image/*" maxFiles={5} />
            <p className="text-xs text-gray-500 mt-2">É obrigatório o envio de provas documentais do aumento do custo na cadeia de suprimentos.</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isValid || novoPreco <= precoAtual}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
          >
            Enviar Solicitação
          </button>
        </div>
      </form>

      <SuccessModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); navigate('/'); }}
        title="Solicitação Enviada"
        message="Seu pedido de reequilíbrio foi protocolado e será analisado pela área técnica e jurídica do órgão."
      />
    </div>
  );
}
