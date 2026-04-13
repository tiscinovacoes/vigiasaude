'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Package,
  FileText,
  Fingerprint,
  Camera,
  AlertTriangle,
  TrendingUp,
  Activity,
  ShieldAlert,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// ============================================================================
// MOCK DATA — substitua com chamadas ao Supabase quando disponível
// ============================================================================
const pacientesData = [
  {
    id: 1,
    nome: 'Ana Beatriz Lima Ferreira',
    cpf: '123.***.***-45',
    telefone: '(67) 99812-3456',
    endereco: 'Rua das Flores, 123 - Bairro Centro, Campo Grande/MS',
    janelaEntrega: '08:00-12:00',
    statusReceita: 'Ativa' as 'Ativa' | 'Vencida',
    validadeReceita: '30/06/2026',
    proximaEntrega: '15/04/2026',
    statusOrdemAtual: 'Separado',
    indiceAdesao: 96.4,
    totalRecebidoAno: 4,
    historicoDispensacoes: [
      {
        id: 1,
        dataHora: '12/03/2026 09:15',
        medicamentos: 'Insulina NPH 100UI/ml, Metformina 850mg',
        motorista: 'Carlos Andrade',
        dispenseId: 'DISP-2026-0312',
        batchId: 'LT-2024-INS001',
        serialNumbers: ['SN-A101-2026', 'SN-A102-2026', 'SN-A103-2026'],
        fotoUrl: 'https://via.placeholder.com/600x400?text=Foto+Entrega+Março',
        assinaturaUrl: 'https://via.placeholder.com/400x100?text=Assinatura+Digital',
        custoTotal: 229.5,
        itensDetalhados: [
          { medicamento: 'Insulina NPH 100UI/ml', quantidade: 5, valorTotal: 229.0 },
          { medicamento: 'Metformina 850mg', quantidade: 30, valorTotal: 0.5 },
        ],
      },
      {
        id: 2,
        dataHora: '10/02/2026 10:30',
        medicamentos: 'Insulina NPH 100UI/ml',
        motorista: 'Marcos Vinicius',
        dispenseId: 'DISP-2026-0198',
        batchId: 'LT-2024-INS002',
        serialNumbers: ['SN-B201-2026', 'SN-B202-2026'],
        fotoUrl: 'https://via.placeholder.com/600x400?text=Foto+Entrega+Fevereiro',
        assinaturaUrl: 'https://via.placeholder.com/400x100?text=Assinatura+Digital',
        custoTotal: 91.6,
        itensDetalhados: [
          { medicamento: 'Insulina NPH 100UI/ml', quantidade: 2, valorTotal: 91.6 },
        ],
      },
    ],
    recallsImpactados: [] as any[],
  },
  {
    id: 2,
    nome: 'João Carlos Mendes',
    cpf: '987.***.***-21',
    telefone: '(67) 98765-4321',
    endereco: 'Av. Afonso Pena, 500 - Bairro Jardim, Campo Grande/MS',
    janelaEntrega: '13:00-17:00',
    statusReceita: 'Vencida' as 'Ativa' | 'Vencida',
    validadeReceita: '28/02/2026',
    proximaEntrega: 'Pendente',
    statusOrdemAtual: 'Bloqueado - Receita Vencida',
    indiceAdesao: 72.5,
    totalRecebidoAno: 3,
    historicoDispensacoes: [
      {
        id: 3,
        dataHora: '05/01/2026 14:20',
        medicamentos: 'Losartana 50mg',
        motorista: 'Carlos Andrade',
        dispenseId: 'DISP-2026-0045',
        batchId: 'LT-2024-LOS008',
        serialNumbers: ['SN-C301-2026'],
        fotoUrl: 'https://via.placeholder.com/600x400?text=Foto+Entrega+Janeiro',
        assinaturaUrl: 'https://via.placeholder.com/400x100?text=Assinatura+Digital',
        custoTotal: 8.16,
        itensDetalhados: [
          { medicamento: 'Losartana 50mg', quantidade: 30, valorTotal: 8.16 },
        ],
      },
    ],
    recallsImpactados: [
      {
        id: 1,
        medicamento: 'Losartana 50mg',
        motivo: 'Contaminação por partículas metálicas — Lote LT-2024-LOS008',
        gravidade: 'Alta',
        batchId: 'LT-2024-LOS008',
        serialNumber: 'SN-C301-2026',
        dataRecebimento: '05/01/2026',
        dataAlerta: '20/01/2026',
        statusAcao: 'Medicamento devolvido e substituído',
        dataResolucao: '25/01/2026',
      },
    ],
  },
];

// ============================================================================
// PAGE COMPONENT
// ============================================================================
export default function PacienteDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const [comprovanteModal, setComprovanteModal] = useState<any>(null);

  const paciente = pacientesData.find((p) => p.id === Number(params.id));

  if (!paciente) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <p className="text-[#64748B]">Paciente não encontrado</p>
          <Button
            onClick={() => router.push('/dashboard/pacientes')}
            className="mt-4 cursor-pointer bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
          >
            Voltar aos Pacientes
          </Button>
        </div>
      </div>
    );
  }

  const statusReceitaConfig = {
    Ativa: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    Vencida: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const receitaCfg = statusReceitaConfig[paciente.statusReceita];

  const getAdesaoColor = (adesao: number) => {
    if (adesao >= 95) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    if (adesao >= 80) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  };

  const adesaoCfg = getAdesaoColor(paciente.indiceAdesao || 0);

  const investimentoTotal = paciente.historicoDispensacoes?.reduce((acc, disp) => {
    return acc + (disp.custoTotal || 0);
  }, 0) || 0;

  return (
    <div className="space-y-4 pt-16 sm:pt-4">
      {/* Cabeçalho */}
      <Card className="shadow-sm bg-white border-l-4 border-l-[#1E3A8A]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/pacientes')}
                className="cursor-pointer border-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-[#16A34A] rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-[#1E293B] font-bold">{paciente.nome}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-[#64748B]">
                  <span>CPF: {paciente.cpf}</span>
                  <span className="text-[#CBD5E1]">|</span>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {paciente.telefone}
                  </div>
                  <span className="text-[#CBD5E1]">|</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Janela: {paciente.janelaEntrega}
                  </div>
                </div>
              </div>
            </div>
            <Badge
              className={`${receitaCfg.bg} ${receitaCfg.text} ${receitaCfg.border} border-2 text-sm px-3 py-1`}
            >
              {paciente.statusReceita === 'Ativa' ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              Receita {paciente.statusReceita}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <MapPin className="w-4 h-4" />
            <span>{paciente.endereco}</span>
          </div>
        </CardContent>
      </Card>

      {/* Linha de Cards (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status da Receita */}
        <Card className={`shadow-sm ${receitaCfg.border} border-2`}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className={`w-5 h-5 ${receitaCfg.text}`} />
              <CardTitle className="text-sm text-[#64748B]">Status da Receita</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge
              className={`${receitaCfg.bg} ${receitaCfg.text} ${receitaCfg.border} border text-base px-3 py-1`}
            >
              {paciente.statusReceita}
            </Badge>
            <p className="text-xs text-[#94A3B8] mt-2">
              Validade: {paciente.validadeReceita}
            </p>
          </CardContent>
        </Card>

        {/* Próxima Entrega */}
        <Card className="shadow-sm border-2 border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1E3A8A]" />
              <CardTitle className="text-sm text-[#64748B]">Próxima Entrega</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-[#1E3A8A] font-bold">{paciente.proximaEntrega}</p>
            <p className="text-xs text-[#64748B] mt-1">Status: {paciente.statusOrdemAtual}</p>
          </CardContent>
        </Card>

        {/* Índice de Adesão */}
        <Card className={`shadow-sm ${adesaoCfg.border} border-2`}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className={`w-5 h-5 ${adesaoCfg.text}`} />
              <CardTitle className="text-sm text-[#64748B]">Índice de Adesão</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl ${adesaoCfg.text} font-bold`}>
              {paciente.indiceAdesao?.toFixed(1) || '0.0'}%
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              {paciente.totalRecebidoAno} entregas recebidas em 2026
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investimento Total */}
      <Card className="shadow-md border-l-4 border-l-[#16A34A] bg-gradient-to-br from-white to-green-50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#16A34A]" />
            <CardTitle className="text-base text-[#1E293B]">
              Investimento Total em Saúde
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl text-[#16A34A] font-bold">
            R${' '}
            {investimentoTotal.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-[#64748B] mt-2">
            Nos últimos 12 meses ({paciente.historicoDispensacoes?.length || 0} dispensações)
          </p>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-[#16A34A]">
              <strong>Atenção Farmacêutica:</strong> Paciente em tratamento de alto
              acompanhamento
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Linha do Tempo de Entregas */}
      <Card className="shadow-sm border-l-4 border-l-[#16A34A]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#16A34A]" />
              Linha do Tempo de Entregas
            </CardTitle>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              {paciente.historicoDispensacoes?.length || 0} dispensações registradas
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Rastreabilidade completa: Dispense ID → Batch ID → Serial Numbers
          </p>
        </CardHeader>
        <CardContent>
          {!paciente.historicoDispensacoes || paciente.historicoDispensacoes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-[#94A3B8]">Nenhuma entrega registrada</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#16A34A] via-[#1E3A8A] to-[#CBD5E1]" />
              <div className="space-y-6">
                {paciente.historicoDispensacoes.map((disp) => (
                  <div key={disp.id} className="relative pl-14">
                    <div className="absolute left-4 w-5 h-5 bg-[#16A34A] rounded-full border-4 border-white shadow-md" />
                    <div className="bg-white border-2 border-[#E2E8F0] rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-[#64748B]" />
                            <span className="text-sm text-[#64748B]">{disp.dataHora}</span>
                          </div>
                          <p className="text-sm text-[#1E293B] font-semibold">
                            {disp.medicamentos}
                          </p>
                          <p className="text-xs text-[#94A3B8] mt-1">
                            Motorista: {disp.motorista}
                          </p>
                        </div>
                        <Button
                          onClick={() => setComprovanteModal(disp)}
                          size="sm"
                          className="cursor-pointer bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
                        >
                          <Camera className="w-3 h-3 mr-1" />
                          Ver Comprovante
                        </Button>
                      </div>

                      {/* Rastreabilidade */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-[#1E3A8A]" />
                          <span className="text-xs text-[#64748B]">Dispense ID:</span>
                          <span className="text-xs text-[#1E3A8A] font-mono font-semibold">
                            {disp.dispenseId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-[#1E3A8A]" />
                          <span className="text-xs text-[#64748B]">Batch ID:</span>
                          <span className="text-xs text-[#1E3A8A] font-mono font-semibold">
                            {disp.batchId}
                          </span>
                        </div>
                      </div>

                      {/* Serial Numbers */}
                      <div className="mt-2">
                        <p className="text-xs text-[#64748B] mb-1">Serial Numbers:</p>
                        <div className="flex flex-wrap gap-1">
                          {disp.serialNumbers.map((sn: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1 bg-green-50 border border-green-200 rounded px-2 py-0.5"
                            >
                              <Fingerprint className="w-3 h-3 text-green-700" />
                              <span className="text-xs text-green-700 font-mono font-semibold">
                                {sn}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Custo */}
                      {disp.custoTotal && (
                        <div className="mt-3 pt-3 border-t border-[#F1F5F9] bg-amber-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-[#92400E] font-semibold mb-1">
                                Custo da Dispensação:
                              </p>
                              {disp.itensDetalhados && disp.itensDetalhados.length > 0 && (
                                <div className="space-y-0.5">
                                  {disp.itensDetalhados.map((item: any, idx: number) => (
                                    <div key={idx} className="text-xs text-[#78350F]">
                                      • {item.medicamento} ({item.quantidade}x) — R${' '}
                                      {item.valorTotal.toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-[#92400E]">Total</p>
                              <p className="text-lg text-[#92400E] font-bold">
                                R${' '}
                                {disp.custoTotal.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-amber-200">
                            <p className="text-xs text-[#78350F]">
                              <DollarSign className="w-3 h-3 inline mr-1" />
                              <strong>Valor unitário</strong> baseado no Batch ID no momento da
                              compra
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recalls Impactados */}
      {paciente.recallsImpactados && paciente.recallsImpactados.length > 0 && (
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Histórico de Recalls Impactados
            </CardTitle>
            <p className="text-xs text-[#64748B] mt-1">
              Lotes com alertas sanitários que foram recebidos por este paciente
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paciente.recallsImpactados.map((recall: any) => (
                <div
                  key={recall.id}
                  className="bg-red-50 border-2 border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-red-900 font-semibold">
                        {recall.medicamento}
                      </p>
                      <p className="text-xs text-red-700 mt-1">{recall.motivo}</p>
                    </div>
                    <Badge
                      className={
                        recall.gravidade === 'Alta'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : recall.gravidade === 'Média'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }
                    >
                      Gravidade: {recall.gravidade}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                    <div>
                      <p className="text-red-600">Batch ID:</p>
                      <p className="text-red-900 font-mono font-semibold">{recall.batchId}</p>
                    </div>
                    <div>
                      <p className="text-red-600">Serial Number:</p>
                      <p className="text-red-900 font-mono font-semibold">
                        {recall.serialNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-red-600">Data Recebimento:</p>
                      <p className="text-red-900">{recall.dataRecebimento}</p>
                    </div>
                    <div>
                      <p className="text-red-600">Data Alerta:</p>
                      <p className="text-red-900">{recall.dataAlerta}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-red-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs text-red-700 font-semibold">
                          {recall.statusAcao}
                        </span>
                      </div>
                      <span className="text-xs text-red-600">
                        Resolvido em: {recall.dataResolucao}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-900">
                  <strong>Importante:</strong> Todos os recalls foram devidamente tratados com
                  devolução do medicamento e substituição. O rastreamento por Serial Number
                  garantiu a localização precisa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Comprovante inline */}
      {comprovanteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setComprovanteModal(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-[#E2E8F0] p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg text-[#1E293B] font-semibold">
                  Comprovante de Entrega
                </h3>
                <p className="text-sm text-[#64748B]">
                  {comprovanteModal.dispenseId} — {comprovanteModal.dataHora}
                </p>
              </div>
              <Button
                onClick={() => setComprovanteModal(null)}
                variant="outline"
                size="sm"
                className="cursor-pointer"
              >
                Fechar
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#F8FAFC] rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Paciente:</p>
                    <p className="text-[#1E293B] font-semibold">{paciente.nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Motorista:</p>
                    <p className="text-[#1E293B] font-semibold">{comprovanteModal.motorista}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Batch ID:</p>
                    <p className="font-mono text-[#1E3A8A] font-semibold">
                      {comprovanteModal.batchId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Medicamentos:</p>
                    <p className="text-[#1E293B]">{comprovanteModal.medicamentos}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-[#64748B] mb-2">Serial Numbers Escaneados:</p>
                <div className="space-y-1">
                  {comprovanteModal.serialNumbers.map((sn: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-green-50 rounded px-3 py-2"
                    >
                      <Fingerprint className="w-4 h-4 text-[#16A34A]" />
                      <span className="font-mono text-sm text-[#16A34A] font-semibold">
                        {sn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-[#64748B] mb-2">Evidência Fotográfica:</p>
                <img
                  src={comprovanteModal.fotoUrl}
                  alt="Foto da entrega"
                  className="w-full rounded-lg border border-[#E2E8F0]"
                />
              </div>

              <div>
                <p className="text-sm text-[#64748B] mb-2">
                  Assinatura Digital (Lei 14.063/2020):
                </p>
                <div className="border-2 border-[#E2E8F0] rounded-lg p-4 bg-white">
                  <img
                    src={comprovanteModal.assinaturaUrl}
                    alt="Assinatura"
                    className="w-full h-24 object-contain"
                  />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-700" />
                  <p className="text-xs text-green-900">
                    <strong>Entrega Confirmada:</strong> Este comprovante possui validade jurídica
                    conforme Lei 14.063/2020 e pode ser usado para auditoria e prestação de contas.
                  </p>
                </div>
                <p className="text-xs text-[#64748B] mt-2 pt-2 border-t border-green-200">
                  Documento gerado pelo sistema <strong>Vigia Saúde</strong> — Rastreabilidade
                  Total
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
