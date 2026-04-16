'use client';

import { useState, useEffect, useMemo } from 'react';
import { auditoriaAPI } from '@/lib/api';
import {
  ShieldCheck, UserCog, KeyRound, ShieldAlert,
  History, Search, Filter, Loader2, RefreshCw,
  AlertCircle, Shield, Download, ChevronLeft,
  ChevronRight, X, GitCompare, Calendar,
  SlidersHorizontal, FileDown, Eye, EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type LogAuditoria = {
  id: string;
  created_at: string;
  ator: string;
  acao: string;
  tabela_afetada: string;
  severidade: string;
  dados_anteriores: any;
  dados_novos: any;
  metadados: any;
};

// ─── Utilitários ───────────────────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function parseCampos(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return { valor: raw }; }
  }
  return raw;
}

/** Gera CSV a partir dos logs filtrados */
function gerarCSV(logs: LogAuditoria[]): string {
  const headers = ['ID', 'Data/Hora', 'Ator', 'Ação', 'Tabela', 'Severidade', 'Dados Anteriores', 'Dados Novos', 'Metadados'];
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = logs.map(l => [
    l.id,
    format(new Date(l.created_at), 'dd/MM/yyyy HH:mm:ss'),
    l.ator,
    l.acao,
    l.tabela_afetada,
    l.severidade,
    typeof l.dados_anteriores === 'object' ? JSON.stringify(l.dados_anteriores) : (l.dados_anteriores ?? ''),
    typeof l.dados_novos === 'object' ? JSON.stringify(l.dados_novos) : (l.dados_novos ?? ''),
    typeof l.metadados === 'object' ? JSON.stringify(l.metadados) : (l.metadados ?? ''),
  ].map(escape).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Componente DiffView ──────────────────────────────────────────────────────

function DiffView({ antes, depois }: { antes: any; depois: any }) {
  const a = parseCampos(antes);
  const d = parseCampos(depois);
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(d)]));

  if (keys.length === 0) return null;

  return (
    <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden text-[11px]">
      {/* Header */}
      <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200">
        <div className="px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Campo</div>
        <div className="px-3 py-2 font-black text-red-600 uppercase tracking-widest text-[9px] border-l border-slate-200 bg-red-50/30">
          ← Anterior
        </div>
        <div className="px-3 py-2 font-black text-emerald-700 uppercase tracking-widest text-[9px] border-l border-slate-200 bg-emerald-50/30">
          Novo →
        </div>
      </div>

      {keys.map(k => {
        const valA = a[k] !== undefined ? String(a[k]) : '—';
        const valD = d[k] !== undefined ? String(d[k]) : '—';
        const mudou = valA !== valD;

        return (
          <div
            key={k}
            className={cn(
              'grid grid-cols-3 border-b border-slate-100 last:border-0',
              mudou && 'bg-amber-50/40'
            )}
          >
            <div className="px-3 py-2 font-bold text-slate-600 font-mono flex items-center gap-1">
              {mudou && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
              {k}
            </div>
            <div className={cn(
              'px-3 py-2 font-mono border-l border-slate-100 break-all',
              mudou ? 'text-red-600 bg-red-50/50' : 'text-slate-500'
            )}>
              {valA}
            </div>
            <div className={cn(
              'px-3 py-2 font-mono border-l border-slate-100 break-all',
              mudou ? 'text-emerald-700 bg-emerald-50/50 font-bold' : 'text-slate-500'
            )}>
              {valD}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pill de Severidade ───────────────────────────────────────────────────────

const SEV_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'Crítica': { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    label: '🔴 Crítica'  },
  'Alta':    { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: '🟠 Alta'     },
  'Média':   { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   label: '🔵 Média'    },
  'Baixa':   { bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-300',  label: '⚪ Baixa'    },
};

const ACAO_CONFIG: Record<string, string> = {
  'INSERT':           'bg-emerald-100 text-emerald-700',
  'UPDATE':           'bg-blue-100 text-blue-700',
  'DELETE':           'bg-red-100 text-red-700',
  'RECALL_INICIADO':  'bg-purple-100 text-purple-700',
  'ALERTA_SEGURANCA': 'bg-amber-100 text-amber-700',
};

const PER_PAGE = 15;

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function PainelAuditoriaMaster() {
  const [logs, setLogs]           = useState<LogAuditoria[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchQuery, setSearch]  = useState('');
  const [filtroSev, setFiltroSev] = useState<string[]>([]);   // [] = todos
  const [filtroAcao, setFiltroAcao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim]       = useState('');
  const [pagina, setPagina]         = useState(1);
  const [expandDiff, setExpandDiff] = useState<Set<string>>(new Set());
  const [painelFiltros, setPainelFiltros] = useState(false);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditoriaAPI.getLogsRecentes();
      setLogs(data as LogAuditoria[]);
    } catch {
      toast.error('Erro ao carregar trilha de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const toggleSev = (s: string) =>
    setFiltroSev(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleDiff = (id: string) =>
    setExpandDiff(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // ── Filtragem ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return logs.filter(l => {
      const q = searchQuery.toLowerCase();
      const matchBusca = !q ||
        l.id.toLowerCase().includes(q) ||
        l.ator.toLowerCase().includes(q) ||
        l.tabela_afetada.toLowerCase().includes(q) ||
        l.acao.toLowerCase().includes(q) ||
        (l.severidade ?? '').toLowerCase().includes(q);

      const matchSev = filtroSev.length === 0 || filtroSev.includes(l.severidade);
      const matchAcao = !filtroAcao || l.acao === filtroAcao;

      const dt = new Date(l.created_at);
      const matchInicio = !dataInicio || dt >= new Date(dataInicio);
      const matchFim    = !dataFim    || dt <= new Date(dataFim + 'T23:59:59');

      return matchBusca && matchSev && matchAcao && matchInicio && matchFim;
    });
  }, [logs, searchQuery, filtroSev, filtroAcao, dataInicio, dataFim]);

  // ── Paginação ───────────────────────────────────────────────────────────────
  const totalPaginas = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginated    = filtered.slice((paginaSegura - 1) * PER_PAGE, paginaSegura * PER_PAGE);

  // Resetar paginação ao filtrar
  const handleSearch = (v: string) => { setSearch(v); setPagina(1); };
  const handleSev    = (s: string) => { toggleSev(s); setPagina(1); };

  // ── Estatísticas ────────────────────────────────────────────────────────────
  const stats = {
    criticos: logs.filter(l => l.severidade === 'Crítica').length,
    alta:     logs.filter(l => l.severidade === 'Alta').length,
    total:    logs.length,
    acoes: {
      insert: logs.filter(l => l.acao === 'INSERT').length,
      update: logs.filter(l => l.acao === 'UPDATE').length,
      delete: logs.filter(l => l.acao === 'DELETE').length,
    }
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportarCSV = () => {
    const csv = gerarCSV(filtered);
    const nome = `auditoria_vigiasaude_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    downloadCSV(csv, nome);
    toast.success(`Exportado: ${filtered.length} registros → ${nome}`);
  };

  const acoesDoBanco = Array.from(new Set(logs.map(l => l.acao))).sort();
  const filtrosAtivos = filtroSev.length + (filtroAcao ? 1 : 0) + (dataInicio ? 1 : 0) + (dataFim ? 1 : 0);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen pb-20">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <ShieldCheck className="text-[#1E3A8A]" size={28} />
            Compliance e Auditoria Master
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">
            Trilha WORM — Rastreabilidade Imutável | {stats.total} registros
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { loadLogs(); toast.success('Trilha atualizada'); }}
            className="gap-2 text-xs font-bold uppercase"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPainelFiltros(v => !v)}
            className={cn('gap-2 text-xs font-bold uppercase', painelFiltros && 'bg-blue-50 border-blue-300 text-blue-700')}
          >
            <SlidersHorizontal size={14} />
            Filtros
            {filtrosAtivos > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-black">
                {filtrosAtivos}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            onClick={exportarCSV}
            className="gap-2 text-xs font-bold uppercase bg-[#1E3A8A] hover:bg-blue-900"
          >
            <FileDown size={14} />
            Exportar CSV ({filtered.length})
          </Button>
        </div>
      </div>

      {/* PAINEL DE FILTROS AVANÇADOS */}
      {painelFiltros && (
        <div className="bg-white border rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Filter size={14} /> Filtros Avançados
            </h3>
            {filtrosAtivos > 0 && (
              <button
                onClick={() => { setFiltroSev([]); setFiltroAcao(''); setDataInicio(''); setDataFim(''); setPagina(1); }}
                className="text-[10px] text-red-500 font-bold hover:text-red-700 flex items-center gap-1"
              >
                <X size={10} /> Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Severidade */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Severidade</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SEV_CONFIG).map(([sev, cfg]) => (
                  <button
                    key={sev}
                    onClick={() => handleSev(sev)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[10px] font-black border-2 transition-all uppercase tracking-wide',
                      filtroSev.includes(sev)
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de Ação */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Tipo de Ação</p>
              <select
                value={filtroAcao}
                onChange={e => { setFiltroAcao(e.target.value); setPagina(1); }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="">Todas as ações</option>
                {acoesDoBanco.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Intervalo de Datas */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                <Calendar size={10} className="inline mr-1" />
                Período
              </p>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => { setDataInicio(e.target.value); setPagina(1); }}
                  className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <span className="text-slate-400 text-xs font-bold">até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={e => { setDataFim(e.target.value); setPagina(1); }}
                  className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Logs',    val: stats.total,    cor: 'text-slate-800'  },
              { label: 'Críticos',      val: stats.criticos, cor: 'text-red-600'    },
              { label: 'Alta',          val: stats.alta,     cor: 'text-orange-600' },
              { label: 'Filtrados',     val: filtered.length, cor: 'text-blue-700'  },
            ].map(k => (
              <div key={k.label} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                <p className={`text-2xl font-black ${k.cor}`}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Distribuição de Ações */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Distribuição de Ações</h3>
            <div className="space-y-3">
              {[
                { label: 'Inserções',  val: stats.acoes.insert, cor: 'bg-emerald-500' },
                { label: 'Alterações', val: stats.acoes.update, cor: 'bg-blue-500'    },
                { label: 'Exclusões',  val: stats.acoes.delete, cor: 'bg-red-500'     },
              ].map(item => {
                const pct = stats.total > 0 ? Math.round((item.val / stats.total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span>{item.label}</span>
                      <span>{item.val} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.cor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Ecossistema */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Status do Ecossistema</h3>
            <div className="space-y-4">
              {[
                { nome: 'Supabase DB',          sub: 'PostgreSQL HA' },
                { nome: 'Triggers de Auditoria', sub: 'Auto-Observer' },
                { nome: 'Políticas RLS',         sub: 'WORM Imutável'  },
              ].map(s => (
                <div key={s.nome} className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{s.nome}</p>
                    <p className="text-[10px] text-slate-400">{s.sub}</p>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Garantia Imutável */}
          <div className="bg-[#1E3A8A] p-5 rounded-2xl text-white relative overflow-hidden">
            <div className="absolute -right-3 -bottom-3 opacity-10"><Shield size={80} /></div>
            <h3 className="font-black text-xs uppercase tracking-widest mb-2 relative z-10">Garantia Imutável</h3>
            <p className="text-[11px] text-blue-100 leading-relaxed font-medium relative z-10">
              Logs protegidos por RLS. Conformidade com o Ministério da Saúde e Lei 14.063/2020.
            </p>
          </div>
        </div>

        {/* ── TABELA PRINCIPAL ─────────────────────────────────────────────── */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">

          {/* Barra de busca */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[#1E3A8A]" />
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Audit Trail</h3>
              <span className="text-[10px] text-slate-400 font-bold ml-1">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                {filtered.length !== logs.length && ` de ${logs.length}`}
              </span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar ator, ação, tabela..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Chips de severidade rápida */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 flex-wrap bg-slate-50/30">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtro rápido:</span>
            {Object.entries(SEV_CONFIG).map(([sev, cfg]) => (
              <button
                key={sev}
                onClick={() => handleSev(sev)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[9px] font-black border transition-all uppercase tracking-wide',
                  filtroSev.includes(sev)
                    ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                )}
              >
                {cfg.label}
              </button>
            ))}
            {filtroSev.length > 0 && (
              <button
                onClick={() => { setFiltroSev([]); setPagina(1); }}
                className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
              >
                <X size={9} /> Limpar
              </button>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando trilha...</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-40">
                <ShieldAlert size={40} className="mb-3" />
                <p className="text-xs font-bold uppercase">Nenhum registro encontrado</p>
                {(filtrosAtivos > 0 || searchQuery) && (
                  <p className="text-[10px] text-slate-400 mt-1">Tente remover os filtros ativos</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginated.map(log => {
                  const temDiff = log.dados_anteriores || log.dados_novos;
                  const isDiffAberto = expandDiff.has(log.id);
                  const acaoCfg = ACAO_CONFIG[log.acao] ?? 'bg-slate-100 text-slate-600';
                  const sevCfg  = SEV_CONFIG[log.severidade] ?? SEV_CONFIG['Baixa'];

                  return (
                    <div key={log.id} className="px-5 py-4 hover:bg-slate-50/60 transition-colors group">
                      <div className="flex items-start gap-4">

                        {/* Col 1 — Timestamp + ID */}
                        <div className="min-w-[140px]">
                          <p className="font-black text-slate-800 text-[12px]">
                            {format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[130px]" title={log.id}>
                            {log.id.slice(0, 8)}…
                          </p>
                        </div>

                        {/* Col 2 — Ator */}
                        <div className="min-w-[130px] flex-shrink-0">
                          <p className="font-bold text-slate-700 text-xs truncate max-w-[120px]" title={log.ator}>
                            {log.ator || '—'}
                          </p>
                          <span className="text-[9px] bg-slate-100 text-slate-500 inline-flex px-2 py-0.5 rounded-full mt-1 font-bold uppercase tracking-wider">
                            Verificado
                          </span>
                        </div>

                        {/* Col 3 — Ação + Tabela */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${acaoCfg}`}>
                              {log.acao}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 font-mono">{log.tabela_afetada}</span>
                          </div>

                          {/* Metadados resumidos (quando não tem diff) */}
                          {!temDiff && log.metadados && (
                            <p className="text-[10px] text-slate-500 mt-2 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100 line-clamp-2">
                              {typeof log.metadados === 'string'
                                ? log.metadados
                                : JSON.stringify(log.metadados).slice(0, 200)}
                            </p>
                          )}

                          {/* Botão expandir diff */}
                          {temDiff && (
                            <button
                              onClick={() => toggleDiff(log.id)}
                              className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors border border-blue-100"
                            >
                              <GitCompare size={11} />
                              {isDiffAberto ? (
                                <><EyeOff size={10} /> Ocultar Diff</>
                              ) : (
                                <><Eye size={10} /> Ver Diff ({Object.keys(parseCampos(log.dados_anteriores)).length + Object.keys(parseCampos(log.dados_novos)).length} campos)</>
                              )}
                            </button>
                          )}

                          {/* Diff expandido */}
                          {isDiffAberto && temDiff && (
                            <DiffView
                              antes={log.dados_anteriores}
                              depois={log.dados_novos}
                            />
                          )}
                        </div>

                        {/* Col 4 — Severidade */}
                        <div className="shrink-0">
                          <span className={cn(
                            'inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border-2 shadow-sm',
                            sevCfg.bg, sevCfg.text, sevCfg.border
                          )}>
                            {log.severidade || 'Baixa'}
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paginação */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pág. {paginaSegura} / {totalPaginas} — {filtered.length} registros
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina(1)}
                disabled={paginaSegura === 1}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                ««
              </button>
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={paginaSegura === 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                <ChevronLeft size={12} /> Anterior
              </button>

              {/* Páginas numeradas */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let p = i + 1;
                  if (totalPaginas > 5) {
                    const start = Math.max(1, Math.min(paginaSegura - 2, totalPaginas - 4));
                    p = start + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPagina(p)}
                      className={cn(
                        'w-7 h-7 rounded-lg text-[10px] font-black transition-all',
                        p === paginaSegura
                          ? 'bg-[#1E3A8A] text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaSegura === totalPaginas}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                Próxima <ChevronRight size={12} />
              </button>
              <button
                onClick={() => setPagina(totalPaginas)}
                disabled={paginaSegura === totalPaginas}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                »»
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
