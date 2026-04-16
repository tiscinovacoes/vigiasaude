'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  TrendingUp,
  Package,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  Pill,
  HeartPulse,
  CircleAlert,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { api, type Paciente } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type Prescricao = {
  id: string;
  medicamento_id: string;
  medicamento_nome: string;
  data_vencimento_receita: string;
  status_receita: 'ATIVA' | 'VENCIDA';
  frequencia_entrega: number;
  quantidade_dispensada_padrao: number;
  dosagem_prescrita: string | null;
};

type TimelineItem = {
  id: string;
  data: string;
  status: string;
  lote_codigo: string;
  medicamento_nome: string;
  serial_numbers: string[];
  custo_total: number;
};

type Analytics = {
  investimentoTotal: number;
  recalls: any[];
  adesao: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');

const statusCls = (status: string) => {
  switch (status) {
    case 'ENTREGUE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'EM_ROTA':  return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'FALHA':    return 'bg-red-50 text-red-700 border-red-200';
    default:         return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PacienteDetalhes() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const [loading,      setLoading]      = useState(true);
  const [paciente,     setPaciente]     = useState<Paciente | null>(null);
  const [analytics,    setAnalytics]    = useState<Analytics>({ investimentoTotal: 0, recalls: [], adesao: 0 });
  const [timeline,     setTimeline]     = useState<TimelineItem[]>([]);
  const [prescricoes,  setPrescricoes]  = useState<Prescricao[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // ── Carregar ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [pac, ana, tl, presc] = await Promise.all([
          api.getPacienteById(id),
          api.getPacienteAnalytics(id),
          api.getTimelineDispensacoes(id),
          api.getPrescricoesByPaciente(id),
        ]);
        setPaciente(pac);
        setAnalytics(ana ?? { investimentoTotal: 0, recalls: [], adesao: 0 });
        setTimeline(tl ?? []);
        setPrescricoes(presc ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Derivados ─────────────────────────────────────────────────────────────
  const temReceitaVencida  = prescricoes.some(p => p.status_receita === 'VENCIDA');
  const prescricaoVencida  = prescricoes.find(p => p.status_receita === 'VENCIDA');
  const adesao             = analytics.adesao;
  const adesaoCor          = adesao >= 80 ? 'bg-emerald-500' : adesao >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const adesaoTexto        = adesao >= 80 ? 'text-emerald-700' : adesao >= 60 ? 'text-amber-700' : 'text-red-700';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="font-bold">Paciente não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl shrink-0">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{paciente.nome_completo}</h1>
              {temReceitaVencida
                ? <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs font-black gap-1 shrink-0"><ShieldX size={11}/> Receita Vencida</Badge>
                : prescricoes.length > 0
                  ? <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black gap-1 shrink-0"><ShieldCheck size={11}/> Receita Ativa</Badge>
                  : <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-black shrink-0">Sem Prescrição</Badge>
              }
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1"><Hash size={11}/> {paciente.cpf}</span>
              {paciente.telefone && <span className="flex items-center gap-1"><Phone size={11}/> {paciente.telefone}</span>}
              {paciente.janela_entrega && <span className="flex items-center gap-1"><Clock size={11}/> {paciente.janela_entrega}</span>}
              {paciente.endereco_completo && <span className="flex items-center gap-1 max-w-xs truncate"><MapPin size={11}/> {paciente.endereco_completo}</span>}
            </div>
          </div>
        </div>

        {/* Botão Nova Dispensação — bloqueado se receita vencida */}
        <div className="relative group shrink-0">
          <Button
            disabled={temReceitaVencida}
            className={cn(
              'font-black rounded-xl h-11 px-6 gap-2',
              temReceitaVencida
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#1A2B6D] hover:bg-[#121f4f] text-white shadow-lg'
            )}
          >
            <Package size={16} />
            Nova Dispensação
          </Button>
          {temReceitaVencida && prescricaoVencida && (
            <div className="absolute right-0 top-full mt-2 z-20 hidden group-hover:block bg-slate-900 text-white text-xs rounded-xl px-3 py-2 w-64 shadow-xl pointer-events-none">
              Receita vencida em {fmtDate(prescricaoVencida.data_vencimento_receita)} — atualize o cadastro para liberar a dispensação.
            </div>
          )}
        </div>
      </div>

      {/* ── ALERTA SERVIÇO SOCIAL ─────────────────────────────────────────── */}
      {adesao > 0 && adesao < 60 && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="text-red-600 shrink-0" size={18} />
          <div>
            <p className="text-sm font-black text-red-800">⚠️ ALERTA SERVIÇO SOCIAL</p>
            <p className="text-xs text-red-600 mt-0.5">
              Índice de adesão de <strong>{adesao}%</strong> — abaixo do mínimo aceitável (60%). Intervenção recomendada.
            </p>
          </div>
        </div>
      )}

      {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Status da Receita */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={12}/> Status da Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prescricoes.length === 0 ? (
              <>
                <p className="text-xl font-black text-slate-400">—</p>
                <p className="text-[11px] text-slate-400 mt-1">Sem prescrições cadastradas</p>
              </>
            ) : temReceitaVencida ? (
              <>
                <p className="text-2xl font-black text-red-600">Vencida</p>
                <p className="text-[11px] text-red-400 mt-1">Venceu em {fmtDate(prescricaoVencida!.data_vencimento_receita)}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-emerald-600">Ativa</p>
                <p className="text-[11px] text-slate-400 mt-1">Vence em {fmtDate(prescricoes[0].data_vencimento_receita)}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Índice de Adesão */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <HeartPulse size={12}/> Índice de Adesão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={cn('text-2xl font-black', adesao > 0 ? adesaoTexto : 'text-slate-400')}>{adesao}%</span>
              {adesao >= 80 && <CheckCircle2 size={15} className="text-emerald-500"/>}
              {adesao > 0 && adesao < 60 && <XCircle size={15} className="text-red-500"/>}
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', adesao > 0 ? adesaoCor : 'bg-slate-200')}
                style={{ width: `${Math.max(adesao, 2)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              {adesao >= 80 ? 'Adesão excelente' : adesao >= 60 ? 'Adesão regular' : adesao > 0 ? 'Adesão crítica' : 'Sem dados ainda'}
            </p>
          </CardContent>
        </Card>

        {/* Investimento */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={12}/> Investimento em Saúde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-slate-900">{fmt(analytics.investimentoTotal)}</p>
            <p className="text-[11px] text-slate-400 mt-1">investido via dispensações</p>
          </CardContent>
        </Card>
      </div>

      {/* ── PRESCRIÇÕES ───────────────────────────────────────────────────── */}
      {prescricoes.length > 0 && (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-3">
            <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Pill size={15} className="text-blue-500"/> Prescrições Ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {prescricoes.map(p => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.medicamento_nome}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {p.dosagem_prescrita && `${p.dosagem_prescrita} · `}
                      A cada {p.frequencia_entrega} dias · {p.quantidade_dispensada_padrao} un.
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <Badge className={cn(
                      'text-[10px] font-black border gap-1',
                      p.status_receita === 'ATIVA'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    )}>
                      {p.status_receita === 'ATIVA'
                        ? <CheckCircle2 size={9}/>
                        : <XCircle size={9}/>
                      }
                      {p.status_receita}
                    </Badge>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {p.status_receita === 'ATIVA' ? 'Vence em ' : 'Venceu em '}
                      {fmtDate(p.data_vencimento_receita)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── RECALL ATIVO ──────────────────────────────────────────────────── */}
      {analytics.recalls.length > 0 && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 flex items-start gap-3">
          <CircleAlert className="text-orange-500 shrink-0 mt-0.5" size={17}/>
          <div>
            <p className="text-sm font-black text-orange-800">Recall Ativo Detectado</p>
            <p className="text-xs text-orange-600 mt-0.5">Este paciente possui lotes com recall ativo. Verifique o painel de Recall para detalhes.</p>
          </div>
        </div>
      )}

      {/* ── TIMELINE DE DISPENSAÇÕES ──────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-3">
          <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Calendar size={15} className="text-slate-400"/> Histórico de Dispensações
            <Badge className="bg-slate-100 text-slate-500 border-none shadow-none text-[10px] font-black ml-1">
              {timeline.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {timeline.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="font-bold text-sm">Nenhuma dispensação registrada</p>
              <p className="text-xs mt-1">O histórico aparecerá aqui após as primeiras entregas.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {timeline.map(item => {
                const expanded = expandedItem === item.id;
                const d = new Date(item.data);
                return (
                  <div key={item.id}>
                    <button
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors text-left"
                      onClick={() => setExpandedItem(expanded ? null : item.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Data compacta */}
                        <div className="text-center shrink-0 w-10">
                          <p className="text-[9px] font-black text-slate-400 uppercase">
                            {d.toLocaleDateString('pt-BR', { month: 'short' })}
                          </p>
                          <p className="text-lg font-black text-slate-800 leading-tight">{d.getDate()}</p>
                          <p className="text-[9px] text-slate-400">{d.getFullYear()}</p>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 truncate">{item.medicamento_nome || '—'}</span>
                            <Badge className={cn('text-[9px] font-black border px-1.5 py-0 shrink-0', statusCls(item.status))}>
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Lote: <span className="font-mono">{item.lote_codigo || '—'}</span>
                            {item.serial_numbers.length > 0 && <> · {item.serial_numbers.length} S/N</>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-sm font-black text-slate-700">{fmt(item.custo_total)}</span>
                        {expanded
                          ? <ChevronUp size={15} className="text-slate-400"/>
                          : <ChevronDown size={15} className="text-slate-400"/>
                        }
                      </div>
                    </button>

                    {/* Painel expandido */}
                    {expanded && (
                      <div className="px-6 pb-4 pt-2 bg-slate-50/60 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-black text-slate-500 uppercase text-[10px] w-24 shrink-0">Dispense ID</span>
                          <code className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 text-[11px] break-all">{item.id}</code>
                        </div>
                        {item.serial_numbers.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="font-black text-slate-500 uppercase text-[10px] w-24 shrink-0 mt-1">Serial Nos.</span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.serial_numbers.map(sn => (
                                <code key={sn} className="font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">{sn}</code>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-black text-slate-500 uppercase text-[10px] w-24 shrink-0">Custo Total</span>
                          <span className="font-bold text-slate-800">{fmt(item.custo_total)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-black text-slate-500 uppercase text-[10px] w-24 shrink-0">Data/Hora</span>
                          <span className="text-slate-600">{d.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
