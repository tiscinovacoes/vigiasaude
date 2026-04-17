'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  FileText,
  X,
  Upload,
  ExternalLink,
  ClipboardList,
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

type Receita = {
  id: string;
  medicamento_nome: string;
  catmat_codigo_br: string | null;
  data_inicio: string;
  data_fim: string | null;
  frequencia_uso: string;
  medico_nome: string | null;
  numero_receita: string | null;
  observacoes: string | null;
  arquivo_url: string | null;
  created_at: string;
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

// ─── Modal de Nova Receita ────────────────────────────────────────────────────

type CatmatItem = {
  codigo_br: string;
  descricao: string;
  unidade_fornecimento: string | null;
};

function ModalNovaReceita({
  paciente,
  onClose,
  onSaved,
}: {
  paciente: Paciente;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [medicamento,    setMedicamento]    = useState('');
  const [dataInicio,     setDataInicio]     = useState('');
  const [dataFim,        setDataFim]        = useState('');
  const [frequencia,     setFrequencia]     = useState('UM_DIA');
  const [medico,         setMedico]         = useState('');
  const [numero,         setNumero]         = useState('');
  const [obs,            setObs]            = useState('');
  const [arquivo,        setArquivo]        = useState<File | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [erro,           setErro]           = useState<string | null>(null);

  // ── Métricas calculadas ──────────────────────────────────────────────────
  const FREQ_LABEL: Record<string, string> = {
    UM_DIA:      '1 vez ao dia',
    DOIS_DIA:    '2 vezes ao dia',
    TRES_DIA:    '3 vezes ao dia',
    QUATRO_DIA:  '4 vezes ao dia',
    UMA_SEMANA:  '1 vez na semana',
    DUAS_SEMANA: '2 vezes na semana',
    QUINZENAL:   '1 vez a cada 15 dias',
    MENSAL:      '1 vez ao mês',
    OUTRO:       'Outro (ver observações)',
  };
  const FREQ_DIARIO: Record<string, number | null> = {
    UM_DIA:      1,
    DOIS_DIA:    2,
    TRES_DIA:    3,
    QUATRO_DIA:  4,
    UMA_SEMANA:  1 / 7,
    DUAS_SEMANA: 2 / 7,
    QUINZENAL:   1 / 15,
    MENSAL:      1 / 30,
    OUTRO:       null,
  };
  const metricas = useMemo(() => {
    const diario = FREQ_DIARIO[frequencia];
    if (!dataInicio || !diario) return null;
    const inicio = new Date(dataInicio);
    const proxEntrega = new Date(inicio); proxEntrega.setDate(proxEntrega.getDate() + 30);
    const prazoCompra = new Date(inicio); prazoCompra.setDate(prazoCompra.getDate() + 15);
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (dataFim) {
      const fim  = new Date(dataFim);
      const dias = Math.ceil((fim.getTime() - inicio.getTime()) / 86_400_000);
      const qtd  = Math.ceil(dias * diario);
      return { consumoDiario: diario, duracao: dias, qtdTotal: qtd, proxEntrega: fmt(proxEntrega), prazoCompra: fmt(prazoCompra) };
    }
    return { consumoDiario: diario, duracao: null, qtdTotal: null, proxEntrega: fmt(proxEntrega), prazoCompra: fmt(prazoCompra) };
  }, [dataInicio, dataFim, frequencia]);

  // Autocomplete CATMAT
  const [catmatQuery,    setCatmatQuery]    = useState('');
  const [catmatItems,    setCatmatItems]    = useState<CatmatItem[]>([]);
  const [catmatLoading,  setCatmatLoading]  = useState(false);
  const [showDropdown,   setShowDropdown]   = useState(false);
  const [catmatSelected, setCatmatSelected] = useState<CatmatItem | null>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const fileRef      = useRef<HTMLInputElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Busca com debounce
  const doBusca = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setCatmatItems([]); setShowDropdown(false); return; }
    setCatmatLoading(true);
    const items = await api.buscarCatmat(q);
    setCatmatItems(items);
    setShowDropdown(true);
    setCatmatLoading(false);
  }, []);

  function handleMedicamentoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setCatmatQuery(v);
    setMedicamento(v);
    setCatmatSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doBusca(v), 300);
  }

  function handleSelectCatmat(item: CatmatItem) {
    const label = item.unidade_fornecimento
      ? `${item.descricao} (${item.codigo_br}) — ${item.unidade_fornecimento}`
      : `${item.descricao} (${item.codigo_br})`;
    setMedicamento(label);
    setCatmatQuery(label);
    setCatmatSelected(item);
    setCatmatItems([]);
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicamento.trim()) { setErro('Informe o medicamento.'); return; }
    if (!dataInicio)         { setErro('Informe a data de início do uso.'); return; }
    if (dataFim && dataFim < dataInicio) { setErro('A data de término não pode ser anterior à data de início.'); return; }
    setSaving(true);
    setErro(null);
    const res = await api.salvarReceita({
      paciente_id:      paciente.id,
      medicamento_nome: medicamento.trim(),
      catmat_codigo_br: catmatSelected?.codigo_br || undefined,
      data_inicio:      dataInicio,
      data_fim:         dataFim        || undefined,
      frequencia_uso:   frequencia,
      medico_nome:      medico.trim()  || undefined,
      numero_receita:   numero.trim()  || undefined,
      observacoes:      obs.trim()     || undefined,
      arquivo,
    });
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
    else        { setErro(res.error ?? 'Erro ao salvar receita.'); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-[#1A2B6D]" />
            <h2 className="text-base font-black text-slate-900">Nova Receita Médica</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Paciente — readonly */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Paciente
            </label>
            <div className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-sm text-slate-500 font-medium select-none">
              {paciente.nome_completo}
            </div>
          </div>

          {/* Medicamento — Autocomplete CATMAT */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Medicamento <span className="text-red-500">*</span>
              <span className="ml-1.5 text-slate-300 font-normal normal-case">— busque por nome ou código BR</span>
            </label>
            <div ref={wrapperRef} className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={catmatQuery}
                  onChange={handleMedicamentoChange}
                  onKeyDown={e => { if (e.key === 'Escape') setShowDropdown(false); }}
                  onFocus={() => { if (catmatItems.length > 0) setShowDropdown(true); }}
                  placeholder="Ex: Metformina ou BR0268315"
                  autoComplete="off"
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A2B6D]/30 focus:border-[#1A2B6D]"
                />
                {catmatLoading && (
                  <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-slate-400" />
                )}
              </div>

              {/* Badge CATMAT selecionado */}
              {catmatSelected && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1A2B6D]/10 text-[#1A2B6D] text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={10} />
                    CATMAT · {catmatSelected.codigo_br}
                  </span>
                  {catmatSelected.unidade_fornecimento && (
                    <span className="text-[10px] text-slate-400">{catmatSelected.unidade_fornecimento}</span>
                  )}
                </div>
              )}

              {/* Dropdown resultados */}
              {showDropdown && catmatItems.length > 0 && (
                <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-50">
                  {catmatItems.map(item => (
                    <li key={item.codigo_br}>
                      <button
                        type="button"
                        onMouseDown={e => { e.preventDefault(); handleSelectCatmat(item); }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-[10px] font-black text-[#1A2B6D] bg-[#1A2B6D]/10 px-1.5 py-0.5 rounded-md">
                            {item.codigo_br}
                          </span>
                          <span className="text-sm text-slate-800 font-medium leading-tight truncate">
                            {item.descricao}
                          </span>
                        </div>
                        {item.unidade_fornecimento && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {item.unidade_fornecimento}
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Sem resultados */}
              {showDropdown && catmatItems.length === 0 && !catmatLoading && catmatQuery.trim().length >= 2 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl px-4 py-3 text-sm text-slate-400">
                  Nenhum medicamento encontrado — você pode digitar manualmente.
                </div>
              )}
            </div>
          </div>

          {/* Período de uso */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Período de uso <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold">Início</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1A2B6D]/30 focus:border-[#1A2B6D]"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold">Término <span className="font-normal">(opcional)</span></span>
                <input
                  type="date"
                  value={dataFim}
                  min={dataInicio || undefined}
                  onChange={e => setDataFim(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1A2B6D]/30 focus:border-[#1A2B6D]"
                />
              </div>
            </div>
            {!dataFim && dataInicio && (
              <p className="mt-1 text-[10px] text-slate-400">
                Sem data de término = tratamento contínuo / uso prolongado.
              </p>
            )}
          </div>

          {/* Frequência de uso */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Frequência de uso <span className="text-red-500">*</span>
            </label>
            <select
              value={frequencia}
              onChange={e => setFrequencia(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1A2B6D]/30 focus:border-[#1A2B6D] appearance-none cursor-pointer"
            >
              <option value="UM_DIA">1 vez ao dia</option>
              <option value="DOIS_DIA">2 vezes ao dia</option>
              <option value="TRES_DIA">3 vezes ao dia</option>
              <option value="QUATRO_DIA">4 vezes ao dia</option>
              <option value="UMA_SEMANA">1 vez na semana</option>
              <option value="DUAS_SEMANA">2 vezes na semana</option>
              <option value="QUINZENAL">1 vez a cada 15 dias</option>
              <option value="MENSAL">1 vez ao mês</option>
              <option value="OUTRO">Outro (descrever em observações)</option>
            </select>
          </div>

          {/* Painel de métricas de estoque */}
          {metricas && (
            <div className="rounded-xl border border-[#1A2B6D]/20 bg-[#1A2B6D]/5 px-4 py-3 space-y-2">
              <p className="text-[10px] font-black text-[#1A2B6D] uppercase tracking-widest">Estimativa de Estoque</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                <div>
                  <span className="text-slate-400">Consumo/dia:</span>{' '}
                  <span className="font-bold text-slate-700">
                    {metricas.consumoDiario >= 1
                      ? `${metricas.consumoDiario} un.`
                      : `${(1 / metricas.consumoDiario).toFixed(0)} dias/un.`}
                  </span>
                </div>
                {metricas.duracao != null && (
                  <div>
                    <span className="text-slate-400">Duração:</span>{' '}
                    <span className="font-bold text-slate-700">{metricas.duracao} dias</span>
                  </div>
                )}
                {metricas.qtdTotal != null && (
                  <div>
                    <span className="text-slate-400">Qtd. total:</span>{' '}
                    <span className="font-bold text-slate-700">{metricas.qtdTotal} un.</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Próx. entrega:</span>{' '}
                  <span className="font-bold text-slate-700">{metricas.proxEntrega}</span>
                </div>
                <div>
                  <span className="text-slate-400">Prazo compra:</span>{' '}
                  <span className="font-bold text-amber-600">{metricas.prazoCompra}</span>
                </div>
              </div>
            </div>
          )}

          {/* Médico (opcional) */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Médico responsável <span className="text-slate-300 font-normal normal-case">(opcional)</span>
            </label>
            <input
              type="text"
              value={medico}
              onChange={e => setMedico(e.target.value)}
              placeholder="Dr. João Silva"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A2B6D]/30 focus:border-[#1A2B6D]"
            />
          </div>

          {/* Nº da receita (opcional) */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Nº da receita <span className="text-slate-300 font-normal normal-case">(opcional)</span>
            </label>
            <input
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              placeholder="Ex: 2024-00412"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A2B6D]/30 focus:border-[#1A2B6D]"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Observações <span className="text-slate-300 font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              rows={3}
              placeholder="Informações adicionais da prescrição..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A2B6D]/30 focus:border-[#1A2B6D] resize-none"
            />
          </div>

          {/* Upload de arquivo */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Receita digitalizada <span className="text-slate-300 font-normal normal-case">(PDF ou imagem, máx. 10 MB)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={e => setArquivo(e.target.files?.[0] ?? null)}
            />
            {arquivo ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50">
                <FileText size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-medium text-emerald-700 truncate flex-1">{arquivo.name}</span>
                <button
                  type="button"
                  onClick={() => { setArquivo(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-emerald-400 hover:text-emerald-700 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1A2B6D]/40 hover:bg-slate-50 transition-colors"
              >
                <Upload size={18} className="text-slate-300" />
                <span className="text-xs text-slate-400 font-medium">Clique para selecionar arquivo</span>
              </button>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">
              {erro}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl font-bold text-slate-600"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            onClick={handleSubmit as any}
            className="rounded-xl font-black bg-[#1A2B6D] hover:bg-[#121f4f] text-white gap-2 px-6"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <ClipboardList size={15} />}
            {saving ? 'Salvando…' : 'Salvar Receita'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PacienteDetalhes() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const [loading,         setLoading]         = useState(true);
  const [paciente,        setPaciente]        = useState<Paciente | null>(null);
  const [analytics,       setAnalytics]       = useState<Analytics>({ investimentoTotal: 0, recalls: [], adesao: 0 });
  const [timeline,        setTimeline]        = useState<TimelineItem[]>([]);
  const [prescricoes,     setPrescricoes]     = useState<Prescricao[]>([]);
  const [receitas,        setReceitas]        = useState<Receita[]>([]);
  const [expandedItem,    setExpandedItem]    = useState<string | null>(null);
  const [showModalReceita, setShowModalReceita] = useState(false);

  // ── Carregar ──────────────────────────────────────────────────────────────
  async function carregarDados() {
    if (!id) return;
    setLoading(true);
    try {
      const [pac, ana, tl, presc, rec] = await Promise.all([
        api.getPacienteById(id),
        api.getPacienteAnalytics(id),
        api.getTimelineDispensacoes(id),
        api.getPrescricoesByPaciente(id),
        api.getReceitasByPaciente(id),
      ]);
      setPaciente(pac);
      setAnalytics(ana ?? { investimentoTotal: 0, recalls: [], adesao: 0 });
      setTimeline(tl ?? []);
      setPrescricoes(presc ?? []);
      setReceitas((rec ?? []) as unknown as Receita[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarDados(); }, [id]);

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

      {/* ── MODAL NOVA RECEITA ─────────────────────────────────────────────── */}
      {showModalReceita && (
        <ModalNovaReceita
          paciente={paciente}
          onClose={() => setShowModalReceita(false)}
          onSaved={() => carregarDados()}
        />
      )}

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

        {/* Botão Nova Receita */}
        <Button
          onClick={() => setShowModalReceita(true)}
          className="font-black rounded-xl h-11 px-6 gap-2 bg-[#1A2B6D] hover:bg-[#121f4f] text-white shadow-lg shrink-0"
        >
          <ClipboardList size={16} />
          Nova Receita
        </Button>
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

      {/* ── RECEITAS CADASTRADAS ──────────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-3">
          <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
            <ClipboardList size={15} className="text-[#1A2B6D]"/> Receitas Cadastradas
            <Badge className="bg-slate-100 text-slate-500 border-none shadow-none text-[10px] font-black ml-1">
              {receitas.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {receitas.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="font-bold text-sm">Nenhuma receita cadastrada</p>
              <p className="text-xs mt-1">Clique em "Nova Receita" para registrar.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {receitas.map(r => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 truncate">{r.medicamento_nome}</p>
                      {r.numero_receita && (
                        <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-mono shrink-0">
                          #{r.numero_receita}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Início: {fmtDate(r.data_inicio)}
                      {r.data_fim ? ` · Término: ${fmtDate(r.data_fim)}` : ' · Contínuo'}
                      {r.medico_nome && ` · ${r.medico_nome}`}
                    </p>
                    {r.observacoes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">{r.observacoes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {r.arquivo_url ? (
                      <a
                        href={r.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2B6D] hover:underline underline-offset-2"
                      >
                        <FileText size={13}/>
                        Ver arquivo
                        <ExternalLink size={11}/>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-300 italic">Sem arquivo</span>
                    )}
                    <span className="text-[10px] text-slate-300">
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
