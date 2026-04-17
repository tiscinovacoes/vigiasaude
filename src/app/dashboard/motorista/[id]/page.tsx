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
  ShieldAlert,
  User,
  Phone,
  Mail,
  Minus,
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
import { useState, useEffect } from 'react';
import { api, Motorista } from '@/lib/api';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// TIPOS LOCAIS
// ============================================================================
type EntregaMot = {
  id: string;
  status_entrega: string;
  created_at: string;
  foto_comprovante_url: string | null;
  assinatura_digital_url: string | null;
  paciente_nome: string;
  itens: { id: string; medicamento_nome: string; serial_number: string; lote_codigo: string }[];
};

type MesStats = {
  mes: string;
  efetividade: number;
  pontualidade: number;
  entregas: number;
};

// ============================================================================
// HELPERS
// ============================================================================

/** Calcula histórico mensal (últimos 6 meses) a partir do array de entregas */
function calcHistoricoMensal(entregas: EntregaMot[]): MesStats[] {
  const hoje = new Date();
  const meses: MesStats[] = [];

  for (let i = 5; i >= 0; i--) {
    const refDate = subMonths(hoje, i);
    const inicio = startOfMonth(refDate);
    const fim = endOfMonth(refDate);
    const label = format(refDate, 'MMM', { locale: ptBR });
    const capitalizado = label.charAt(0).toUpperCase() + label.slice(1);

    const noMes = entregas.filter((e) => {
      const d = parseISO(e.created_at);
      return d >= inicio && d <= fim;
    });

    const entregues = noMes.filter((e) => e.status_entrega === 'ENTREGUE').length;
    const total = noMes.length;
    const efetividade = total > 0 ? Math.round((entregues / total) * 100) : 0;

    meses.push({
      mes: capitalizado,
      efetividade,
      pontualidade: efetividade, // sem dado separado de pontualidade por mês
      entregas: total,
    });
  }
  return meses;
}

function statusBadgeClass(status: string) {
  if (status === 'EM_ROTA') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status === 'INATIVO') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-green-100 text-green-700 border-green-200';
}

function statusLabel(status: string) {
  if (status === 'EM_ROTA') return '🚛 Em Rota';
  if (status === 'INATIVO') return '⛔ Inativo';
  return '✅ Ativo';
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================
// ============================================================================
// MOTORISTA PROFILE DASHBOARD — Módulo 7 (v2)
// Dados reais do Supabase, KPIs calculados, gráficos, comprovações, alertas
// ============================================================================
export default function MotoristaDashboardPage() {
  const router = useRouter();
  const params = useParams();

  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [entregas, setEntregas] = useState<EntregaMot[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'comprovacoes' | 'alertas'>('comprovacoes');

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;

    async function loadData() {
      setLoading(true);
      try {
        const [mot, entList] = await Promise.all([
          api.getMotoristasById(id),
          api.getEntregasByMotorista(id),
        ]);
        setMotorista(mot);
        setEntregas(entList);
      } catch (err) {
        console.error('Erro ao carregar motorista:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params?.id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#64748B] text-sm">Carregando perfil do motorista...</p>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!motorista) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-[#94A3B8] mx-auto" />
          <p className="text-[#64748B]">Motorista não encontrado</p>
          <Button onClick={() => router.push('/dashboard/entregas')} className="cursor-pointer">
            Voltar às Entregas
          </Button>
        </div>
      </div>
    );
  }

  // ── Métricas calculadas ───────────────────────────────────────────────────
  const totalEntregas = motorista.total_entregas || 0;
  const entregasSucesso = motorista.entregas_sucesso || 0;
  const totalDevolucoes = motorista.total_devolucoes || 0;

  const indiceEfetividade =
    totalEntregas > 0
      ? parseFloat(((entregasSucesso / totalEntregas) * 100).toFixed(1))
      : motorista.pontualidade_percentual ?? 0;

  const taxaDevolucao =
    totalEntregas > 0
      ? parseFloat(((totalDevolucoes / totalEntregas) * 100).toFixed(1))
      : 0;

  const pontualidade = motorista.pontualidade_percentual ?? 0;
  const tempoMedioRota = motorista.tempo_medio_rota_min ?? 0;

  // Inventário de bordo = entregas EM_ROTA
  const inventarioBordo = entregas.filter((e) => e.status_entrega === 'EM_ROTA');

  // Comprovações = entregas com foto ou assinatura
  const comprovacoes = entregas.filter(
    (e) => e.foto_comprovante_url || e.assinatura_digital_url
  );

  // Histórico mensal
  const historicoMensal = calcHistoricoMensal(entregas);

  // Motivos de devolução (FALHA = não entregue)
  const entregasFalha = entregas.filter((e) => e.status_entrega === 'FALHA');

  // Cores KPI
  const COLORS = { green: '#16A34A', blue: '#1E3A8A', amber: '#F59E0B', red: '#DC2626' };

  const getKpiColor = (value: number, thresholds: { excellent: number; good: number }) => {
    if (value >= thresholds.excellent) return 'green';
    if (value >= thresholds.good) return 'amber';
    return 'red';
  };

  const efetividadeColor = getKpiColor(indiceEfetividade, { excellent: 95, good: 90 });
  const pontualidadeColor = getKpiColor(pontualidade, { excellent: 90, good: 80 });
  const devolucaoColor = taxaDevolucao < 2 ? 'green' : taxaDevolucao < 5 ? 'amber' : 'red';

  const colorBorder = (c: string) =>
    c === 'green' ? 'border-l-[#16A34A]' : c === 'amber' ? 'border-l-[#F59E0B]' : 'border-l-[#DC2626]';
  const colorBg = (c: string) =>
    c === 'green' ? 'bg-green-100' : c === 'amber' ? 'bg-amber-100' : 'bg-red-100';
  const colorText = (c: string) =>
    c === 'green' ? 'text-[#16A34A]' : c === 'amber' ? 'text-[#F59E0B]' : 'text-[#DC2626]';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pt-16 sm:pt-4">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/entregas')}
              className="cursor-pointer border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-10 h-10 bg-[#1E3A8A] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-[#1E293B] font-bold text-2xl leading-tight">{motorista.nome}</h1>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <div className="flex items-center gap-1 text-[#64748B] text-sm">
                      <Truck className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span>{motorista.placa_veiculo}</span>
                    </div>
                    <span className="text-[#CBD5E1]">·</span>
                    <div className="flex items-center gap-1 text-[#64748B] text-sm">
                      <FileText className="w-3.5 h-3.5" />
                      <span>CNH {motorista.cnh}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:mt-1">
          <Badge className={statusBadgeClass(motorista.status_atividade)}>
            {statusLabel(motorista.status_atividade)}
          </Badge>
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            {totalEntregas} entregas realizadas
          </Badge>
          {motorista.telefone && (
            <Badge className="bg-slate-50 text-slate-600 border-slate-200 gap-1">
              <Phone className="w-3 h-3" />{motorista.telefone}
            </Badge>
          )}
          {motorista.email && (
            <Badge className="bg-slate-50 text-slate-600 border-slate-200 gap-1">
              <Mail className="w-3 h-3" />{motorista.email}
            </Badge>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Índice de Efetividade */}
        <Card className={`shadow-sm border-l-4 ${colorBorder(efetividadeColor)}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorBg(efetividadeColor)}`}>
                <Target className={`w-5 h-5 ${colorText(efetividadeColor)}`} />
              </div>
              {efetividadeColor === 'green'
                ? <TrendingUp className="w-5 h-5 text-[#16A34A]" />
                : <TrendingDown className="w-5 h-5 text-[#DC2626]" />}
            </div>
            <p className="text-xs text-[#64748B] mb-1">Índice de Efetividade</p>
            <p className={`text-2xl font-bold ${colorText(efetividadeColor)}`}>{indiceEfetividade}%</p>
            <p className="text-xs text-[#94A3B8] mt-2">
              {entregasSucesso} de {totalEntregas} na 1ª tentativa
            </p>
          </CardContent>
        </Card>

        {/* Tempo Médio de Rota */}
        <Card className="shadow-sm border-l-4 border-l-[#1E3A8A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Timer className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <Clock className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <p className="text-xs text-[#64748B] mb-1">Tempo Médio de Rota</p>
            <p className="text-2xl text-[#1E3A8A] font-bold">{tempoMedioRota} min</p>
            <p className="text-xs text-[#94A3B8] mt-2">Média histórica acumulada</p>
          </CardContent>
        </Card>

        {/* Taxa de Devolução */}
        <Card className={`shadow-sm border-l-4 ${colorBorder(devolucaoColor)}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorBg(devolucaoColor)}`}>
                <RotateCcw className={`w-5 h-5 ${colorText(devolucaoColor)}`} />
              </div>
              {devolucaoColor === 'green'
                ? <TrendingDown className="w-5 h-5 text-[#16A34A]" />
                : <TrendingUp className="w-5 h-5 text-[#DC2626]" />}
            </div>
            <p className="text-xs text-[#64748B] mb-1">Taxa de Devolução</p>
            <p className={`text-2xl font-bold ${colorText(devolucaoColor)}`}>{taxaDevolucao}%</p>
            <p className="text-xs text-[#94A3B8] mt-2">{totalDevolucoes} devoluções registradas</p>
          </CardContent>
        </Card>

        {/* Pontualidade */}
        <Card className={`shadow-sm border-l-4 ${colorBorder(pontualidadeColor)}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorBg(pontualidadeColor)}`}>
                <CheckCircle className={`w-5 h-5 ${colorText(pontualidadeColor)}`} />
              </div>
              <Award className={`w-5 h-5 ${colorText(pontualidadeColor)}`} />
            </div>
            <p className="text-xs text-[#64748B] mb-1">Pontualidade</p>
            <p className={`text-2xl font-bold ${colorText(pontualidadeColor)}`}>{pontualidade}%</p>
            <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${pontualidade >= 90 ? 'bg-green-500' : pontualidade >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(pontualidade, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Histórico Mensal — LineChart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#1E3A8A]" />
              Histórico de Performance
            </CardTitle>
            <p className="text-xs text-[#64748B]">Evolução da efetividade e pontualidade — últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            {entregas.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-[#94A3B8] text-sm">
                Nenhum dado disponível ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="efetividade" stroke={COLORS.green} strokeWidth={2} dot={{ fill: COLORS.green, r: 4 }} name="Efetividade (%)" />
                  <Line type="monotone" dataKey="pontualidade" stroke={COLORS.blue} strokeWidth={2} dot={{ fill: COLORS.blue, r: 4 }} name="Pontualidade (%)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Volume Mensal — BarChart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1E3A8A]" />
              Volume de Entregas Mensal
            </CardTitle>
            <p className="text-xs text-[#64748B]">Quantidade de entregas realizadas por mês</p>
          </CardHeader>
          <CardContent>
            {entregas.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-[#94A3B8] text-sm">
                Nenhuma entrega registrada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={historicoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="entregas" fill={COLORS.blue} radius={[4, 4, 0, 0]} name="Entregas" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Análise de Devoluções + Resumo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              Análise de Não-Entregas
            </CardTitle>
            <p className="text-xs text-[#64748B]">Registros de falha na última janela</p>
          </CardHeader>
          <CardContent>
            {entregasFalha.length === 0 ? (
              <div className="flex items-center justify-center py-8 gap-2 text-[#94A3B8]">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm">Nenhuma falha de entrega registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entregasFalha.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{e.paciente_nome}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {format(parseISO(e.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">Falha</Badge>
                  </div>
                ))}
              </div>
            )}
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
              <p className="text-2xl text-green-700 font-bold">{entregasSucesso}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 mb-1">Total de Entregas</p>
              <p className="text-2xl text-blue-700 font-bold">{totalEntregas}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 mb-1">Tempo Médio de Rota</p>
              <p className="text-2xl text-amber-700 font-bold">{tempoMedioRota} min</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Indicadores de Qualidade ── */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1E293B]">Indicadores de Qualidade do Serviço</CardTitle>
          <p className="text-xs text-[#64748B]">Comparativo com as metas da equipe</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Efetividade', color: efetividadeColor, meta: '≥ 95%', atual: `${indiceEfetividade}%` },
              { label: 'Pontualidade', color: pontualidadeColor, meta: '≥ 90%', atual: `${pontualidade}%` },
              { label: 'Taxa de Devolução', color: devolucaoColor, meta: '≤ 2%', atual: `${taxaDevolucao}%` },
              {
                label: 'Tempo de Rota',
                color: tempoMedioRota < 180 || tempoMedioRota === 0 ? 'green' : tempoMedioRota < 240 ? 'amber' : 'red',
                meta: '≤ 180 min',
                atual: tempoMedioRota > 0 ? `${tempoMedioRota} min` : 'N/A',
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
                <div className="text-xs text-[#94A3B8]">Meta: {item.meta} | Atual: {item.atual}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Inventário de Bordo ── */}
      {inventarioBordo.length > 0 && (
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
                {inventarioBordo.reduce((acc, e) => acc + e.itens.length, 0)} itens
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-semibold">Serial Number</th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-semibold">Batch ID</th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-semibold">Medicamento</th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-semibold">Destinatário</th>
                    <th className="text-center py-3 px-2 text-xs text-[#64748B] font-semibold">Temp.</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioBordo.flatMap((e) =>
                    e.itens.map((item, idx) => (
                      <tr key={`${e.id}-${idx}`} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <Fingerprint className="w-3 h-3 text-[#1E3A8A]" />
                            <span className="font-mono text-xs text-[#1E3A8A] font-semibold">{item.serial_number}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-[#1E3A8A]" />
                            <span className="font-mono text-xs text-[#1E3A8A]">{item.lote_codigo}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs text-[#1E293B] font-medium">{item.medicamento_nome}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs text-[#64748B]">{e.paciente_nome}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Thermometer className="w-3 h-3 text-[#94A3B8]" />
                            <span className="text-xs text-[#94A3B8]">—°C</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <p className="text-xs text-amber-900">
                  <strong>Responsabilidade Legal:</strong> Todos os itens listados estão sob custódia do motorista{' '}
                  <strong>{motorista.nome}</strong>. Qualquer extravio deve ser reportado imediatamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs: Comprovações | Alertas ── */}
      <Card className="shadow-sm">
        <CardHeader>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 -mb-4">
            {[
              { key: 'comprovacoes', label: `Comprovações (${comprovacoes.length})`, icon: Camera },
              { key: 'alertas', label: 'Alertas de Anomalia', icon: AlertTriangle },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setAbaAtiva(key as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  abaAtiva === key
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Aba Comprovações */}
          {abaAtiva === 'comprovacoes' && (
            <>
              {comprovacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#94A3B8]">
                  <Camera className="w-10 h-10" />
                  <p className="text-sm">Nenhuma comprovação registrada</p>
                  <p className="text-xs">As fotos e assinaturas aparecerão aqui após as entregas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comprovacoes.slice(0, 6).map((e) => (
                    <div
                      key={e.id}
                      className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden"
                    >
                      {/* Foto */}
                      {e.foto_comprovante_url ? (
                        <div className="relative h-40 bg-[#F8FAFC]">
                          <img
                            src={e.foto_comprovante_url}
                            alt={`Entrega para ${e.paciente_nome}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 text-white border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Entregue
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="h-20 bg-[#F8FAFC] flex items-center justify-center">
                          <Camera className="w-8 h-8 text-[#CBD5E1]" />
                        </div>
                      )}
                      <div className="p-3 space-y-2">
                        <div>
                          <p className="text-sm text-[#1E293B] font-semibold">{e.paciente_nome}</p>
                          <p className="text-xs text-[#64748B]">
                            {format(parseISO(e.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        {e.itens.length > 0 && (
                          <div className="bg-[#F8FAFC] rounded p-2">
                            <div className="flex items-center gap-1 text-xs text-[#64748B]">
                              <Package className="w-3 h-3" />
                              <span>{e.itens.map((i) => i.medicamento_nome).join(', ')}</span>
                            </div>
                          </div>
                        )}
                        {e.assinatura_digital_url && (
                          <div className="border border-[#E2E8F0] rounded p-2">
                            <div className="flex items-center gap-1 text-xs text-[#64748B] mb-1">
                              <PenTool className="w-3 h-3" />
                              <span>Assinatura Digital:</span>
                            </div>
                            <img
                              src={e.assinatura_digital_url}
                              alt="Assinatura"
                              className="w-full h-12 object-contain bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Aba Alertas */}
          {abaAtiva === 'alertas' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#94A3B8]">
              <AlertTriangle className="w-10 h-10" />
              <p className="text-sm font-medium text-[#64748B]">Nenhum alerta registrado</p>
              <p className="text-xs text-center max-w-xs">
                Alertas de desvio de rota e paradas excessivas serão exibidos aqui quando detectados pelo sistema de monitoramento
              </p>
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm w-full">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0" />
                  <p className="text-xs text-blue-900">
                    <strong>Protocolo de Segurança:</strong> Todos os alertas são monitorados em
                    tempo real. Desvios injustificados podem resultar em ações disciplinares.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
