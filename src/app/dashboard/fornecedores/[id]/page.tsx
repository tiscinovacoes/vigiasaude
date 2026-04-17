'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, FileText,
  Clock, ShoppingCart, DollarSign, TrendingUp, Package,
  AlertTriangle, CheckCircle, Calendar, BarChart3,
  Star, Award, ShieldCheck, ShieldAlert, Truck,
  ChevronDown, ChevronUp, Loader2, TrendingDown,
  Minus, Edit2, Check, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, LineChart, Line
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api, type Fornecedor, type CompraFornecedor } from '@/lib/api';
import { toast } from 'sonner';

// ─── Utilitários ──────────────────────────────────────────────────────────────

function scoreConfig(pct: number) {
  if (pct >= 90) return {
    label: 'Fornecedor Premium', cor: 'text-emerald-700',
    bg: 'bg-emerald-50', border: 'border-emerald-300',
    barCor: '#10b981', icone: '🏆'
  };
  if (pct >= 70) return {
    label: 'Regular', cor: 'text-blue-700',
    bg: 'bg-blue-50', border: 'border-blue-300',
    barCor: '#3b82f6', icone: '🔵'
  };
  return {
    label: 'Crítico', cor: 'text-red-700',
    bg: 'bg-red-50', border: 'border-red-300',
    barCor: '#ef4444', icone: '🔴'
  };
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function diasDesde(iso: string) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
}

// ─── Lead Time Timeline Visual ───────────────────────────────────────────────

function LeadTimeCard({ compra, leadTimeMedio }: { compra: CompraFornecedor; leadTimeMedio: number }) {
  const msD = 86400000;
  const sol = compra.data_solicitacao ? new Date(compra.data_solicitacao) : null;
  const prev = compra.data_entrega_prevista ? new Date(compra.data_entrega_prevista) : null;
  const real = compra.data_entrega_real ? new Date(compra.data_entrega_real) : null;

  const diasSolPrev = sol && prev ? Math.round((prev.getTime() - sol.getTime()) / msD) : null;
  const diasPrevReal = prev && real ? Math.round((real.getTime() - prev.getTime()) / msD) : null;
  const total = compra.lead_time_real;
  const atrasou = prev && real ? real > prev : false;

  const etapas = [
    {
      icone: <FileText size={14} />,
      label: 'Solicitação',
      data: sol ? format(sol, 'dd/MM/yy') : '—',
      ok: !!sol,
    },
    {
      icone: <Package size={14} />,
      label: 'Entrega Prevista',
      data: prev ? format(prev, 'dd/MM/yy') : '—',
      ok: !!prev,
      dias: diasSolPrev !== null ? `${diasSolPrev}d` : null,
    },
    {
      icone: <Truck size={14} />,
      label: 'Entrega Real',
      data: real ? format(real, 'dd/MM/yy') : 'Pendente',
      ok: !!real && !atrasou,
      alerta: atrasou,
      dias: diasPrevReal !== null ? (atrasou ? `+${diasPrevReal}d atraso` : `${diasPrevReal}d cedo`) : null,
    },
  ];

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-black text-slate-600 uppercase tracking-wider">
            {compra.medicamento_nome}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">{compra.id.slice(0, 8)}…</p>
        </div>
        <div className="flex items-center gap-2">
          {total !== null && (
            <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${
              total <= leadTimeMedio ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {total}d real {total <= leadTimeMedio ? '✅' : '⚠️'}
            </span>
          )}
          <Badge className={`text-[9px] font-black ${
            compra.status === 'ENTREGUE' ? 'bg-emerald-100 text-emerald-700' :
            compra.status === 'EMPENHADO' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-600'
          }`}>{compra.status}</Badge>
        </div>
      </div>

      {/* Timeline horizontal */}
      <div className="flex items-center gap-0 mt-2">
        {etapas.map((e, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center min-w-[70px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                e.alerta ? 'bg-red-50 border-red-400 text-red-600' :
                e.ok ? 'bg-emerald-50 border-emerald-400 text-emerald-600' :
                'bg-slate-50 border-slate-300 text-slate-400'
              }`}>
                {e.icone}
              </div>
              <p className="text-[9px] font-bold text-slate-600 mt-1 text-center leading-tight">{e.label}</p>
              <p className={`text-[9px] font-mono mt-0.5 ${e.alerta ? 'text-red-500 font-black' : 'text-slate-400'}`}>{e.data}</p>
            </div>
            {i < etapas.length - 1 && (
              <div className="flex-1 flex flex-col items-center mx-1">
                <div className={`h-0.5 w-full ${e.ok ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                {etapas[i + 1].dias && (
                  <span className={`text-[9px] font-bold mt-0.5 ${
                    (etapas[i+1] as any).alerta ? 'text-red-500' : 'text-slate-400'
                  }`}>
                    {etapas[i + 1].dias}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente de Edição Inline de Contato ───────────────────────────────────

function EditableField({ label, value, icon, onSave }: {
  label: string; value: string | null | undefined;
  icon: React.ReactNode;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');

  const confirmar = () => { onSave(val); setEditing(false); };

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{label}</p>
        {editing ? (
          <div className="flex items-center gap-1 mt-0.5">
            <input
              autoFocus
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button onClick={confirmar} className="text-emerald-600 hover:text-emerald-700"><Check size={14} /></button>
            <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1 group">
            <p className="text-sm font-medium text-slate-700 truncate">{value || <span className="text-slate-300 italic">Não informado</span>}</p>
            <button onClick={() => { setVal(value ?? ''); setEditing(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 size={11} className="text-slate-400 hover:text-blue-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

const MESES_GRAFICO = 6;

export default function FornecedorDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [compras, setCompras] = useState<CompraFornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'historico' | 'timeline' | 'ocorrencias'>('historico');
  const [salvandoContato, setSalvandoContato] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [forn, compList] = await Promise.all([
        api.getFornecedorById(id),
        api.getComprasByFornecedor(id),
      ]);
      setFornecedor(forn);
      setCompras(compList);
    } catch {
      toast.error('Erro ao carregar dados do fornecedor');
    } finally {
      setLoading(false);
    }
  }

  async function salvarCampo(campo: string, valor: string) {
    if (!fornecedor) return;
    setSalvandoContato(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await sb.from('fornecedores').update({ [campo]: valor }).eq('id', id);
      if (error) throw error;
      setFornecedor(prev => prev ? { ...prev, [campo]: valor } : prev);
      toast.success('Informação atualizada');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSalvandoContato(false);
    }
  }

  // ── KPIs calculados ─────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!fornecedor) return null;
    const doze = new Date(); doze.setFullYear(doze.getFullYear() - 1);
    const compras12m = compras.filter(c => c.data_solicitacao && new Date(c.data_solicitacao) >= doze);
    const valorAcumulado = compras12m.reduce((s, c) => s + (c.quantidade * (c.valor_unitario ?? 0)), 0);
    const entregues = compras.filter(c => c.status === 'ENTREGUE');
    return {
      leadTime: fornecedor.lead_time_medio,
      totalCompras: compras.length,
      valorAcumulado,
      pontualidade: fornecedor.pontualidade_percentual,
      entregues: entregues.length,
    };
  }, [fornecedor, compras]);

  // ── Dados para o gráfico de performance mensal ──────────────────────────────
  const dadosGrafico = useMemo(() => {
    const meses: { mes: string; noPrazo: number; atrasado: number }[] = [];
    for (let i = MESES_GRAFICO - 1; i >= 0; i--) {
      const ref = subMonths(new Date(), i);
      const inicio = startOfMonth(ref);
      const fim = endOfMonth(ref);
      const doMes = compras.filter(c => {
        if (!c.data_entrega_real) return false;
        const dt = new Date(c.data_entrega_real);
        return dt >= inicio && dt <= fim;
      });
      const noPrazo = doMes.filter(c =>
        c.data_entrega_prevista && new Date(c.data_entrega_real!) <= new Date(c.data_entrega_prevista)
      ).length;
      meses.push({
        mes: format(ref, 'MMM', { locale: ptBR }).toUpperCase(),
        noPrazo,
        atrasado: doMes.length - noPrazo,
      });
    }
    return meses;
  }, [compras]);

  // ── Totalizadores histórico ──────────────────────────────────────────────────
  const totais = useMemo(() => ({
    unidades: compras.reduce((s, c) => s + c.quantidade, 0),
    valor: compras.reduce((s, c) => s + c.quantidade * (c.valor_unitario ?? 0), 0),
  }), [compras]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando fornecedor...</p>
      </div>
    );
  }

  if (!fornecedor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert size={40} className="text-slate-300" />
        <p className="font-bold text-slate-600">Fornecedor não encontrado</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/fornecedores')}>
          <ArrowLeft size={14} className="mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const score = scoreConfig(fornecedor.pontualidade_percentual);
  const comprasEntregues = compras.filter(c => c.status === 'ENTREGUE' && c.data_solicitacao && c.data_entrega_real);

  return (
    <div className="space-y-5 pb-16">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/fornecedores')} className="shrink-0 w-fit">
          <ArrowLeft size={14} className="mr-2" /> Voltar
        </Button>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${score.bg}`}>
            <Building2 size={28} className={score.cor} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-black text-slate-800 truncate">{fornecedor.razao_social}</h1>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${score.bg} ${score.cor} ${score.border}`}>
                {score.icone} {score.label}
              </span>
              {fornecedor.ativo === false && (
                <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">INATIVO</Badge>
              )}
            </div>
            <p className="text-sm text-slate-400 font-mono mt-0.5">CNPJ: {fornecedor.cnpj}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase">Cadastrado em</p>
          <p className="text-sm font-bold text-slate-600">{format(new Date(fornecedor.created_at), 'dd/MM/yyyy')}</p>
          <p className="text-[10px] text-slate-400">{diasDesde(fornecedor.created_at)} dias atrás</p>
        </div>
      </div>

      {/* ── CONTATO (editável) ─────────────────────────────────────────────── */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <EditableField label="Telefone"    icon={<Phone size={18} className="text-[#1E3A8A]" />}    value={fornecedor.telefone}    onSave={v => salvarCampo('telefone', v)} />
            <EditableField label="E-mail"      icon={<Mail size={18} className="text-[#1E3A8A]" />}      value={fornecedor.email}       onSave={v => salvarCampo('email', v)} />
            <EditableField label="Endereço"    icon={<MapPin size={18} className="text-[#1E3A8A]" />}    value={fornecedor.endereco}    onSave={v => salvarCampo('endereco', v)} />
            <EditableField label="Responsável" icon={<FileText size={18} className="text-[#1E3A8A]" />}  value={fornecedor.responsavel} onSave={v => salvarCampo('responsavel', v)} />
          </div>
        </CardContent>
      </Card>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-l-4 border-l-[#1E3A8A]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lead Time Médio</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-slate-800">{kpis.leadTime}</p>
                    <p className="text-xs font-bold text-slate-400">dias úteis</p>
                  </div>
                  {compras.length === 0 && <p className="text-[10px] text-slate-400 mt-1">Aguardando pedidos</p>}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock size={22} className="text-[#1E3A8A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total de Compras</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-slate-800">{kpis.totalCompras}</p>
                    <p className="text-xs font-bold text-slate-400">pedidos</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{kpis.entregues} entregues</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={22} className="text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Valor Acumulado</p>
                  <p className="text-xl font-black text-slate-800">{formatBRL(kpis.valorAcumulado)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">últimos 12 meses</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign size={22} className="text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-sm border-l-4 ${kpis.pontualidade >= 90 ? 'border-l-emerald-500' : kpis.pontualidade >= 70 ? 'border-l-amber-500' : 'border-l-red-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pontualidade</p>
                  <p className={`text-3xl font-black ${score.cor}`}>{kpis.pontualidade}%</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${score.bg}`}>
                  <TrendingUp size={22} className={score.cor} />
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${kpis.pontualidade}%`, backgroundColor: score.barCor }} />
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-1">Meta: 90% — Entregas no prazo</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── GRÁFICO DE PERFORMANCE ─────────────────────────────────────────── */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight flex items-center gap-2">
                <BarChart3 size={16} className="text-[#1E3A8A]" />
                Performance de Entregas — Últimos {MESES_GRAFICO} Meses
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Verde = no prazo · Vermelho = atrasado · Linha = meta 90%</p>
            </div>
            <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${score.bg} ${score.cor} ${score.border}`}>
              {score.icone} {fornecedor.pontualidade_percentual}%
            </span>
          </div>

          {dadosGrafico.every(d => d.noPrazo === 0 && d.atrasado === 0) ? (
            <div className="h-32 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">
              <div className="text-center">
                <BarChart3 size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">Nenhuma entrega registrada ainda</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dadosGrafico} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: 'none', borderRadius: 12, fontSize: 11, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v: any, name: any) => [v, name === 'noPrazo' ? 'No prazo' : 'Atrasado']}
                />
                <Bar dataKey="noPrazo" fill="#10b981" radius={[6, 6, 0, 0]} name="noPrazo" />
                <Bar dataKey="atrasado" fill="#f87171" radius={[6, 6, 0, 0]} name="atrasado" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── ABAS ───────────────────────────────────────────────────────────── */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        {/* Tab headers */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 flex items-center gap-1">
          {[
            { key: 'historico',   icon: <Package size={14} />,      label: 'Histórico de Itens',   count: compras.length },
            { key: 'timeline',    icon: <Truck size={14} />,         label: 'Lead Time Timeline',   count: comprasEntregues.length },
            { key: 'ocorrencias', icon: <AlertTriangle size={14} />, label: 'Ocorrências',           count: 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setAbaAtiva(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors text-xs font-bold uppercase tracking-wider ${
                abaAtiva === tab.key
                  ? tab.key === 'ocorrencias' ? 'border-red-500 text-red-600' : 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.icon} {tab.label}
              {tab.count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  abaAtiva === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Histórico ─────────────────────────────────────────────── */}
        {abaAtiva === 'historico' && (
          <div>
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <BarChart3 size={14} className="text-[#1E3A8A]" />
                Total: <span className="font-black text-slate-800">{totais.unidades.toLocaleString('pt-BR')} un.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <DollarSign size={14} className="text-emerald-600" />
                Valor: <span className="font-black text-slate-800">{formatBRL(totais.valor)}</span>
              </div>
            </div>

            {compras.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">Nenhuma compra registrada</p>
                <p className="text-xs mt-1">As compras aparecerão aqui após o primeiro pedido.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="text-left px-5 py-3">Data</th>
                      <th className="text-left px-5 py-3">Medicamento</th>
                      <th className="text-center px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Qtd</th>
                      <th className="text-right px-5 py-3">Preço Unit.</th>
                      <th className="text-right px-5 py-3">Valor Total</th>
                      <th className="text-right px-5 py-3">Lead Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {compras.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 text-slate-500 font-medium text-xs">
                          {c.data_solicitacao ? format(new Date(c.data_solicitacao), 'dd/MM/yyyy') : '—'}
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-800">{c.medicamento_nome}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            c.status === 'ENTREGUE' ? 'bg-emerald-100 text-emerald-700' :
                            c.status === 'EMPENHADO' ? 'bg-blue-100 text-blue-700' :
                            c.status === 'SOLICITADO' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-black">{c.quantidade.toLocaleString('pt-BR')}</td>
                        <td className="px-5 py-3 text-right text-slate-500">
                          {c.valor_unitario ? formatBRL(c.valor_unitario) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-emerald-600">
                          {c.valor_unitario ? formatBRL(c.quantidade * c.valor_unitario) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {c.lead_time_real !== null ? (
                            <span className={`text-xs font-black ${c.lead_time_real <= fornecedor.lead_time_medio ? 'text-emerald-600' : 'text-red-500'}`}>
                              {c.lead_time_real}d
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Lead Time Timeline ────────────────────────────────────── */}
        {abaAtiva === 'timeline' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Últimas {Math.min(comprasEntregues.length, 8)} entregas com rastreabilidade completa
              </p>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                Meta lead time: {fornecedor.lead_time_medio}d
              </span>
            </div>

            {comprasEntregues.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                <Truck size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">Nenhuma entrega confirmada ainda</p>
                <p className="text-xs mt-1">A timeline aparecerá após confirmar a primeira entrega.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comprasEntregues.slice(0, 8).map(c => (
                  <LeadTimeCard key={c.id} compra={c} leadTimeMedio={fornecedor.lead_time_medio} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Ocorrências ───────────────────────────────────────────── */}
        {abaAtiva === 'ocorrencias' && (
          <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400">
            <CheckCircle size={40} className="mb-3 text-emerald-400" />
            <p className="font-black text-slate-600 text-sm">Nenhuma ocorrência registrada</p>
            <p className="text-xs mt-1 text-slate-400">O registro de ocorrências estará disponível em breve.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
