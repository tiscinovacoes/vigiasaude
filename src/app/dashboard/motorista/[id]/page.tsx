'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Truck,
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  AlertCircle,
  CheckCircle,
  Target,
  Timer,
  RotateCcw,
  Award,
  Activity,
  Fingerprint,
  FileText,
  Thermometer,
  Camera,
  PenTool,
  AlertTriangle,
  MapPin,
  DollarSign,
  ShieldAlert,
  Navigation,
  User,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useState } from 'react';

// ============================================================================
// MOCK DATA — substitua com chamadas ao Supabase quando disponível
// ============================================================================
const motoristasData = [
  {
    id: 1,
    nome: 'Carlos Andrade Santos',
    motoristaCodigo: 'MOT-001',
    veiculo: 'Fiat Ducato',
    placa: 'ABC-1234',
    performance: {
      indiceEfetividade: 97.2,
      tempoMedioPorParada: 6,
      taxaDevolucao: 1.8,
      pontualidadeRota: 94.5,
      totalEntregasHistorico: 248,
      entregasSucessoPrimeiraTentativa: 241,
      totalDevolucoes: 7,
      rotasNoPrazo: 38,
      totalRotas: 40,
      tempoMedioRotaMin: 185,
      historicoMensal: [
        { mes: 'Out', efetividade: 95, pontualidade: 90, entregas: 38 },
        { mes: 'Nov', efetividade: 96, pontualidade: 92, entregas: 42 },
        { mes: 'Dez', efetividade: 94, pontualidade: 88, entregas: 35 },
        { mes: 'Jan', efetividade: 97, pontualidade: 95, entregas: 44 },
        { mes: 'Fev', efetividade: 98, pontualidade: 96, entregas: 47 },
        { mes: 'Mar', efetividade: 97, pontualidade: 94, entregas: 42 },
      ],
      motivosDevolucao: [
        { motivo: 'Paciente Ausente', qtd: 3, percentual: 42.9 },
        { motivo: 'Endereço Incorreto', qtd: 2, percentual: 28.6 },
        { motivo: 'Recusa do Paciente', qtd: 2, percentual: 28.6 },
      ],
      inventarioBordo: [
        {
          serialNumber: 'SN-A101-2026',
          batchId: 'LT-2024-INS001',
          medicamento: 'Insulina NPH 100UI/ml',
          quantidade: 5,
          destinatario: 'Ana Beatriz Lima',
          tempAtual: 4.2,
          status: 'Em trânsito',
        },
        {
          serialNumber: 'SN-B201-2026',
          batchId: 'LT-2024-MET015',
          medicamento: 'Metformina 850mg',
          quantidade: 60,
          destinatario: 'João Alves Sousa',
          tempAtual: 22.1,
          status: 'Em trânsito',
        },
        {
          serialNumber: 'SN-C301-2026',
          batchId: 'LT-2024-LOS008',
          medicamento: 'Losartana 50mg',
          quantidade: 30,
          destinatario: 'Maria Conceição Silva',
          tempAtual: 22.3,
          status: 'Em trânsito',
        },
      ],
      historicoComprovacoes: [
        {
          id: 1,
          paciente: 'Rosa Maria Ferreira',
          dataHora: '10/04/2026 09:15',
          medicamentos: 'Insulina NPH, Metformina 850mg',
          dispenseId: 'DISP-2026-0312',
          fotoUrl: 'https://via.placeholder.com/400x300?text=Foto+Entrega+1',
          assinaturaUrl: 'https://via.placeholder.com/200x80?text=Assinatura+Digital',
        },
        {
          id: 2,
          paciente: 'José Carlos Andrade',
          dataHora: '10/04/2026 10:42',
          medicamentos: 'Losartana 50mg, Enalapril 10mg',
          dispenseId: 'DISP-2026-0313',
          fotoUrl: 'https://via.placeholder.com/400x300?text=Foto+Entrega+2',
          assinaturaUrl: 'https://via.placeholder.com/200x80?text=Assinatura+Digital',
        },
      ],
      alertasAnomalia: [
        {
          id: 1,
          tipo: 'Desvio de Rota',
          gravidade: 'Alta',
          dataHora: '08/04/2026 14:32',
          descricao: 'Veículo desviou 1,8km da rota programada sem justificativa prévia.',
          localizacao: 'Av. Brasil, 1500 - Campo Grande/MS',
          medicamentosEmRisco: 'Insulina NPH 100UI/ml (Cx 5un)',
          valorEmRisco: 229.0,
          status: 'Em Análise',
          justificativa: null,
        },
        {
          id: 2,
          tipo: 'Parada Excessiva',
          gravidade: 'Baixa',
          dataHora: '05/04/2026 12:15',
          descricao: 'Veículo parado por 38 minutos em ponto não previsto na rota.',
          localizacao: 'Rua Antônio Trajano, 200 - Campo Grande/MS',
          medicamentosEmRisco: 'Nenhum medicamento termossensível',
          valorEmRisco: 0,
          status: 'Justificado',
          justificativa: 'Parada para almoço conforme permitido no contrato.',
        },
      ],
    },
  },
  {
    id: 2,
    nome: 'Marcos Vinicius Pereira',
    motoristaCodigo: 'MOT-002',
    veiculo: 'Renault Master',
    placa: 'XYZ-5678',
    performance: {
      indiceEfetividade: 88.5,
      tempoMedioPorParada: 9,
      taxaDevolucao: 4.2,
      pontualidadeRota: 82.0,
      totalEntregasHistorico: 156,
      entregasSucessoPrimeiraTentativa: 138,
      totalDevolucoes: 18,
      rotasNoPrazo: 33,
      totalRotas: 40,
      tempoMedioRotaMin: 220,
      historicoMensal: [
        { mes: 'Out', efetividade: 85, pontualidade: 78, entregas: 22 },
        { mes: 'Nov', efetividade: 87, pontualidade: 80, entregas: 28 },
        { mes: 'Dez', efetividade: 86, pontualidade: 82, entregas: 25 },
        { mes: 'Jan', efetividade: 89, pontualidade: 84, entregas: 30 },
        { mes: 'Fev', efetividade: 90, pontualidade: 83, entregas: 28 },
        { mes: 'Mar', efetividade: 88, pontualidade: 82, entregas: 23 },
      ],
      motivosDevolucao: [
        { motivo: 'Paciente Ausente', qtd: 8, percentual: 44.4 },
        { motivo: 'Endereço Incorreto', qtd: 5, percentual: 27.8 },
        { motivo: 'Recusa do Paciente', qtd: 3, percentual: 16.7 },
        { motivo: 'Outros', qtd: 2, percentual: 11.1 },
      ],
      inventarioBordo: [],
      historicoComprovacoes: [],
      alertasAnomalia: [],
    },
  },
];

// ============================================================================
// PAGE COMPONENT
// ============================================================================
export default function MotoristaDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [periodoFiltro, setPeriodoFiltro] = useState<'dia' | 'semana' | 'mes'>('mes');

  const motorista = motoristasData.find((m) => m.id === Number(params.id));

  if (!motorista || !motorista.performance) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <p className="text-[#64748B]">Motorista não encontrado</p>
          <Button
            onClick={() => router.push('/dashboard/monitoramento')}
            className="mt-4 cursor-pointer"
          >
            Voltar ao Monitoramento
          </Button>
        </div>
      </div>
    );
  }

  const { performance } = motorista;

  const COLORS = {
    green: '#16A34A',
    blue: '#1E3A8A',
    amber: '#F59E0B',
    red: '#DC2626',
  };

  const getKpiColor = (value: number, thresholds: { excellent: number; good: number }) => {
    if (value >= thresholds.excellent) return 'green';
    if (value >= thresholds.good) return 'amber';
    return 'red';
  };

  const efetividadeColor = getKpiColor(performance.indiceEfetividade, { excellent: 95, good: 90 });
  const pontualidadeColor = getKpiColor(performance.pontualidadeRota, { excellent: 90, good: 80 });
  const devolucaoColor =
    performance.taxaDevolucao < 2 ? 'green' : performance.taxaDevolucao < 5 ? 'amber' : 'red';

  const colorBorder = (c: string) =>
    c === 'green' ? 'border-l-[#16A34A]' : c === 'amber' ? 'border-l-[#F59E0B]' : 'border-l-[#DC2626]';
  const colorBg = (c: string) =>
    c === 'green' ? 'bg-green-100' : c === 'amber' ? 'bg-amber-100' : 'bg-red-100';
  const colorText = (c: string) =>
    c === 'green' ? 'text-[#16A34A]' : c === 'amber' ? 'text-[#F59E0B]' : 'text-[#DC2626]';

  return (
    <div className="space-y-4 pt-16 sm:pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/monitoramento')}
              className="cursor-pointer border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-[#1E293B] font-bold text-2xl">Dashboard de Performance</h1>
              <div className="flex items-center gap-2 mt-1">
                <Truck className="w-4 h-4 text-[#1E3A8A]" />
                <p className="text-[#64748B]">
                  <strong className="text-[#1E293B]">{motorista.nome}</strong> —{' '}
                  {motorista.motoristaCodigo}
                </p>
                <span className="text-[#CBD5E1]">|</span>
                <p className="text-[#64748B]">
                  {motorista.veiculo} - {motorista.placa}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            {performance.totalEntregasHistorico} entregas realizadas
          </Badge>
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Período: Últimos 6 meses
          </Badge>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Índice de Efetividade */}
        <Card className={`shadow-sm border-l-4 ${colorBorder(efetividadeColor)}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorBg(efetividadeColor)}`}>
                <Target className={`w-5 h-5 ${colorText(efetividadeColor)}`} />
              </div>
              {efetividadeColor === 'green' ? (
                <TrendingUp className="w-5 h-5 text-[#16A34A]" />
              ) : (
                <TrendingDown className="w-5 h-5 text-[#DC2626]" />
              )}
            </div>
            <p className="text-xs text-[#64748B] mb-1">Índice de Efetividade</p>
            <p className={`text-2xl font-bold ${colorText(efetividadeColor)}`}>
              {performance.indiceEfetividade}%
            </p>
            <p className="text-xs text-[#94A3B8] mt-2">
              {performance.entregasSucessoPrimeiraTentativa} de {performance.totalEntregasHistorico} na 1ª tentativa
            </p>
          </CardContent>
        </Card>

        {/* Tempo Médio por Parada */}
        <Card className="shadow-sm border-l-4 border-l-[#1E3A8A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Timer className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <Clock className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <p className="text-xs text-[#64748B] mb-1">Tempo Médio por Parada</p>
            <p className="text-2xl text-[#1E3A8A] font-bold">{performance.tempoMedioPorParada} min</p>
            <p className="text-xs text-[#94A3B8] mt-2">
              Tempo de rota: {performance.tempoMedioRotaMin} min
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Devolução */}
        <Card className={`shadow-sm border-l-4 ${colorBorder(devolucaoColor)}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorBg(devolucaoColor)}`}>
                <RotateCcw className={`w-5 h-5 ${colorText(devolucaoColor)}`} />
              </div>
              {devolucaoColor === 'green' ? (
                <TrendingDown className="w-5 h-5 text-[#16A34A]" />
              ) : (
                <TrendingUp className="w-5 h-5 text-[#DC2626]" />
              )}
            </div>
            <p className="text-xs text-[#64748B] mb-1">Taxa de Devolução</p>
            <p className={`text-2xl font-bold ${colorText(devolucaoColor)}`}>
              {performance.taxaDevolucao}%
            </p>
            <p className="text-xs text-[#94A3B8] mt-2">
              {performance.totalDevolucoes} devoluções no período
            </p>
          </CardContent>
        </Card>

        {/* Pontualidade da Rota */}
        <Card className={`shadow-sm border-l-4 ${colorBorder(pontualidadeColor)}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorBg(pontualidadeColor)}`}>
                <CheckCircle className={`w-5 h-5 ${colorText(pontualidadeColor)}`} />
              </div>
              <Award className={`w-5 h-5 ${colorText(pontualidadeColor)}`} />
            </div>
            <p className="text-xs text-[#64748B] mb-1">Pontualidade da Rota</p>
            <p className={`text-2xl font-bold ${colorText(pontualidadeColor)}`}>
              {performance.pontualidadeRota}%
            </p>
            <p className="text-xs text-[#94A3B8] mt-2">
              {performance.rotasNoPrazo} de {performance.totalRotas} rotas no prazo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Histórico Mensal */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#1E3A8A]" />
              Histórico de Performance
            </CardTitle>
            <p className="text-xs text-[#64748B]">
              Evolução da efetividade e pontualidade nos últimos 6 meses
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performance.historicoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mes" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="efetividade"
                  stroke={COLORS.green}
                  strokeWidth={2}
                  dot={{ fill: COLORS.green, r: 4 }}
                  name="Efetividade (%)"
                />
                <Line
                  type="monotone"
                  dataKey="pontualidade"
                  stroke={COLORS.blue}
                  strokeWidth={2}
                  dot={{ fill: COLORS.blue, r: 4 }}
                  name="Pontualidade (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume de Entregas Mensal */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1E3A8A]" />
              Volume de Entregas Mensal
            </CardTitle>
            <p className="text-xs text-[#64748B]">Quantidade de entregas realizadas por mês</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance.historicoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mes" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="entregas" fill={COLORS.blue} radius={[4, 4, 0, 0]} name="Entregas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Motivos de Devolução + Resumo Estatístico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              Análise de Devoluções
            </CardTitle>
            <p className="text-xs text-[#64748B]">
              Principais motivos de medicamentos não entregues
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.motivosDevolucao.map((motivo, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#1E293B]">{motivo.motivo}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748B]">{motivo.qtd} ocorrências</span>
                      <span className="text-[#1E3A8A] font-semibold">
                        {motivo.percentual.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-[#DC2626]' : idx === 1 ? 'bg-[#F59E0B]' : 'bg-[#64748B]'
                      }`}
                      style={{ width: `${motivo.percentual}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumo Estatístico */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#1E3A8A]" />
              Resumo Estatístico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 mb-1">Entregas com Sucesso</p>
              <p className="text-2xl text-green-700 font-bold">
                {performance.entregasSucessoPrimeiraTentativa}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 mb-1">Total de Rotas</p>
              <p className="text-2xl text-blue-700 font-bold">{performance.totalRotas}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 mb-1">Tempo Médio de Rota</p>
              <p className="text-2xl text-amber-700 font-bold">{performance.tempoMedioRotaMin} min</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Qualidade do Serviço */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Indicadores de Qualidade do Serviço</CardTitle>
          <p className="text-xs text-[#64748B]">Métricas comparativas com a média da equipe</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Efetividade',
                color: efetividadeColor,
                meta: '≥ 95%',
                atual: `${performance.indiceEfetividade}%`,
              },
              {
                label: 'Pontualidade',
                color: pontualidadeColor,
                meta: '≥ 90%',
                atual: `${performance.pontualidadeRota}%`,
              },
              {
                label: 'Taxa de Devolução',
                color: devolucaoColor,
                meta: '≤ 2%',
                atual: `${performance.taxaDevolucao}%`,
              },
              {
                label: 'Tempo/Parada',
                color: performance.tempoMedioPorParada < 8 ? 'green' : 'amber',
                meta: '≤ 10 min',
                atual: `${performance.tempoMedioPorParada} min`,
              },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">{item.label}</span>
                  <Badge
                    className={
                      item.color === 'green'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : item.color === 'amber'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }
                  >
                    {item.color === 'green' ? 'Excelente' : item.color === 'amber' ? 'Bom' : 'Atenção'}
                  </Badge>
                </div>
                <div className="text-xs text-[#94A3B8]">
                  Meta: {item.meta} | Atual: {item.atual}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inventário de Bordo */}
      {performance.inventarioBordo && performance.inventarioBordo.length > 0 && (
        <Card className="shadow-sm border-l-4 border-l-[#1E3A8A]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#1E293B] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#1E3A8A]" />
                  Inventário de Bordo
                </CardTitle>
                <p className="text-xs text-[#64748B] mt-1">
                  Medicamentos sob responsabilidade atual do motorista
                </p>
              </div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                {performance.inventarioBordo.length} itens
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-semibold">
                      Serial Number
                    </th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-semibold">
                      Batch ID
                    </th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-semibold">
                      Medicamento
                    </th>
                    <th className="text-center py-3 px-2 text-xs text-[#64748B] font-semibold">
                      Qtd
                    </th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-semibold">
                      Destinatário
                    </th>
                    <th className="text-center py-3 px-2 text-xs text-[#64748B] font-semibold">
                      Temp.
                    </th>
                    <th className="text-center py-3 px-2 text-xs text-[#64748B] font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {performance.inventarioBordo.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <Fingerprint className="w-3 h-3 text-[#1E3A8A]" />
                          <span className="font-mono text-xs text-[#1E3A8A] font-semibold">
                            {item.serialNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-[#1E3A8A]" />
                          <span className="font-mono text-xs text-[#1E3A8A]">{item.batchId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs text-[#1E293B] font-medium">
                          {item.medicamento}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-xs text-[#64748B]">{item.quantidade}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs text-[#64748B]">{item.destinatario}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Thermometer className="w-3 h-3 text-[#94A3B8]" />
                          <span
                            className={`text-xs font-semibold ${
                              item.tempAtual > 5
                                ? 'text-red-600'
                                : item.tempAtual < 2
                                ? 'text-amber-600'
                                : 'text-[#16A34A]'
                            }`}
                          >
                            {item.tempAtual}°C
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge
                          className={`text-xs ${
                            item.status === 'Em trânsito'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <p className="text-xs text-amber-900">
                  <strong>Responsabilidade Legal:</strong> Todos os itens listados estão sob
                  custódia do motorista {motorista.motoristaCodigo}. Qualquer extravio deve ser
                  reportado imediatamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Comprovações */}
      {performance.historicoComprovacoes && performance.historicoComprovacoes.length > 0 && (
        <Card className="shadow-sm border-l-4 border-l-[#16A34A]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#1E293B] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#16A34A]" />
                  Histórico de Comprovações
                </CardTitle>
                <p className="text-xs text-[#64748B] mt-1">
                  Fotos e assinaturas coletadas em entregas finalizadas
                </p>
              </div>
              <Badge className="bg-green-50 text-green-700 border-green-200">
                {performance.historicoComprovacoes.length} comprovantes
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performance.historicoComprovacoes.map((comprovante) => (
                <div
                  key={comprovante.id}
                  className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden"
                >
                  <div className="relative h-48 bg-[#F8FAFC]">
                    <img
                      src={comprovante.fotoUrl}
                      alt={`Entrega para ${comprovante.paciente}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white border-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Entregue
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="text-sm text-[#1E293B] font-semibold">{comprovante.paciente}</p>
                      <p className="text-xs text-[#64748B]">{comprovante.dataHora}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded p-2">
                      <div className="flex items-center gap-1 text-xs text-[#64748B] mb-1">
                        <Package className="w-3 h-3" />
                        <span>{comprovante.medicamentos}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <FileText className="w-3 h-3 text-[#1E3A8A]" />
                        <span className="text-[#64748B]">Dispense ID:</span>
                        <span className="font-mono text-[#1E3A8A] font-semibold">
                          {comprovante.dispenseId}
                        </span>
                      </div>
                    </div>
                    <div className="border border-[#E2E8F0] rounded p-2">
                      <div className="flex items-center gap-1 text-xs text-[#64748B] mb-1">
                        <PenTool className="w-3 h-3" />
                        <span>Assinatura Digital:</span>
                      </div>
                      <img
                        src={comprovante.assinaturaUrl}
                        alt="Assinatura"
                        className="w-full h-12 object-contain bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas de Anomalia */}
      {performance.alertasAnomalia && performance.alertasAnomalia.length > 0 && (
        <Card className="shadow-sm border-l-4 border-l-[#DC2626]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#1E293B] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                  Alertas de Anomalia
                </CardTitle>
                <p className="text-xs text-[#64748B] mt-1">
                  Registro de desvios de rota, paradas excessivas e outras anomalias
                </p>
              </div>
              <Badge className="bg-red-50 text-red-700 border-red-200">
                {performance.alertasAnomalia.length} alertas
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.alertasAnomalia.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`border-2 rounded-lg p-4 ${
                    alerta.gravidade === 'Alta'
                      ? 'border-red-300 bg-red-50'
                      : alerta.gravidade === 'Média'
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {alerta.tipo === 'Desvio de Rota' ? (
                        <Navigation
                          className={`w-5 h-5 ${
                            alerta.gravidade === 'Alta' ? 'text-red-700' : 'text-amber-700'
                          }`}
                        />
                      ) : (
                        <Clock
                          className={`w-5 h-5 ${
                            alerta.gravidade === 'Alta' ? 'text-red-700' : 'text-blue-700'
                          }`}
                        />
                      )}
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            alerta.gravidade === 'Alta'
                              ? 'text-red-900'
                              : alerta.gravidade === 'Média'
                              ? 'text-amber-900'
                              : 'text-blue-900'
                          }`}
                        >
                          {alerta.tipo}
                        </p>
                        <p className="text-xs text-[#64748B]">{alerta.dataHora}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          alerta.gravidade === 'Alta'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : alerta.gravidade === 'Média'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }
                      >
                        {alerta.gravidade}
                      </Badge>
                      <Badge
                        className={
                          alerta.status === 'Justificado'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : alerta.status === 'Resolvido'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }
                      >
                        {alerta.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-[#1E293B]">{alerta.descricao}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-[#64748B]">
                        <MapPin className="w-3 h-3" />
                        <span>{alerta.localizacao}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#64748B]">
                        <Package className="w-3 h-3" />
                        <span>{alerta.medicamentosEmRisco}</span>
                      </div>
                    </div>
                    {alerta.valorEmRisco > 0 && (
                      <div className="flex items-center gap-1 bg-white/60 rounded px-2 py-1">
                        <DollarSign className="w-4 h-4 text-red-700" />
                        <span className="text-xs text-[#64748B]">Valor em risco:</span>
                        <span className="text-sm text-red-700 font-bold">
                          R$ {alerta.valorEmRisco.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {alerta.justificativa && (
                      <div className="bg-white border border-[#E2E8F0] rounded p-2 mt-2">
                        <p className="text-xs text-[#64748B] mb-1">
                          <strong>Justificativa do motorista:</strong>
                        </p>
                        <p className="text-xs text-[#1E293B] italic">
                          &ldquo;{alerta.justificativa}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-700" />
                <p className="text-xs text-blue-900">
                  <strong>Protocolo de Segurança:</strong> Todos os alertas são monitorados em
                  tempo real. Desvios injustificados podem resultar em ações disciplinares.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
