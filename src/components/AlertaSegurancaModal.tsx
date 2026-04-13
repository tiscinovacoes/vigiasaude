'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  X,
  AlertTriangle,
  MapPinned,
  Clock,
  TrendingUp,
  Package,
  ShieldAlert,
  Navigation,
  DollarSign,
} from 'lucide-react';
import type { EntregaLogistica } from '@/lib/api';

interface AlertaSegurancaModalProps {
  entrega: EntregaLogistica;
  tipo: 'desvio_rota' | 'parado_excessivo';
  onClose: () => void;
}

const MOCK_ALERTA_DESVIO = {
  tipo: 'Desvio de Rota Detectado',
  rotaPrevista: 'Av. Afonso Pena → Rua 14 de Julho → Destino',
  distanciaDesvio: '1,8 km fora da rota',
  enderecoAtual: 'Av. Brasil, 1500 - Jardim América',
  localizacaoAtual: '-20.4697, -54.6201',
  horaDeteccao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
};

const MOCK_ALERTA_PARADO = {
  tipo: 'Veículo Parado Excessivamente',
  duracao: '38 minutos',
  horaUltimaMovimentacao: new Date(Date.now() - 38 * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  enderecoAtual: 'Rua Antônio Trajano, 200 - Centro',
  localizacaoAtual: '-20.4612, -54.6150',
  distanciaDestino: '2,4 km do destino',
};

const MOCK_MEDICAMENTOS = [
  { nome: 'Insulina NPH 100UI/ml', quantidade: 5, altoCusto: true, valorUnitario: 'R$ 45,80' },
  { nome: 'Metformina 850mg', quantidade: 30, altoCusto: false, valorUnitario: 'R$ 0,45' },
];

export function AlertaSegurancaModal({ entrega, tipo, onClose }: AlertaSegurancaModalProps) {
  const isDesvioRota = tipo === 'desvio_rota';
  const alertaDetalhes = isDesvioRota ? MOCK_ALERTA_DESVIO : MOCK_ALERTA_PARADO;

  const medicamentosAltoCusto = MOCK_MEDICAMENTOS.filter((m) => m.altoCusto);
  const valorTotalAltoCusto = medicamentosAltoCusto.reduce((sum, med) => {
    const valor = parseFloat(med.valorUnitario.replace('R$', '').replace(',', '.').trim() || '0');
    return sum + valor * med.quantidade;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1002] p-4">
      <Card className="w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header vermelho */}
        <div className="sticky top-0 bg-red-600 z-10 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg text-white font-bold">ALERTA DE SEGURANÇA</h2>
                <p className="text-sm text-red-100">{alertaDetalhes.tipo}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-red-100 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Resumo da Entrega */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-red-700" />
              <h3 className="text-sm font-semibold text-red-900">
                Informações da Entrega sob Monitoramento
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-red-700 font-medium">Paciente</p>
                <p className="text-[#1E293B] font-semibold">
                  {entrega.pacientes?.nome_completo || 'Paciente'}
                </p>
              </div>
              <div>
                <p className="text-red-700 font-medium">Destino</p>
                <p className="text-[#1E293B] font-semibold">
                  {entrega.pacientes?.endereco_completo || '—'}
                </p>
              </div>
              <div>
                <p className="text-red-700 font-medium">Dispensa ID</p>
                <p className="text-[#1E3A8A] font-mono font-semibold">{entrega.dispense_id}</p>
              </div>
              {entrega.motoristas?.nome && (
                <div>
                  <p className="text-red-700 font-medium">Motorista Responsável</p>
                  <p className="text-[#1E293B] font-semibold">{entrega.motoristas.nome}</p>
                </div>
              )}
              {entrega.motoristas?.placa_veiculo && (
                <div>
                  <p className="text-red-700 font-medium">Placa do Veículo</p>
                  <p className="text-[#1E293B] font-mono font-semibold">
                    {entrega.motoristas.placa_veiculo}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Medicamentos de Alto Custo */}
          {medicamentosAltoCusto.length > 0 && (
            <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-orange-700" />
                <h3 className="text-sm font-semibold text-orange-900">
                  Medicamentos de Alto Custo na Carga
                </h3>
              </div>
              <div className="space-y-2">
                {medicamentosAltoCusto.map((med, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-orange-200 rounded p-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-700" />
                      <div>
                        <p className="text-sm text-[#1E293B] font-semibold">{med.nome}</p>
                        <p className="text-xs text-[#64748B]">Quantidade: {med.quantidade}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-orange-700 font-bold">{med.valorUnitario}</p>
                      <p className="text-xs text-[#64748B]">por unidade</p>
                    </div>
                  </div>
                ))}
                <div className="bg-orange-100 border border-orange-300 rounded p-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-900 font-semibold">
                      Valor Total em Risco:
                    </span>
                    <span className="text-lg text-orange-700 font-bold">
                      R$ {valorTotalAltoCusto.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detalhes — Desvio de Rota */}
          {isDesvioRota && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-5 h-5 text-red-700" />
                <h3 className="text-sm font-semibold text-red-900">Detalhes do Desvio de Rota</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#64748B] text-xs mb-1">Rota Prevista</p>
                      <p className="text-[#1E293B] font-semibold">{MOCK_ALERTA_DESVIO.rotaPrevista}</p>
                    </div>
                    <div>
                      <p className="text-[#64748B] text-xs mb-1">Distância do Desvio</p>
                      <p className="text-red-700 font-bold">{MOCK_ALERTA_DESVIO.distanciaDesvio}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-[#64748B] text-xs mb-1">Localização Atual</p>
                  <div className="flex items-start gap-2">
                    <MapPinned className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-[#1E293B] font-medium">
                        {MOCK_ALERTA_DESVIO.enderecoAtual}
                      </p>
                      <p className="text-xs text-[#64748B] font-mono mt-0.5">
                        {MOCK_ALERTA_DESVIO.localizacaoAtual}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-[#64748B] text-xs mb-1">Hora da Detecção</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-700" />
                    <p className="text-sm text-[#1E293B] font-medium">
                      {MOCK_ALERTA_DESVIO.horaDeteccao}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detalhes — Parado Excessivo */}
          {!isDesvioRota && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm font-semibold text-amber-900">
                  Detalhes do Tempo Parado
                </h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#64748B] text-xs mb-1">Tempo Parado</p>
                      <p className="text-amber-700 font-bold text-lg">
                        {MOCK_ALERTA_PARADO.duracao}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#64748B] text-xs mb-1">Última Movimentação</p>
                      <p className="text-[#1E293B] font-medium">
                        {MOCK_ALERTA_PARADO.horaUltimaMovimentacao}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="text-[#64748B] text-xs mb-1">Localização Atual</p>
                  <div className="flex items-start gap-2">
                    <MapPinned className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-[#1E293B] font-medium">
                        {MOCK_ALERTA_PARADO.enderecoAtual}
                      </p>
                      <p className="text-xs text-[#64748B] font-mono mt-0.5">
                        {MOCK_ALERTA_PARADO.localizacaoAtual}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="text-[#64748B] text-xs mb-1">Distância até Destino</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-700" />
                    <p className="text-sm text-[#1E293B] font-medium">
                      {MOCK_ALERTA_PARADO.distanciaDestino}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações Recomendadas */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Ações Recomendadas</h4>
            <ul className="space-y-2 text-sm text-[#64748B]">
              <li className="flex items-start gap-2">
                <span className="text-[#1E3A8A] font-semibold mt-0.5">1.</span>
                <span>
                  Entrar em contato imediatamente com o motorista{' '}
                  {entrega.motoristas?.nome || 'responsável'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1E3A8A] font-semibold mt-0.5">2.</span>
                <span>Solicitar justificativa para a situação detectada</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1E3A8A] font-semibold mt-0.5">3.</span>
                <span>
                  Verificar rastreamento em tempo real do veículo{' '}
                  {entrega.motoristas?.placa_veiculo || ''}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1E3A8A] font-semibold mt-0.5">4.</span>
                <span>
                  {isDesvioRota
                    ? 'Confirmar se há necessidade de alteração da rota planejada'
                    : 'Verificar se há necessidade de enviar veículo de apoio'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1E3A8A] font-semibold mt-0.5">5.</span>
                <span>Registrar ocorrência no sistema de auditoria</span>
              </li>
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Acionar Motorista
            </Button>
            <Button className="flex-1 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white cursor-pointer">
              <MapPinned className="w-4 h-4 mr-2" />
              Ver Rastreamento
            </Button>
            <Button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-[#1E293B] cursor-pointer"
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
