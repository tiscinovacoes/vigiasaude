'use client';

import { Suspense, useState, useEffect, Fragment, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  Plus,
  ArrowDownToLine,
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  DollarSign,
  Loader2,
  X,
  Layers,
  Calendar,
  CheckCircle,
  Truck,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  CheckCircle2,
  Info,
  Timer,
  Shield,
  Keyboard,
  Hash,
  Command,
  FileText,
  PackagePlus,
  ClipboardList,
  ScanBarcode,
  ArrowLeftCircle,
  User,
  Building2,
  CalendarClock,
  UploadCloud,
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, recallAPI, Medicamento, Lote } from '@/lib/api';
import { toast } from "sonner";
import { cn } from '@/lib/utils';

type ValidacaoPreco = {
  cmed: { valido: boolean; teto: number; percentual: number };
  bps: { valido: boolean | null; referencia: number | null; percentual: number | null };
  status: 'OK' | 'ALERTA_BPS' | 'ALERTA_CMED';
} | null;

function EstoqueContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [rupturaMap, setRupturaMap] = useState<Record<string, { dias: number; status: string }>>({});
  const [busca, setBusca] = useState("");
  const [expandedMeds, setExpandedMeds] = useState<Set<string>>(new Set());
  
  // Modais
  const [showNovoMedicamento, setShowNovoMedicamento] = useState(false);
  const [showNovaEntrada, setShowNovaEntrada] = useState(false);
  const [showRegistrarSaida, setShowRegistrarSaida] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAlertaSeguranca, setShowAlertaSeguranca] = useState(false);
  const cmdInputRef = useRef<HTMLInputElement>(null);
  const [cmdBusca, setCmdBusca] = useState('');
  const [serialMode, setSerialMode] = useState(false);
  const [serialLoading, setSerialLoading] = useState(false);
  const [catmatImporting, setCatmatImporting] = useState(false);
  const catmatFileInputRef = useRef<HTMLInputElement>(null);
  const [serialResult, setSerialResult] = useState<{
    serial_number: string; status: string; lote_codigo: string;
    data_validade: string; custo_unitario: number; medicamento_nome: string;
    fornecedor_nome: string | null; paciente_cpf: string | null;
    paciente_nome: string | null; data_dispensacao: string | null;
  } | null | 'NOT_FOUND'>(null);
  
  // States para Formulários
  const [formMedicamento, setFormMedicamento] = useState({
    nome: '', dosagem: '', preco_teto_cmed: ''
  });
  const [suggestoes, setSuggestoes] = useState<Medicamento[]>([]);
  const [suggestoesCmed, setSuggestoesCmed] = useState<{ produto: string; apresentacao: string | null; substancia: string | null; laboratorio: string | null; pmc_17: number | null; pf_17: number | null; classe_terapeutica: string | null; catmat_codigo: string | null }[]>([]);
  const [showSuggestoes, setShowSuggestoes] = useState(false);
  const [medExistente, setMedExistente] = useState<Medicamento | null>(null);
  const [fornecedores, setFornecedores] = useState<{ id: string; razao_social: string }[]>([]);
  const [formEntrada, setFormEntrada] = useState({
    med_id: '', lote: '', validade: '', qtd: '', preco: '', fornecedor_id: ''
  });
  const [formSaida, setFormSaida] = useState({
    lote_id: '', qtd: '', motivo: 'Dispensação Manual', destino: '', justificativa_fefo: ''
  });
  const [validacaoEntrada, setValidacaoEntrada] = useState<ValidacaoPreco>(null);
  const [validando, setValidando] = useState(false);

  // States para autocomplete da Nova Entrada
  const [buscaEntrada, setBuscaEntrada] = useState('');
  const [suggestoesEntrada, setSuggestoesEntrada] = useState<Medicamento[]>([]);
  const [suggestoesCmedEntrada, setSuggestoesCmedEntrada] = useState<{ produto: string; apresentacao: string | null; substancia: string | null; laboratorio: string | null; pmc_17: number | null; pf_17: number | null; classe_terapeutica: string | null; catmat_codigo: string | null }[]>([]);
  const [showSuggestoesEntrada, setShowSuggestoesEntrada] = useState(false);
  const [entradaMedNome, setEntradaMedNome] = useState('');

  // States para Saída FEFO-aware
  const [saidaMedId, setSaidaMedId] = useState('');
  const [saidaBuscaMed, setSaidaBuscaMed] = useState('');
  const saidaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    api.getFornecedores().then(list =>
      setFornecedores(list.map(f => ({ id: f.id, razao_social: f.razao_social })))
    ).catch(() => {});
  }, []);

  // Ctrl+K Command Palette shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setCmdBusca('');
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus command palette input when opened
  useEffect(() => {
    if (showCommandPalette && cmdInputRef.current) {
      setTimeout(() => cmdInputRef.current?.focus(), 50);
    }
  }, [showCommandPalette]);

  // FEFO lot computation for the selected medication on Saída
  const saidaMed = useMemo(() => medicamentos.find(m => m.id === saidaMedId), [medicamentos, saidaMedId]);
  const lotesFefo = useMemo(() => {
    if (!saidaMed?.lotes) return [];
    return [...saidaMed.lotes]
      .filter(l => l.quantidade_disponivel > 0)
      .sort((a, b) => new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime());
  }, [saidaMed]);
  const fefoLoteId = lotesFefo.length > 0 ? lotesFefo[0].id : null;
  const isFefoViolation = formSaida.lote_id && fefoLoteId && formSaida.lote_id !== fefoLoteId;

  // Command palette actions
  const handleSerialSearch = useCallback(async (serial: string) => {
    const trimmed = serial.trim();
    if (!trimmed) return;
    setSerialLoading(true);
    setSerialResult(null);
    try {
      const result = await recallAPI.rastrearPorSerial(trimmed);
      setSerialResult(result ?? 'NOT_FOUND');
    } catch {
      setSerialResult('NOT_FOUND');
    } finally {
      setSerialLoading(false);
    }
  }, []);

  const commandActions = useMemo(() => [
    { id: 'rastrear-sn', label: 'Rastrear S/N', desc: 'Rastrear serial number de unidade', icon: ScanBarcode, action: () => { setSerialMode(true); setSerialResult(null); setCmdBusca(''); setTimeout(() => cmdInputRef.current?.focus(), 50); } },
    { id: 'novo-med', label: 'Novo Medicamento', desc: 'Cadastrar um novo medicamento', icon: Plus, action: () => { setShowNovoMedicamento(true); setShowCommandPalette(false); } },
    { id: 'nova-entrada', label: 'Nova Entrada', desc: 'Registrar entrada de lote', icon: PackagePlus, action: () => { setShowNovaEntrada(true); setShowCommandPalette(false); } },
    { id: 'reg-saida', label: 'Registrar Saída', desc: 'Baixa manual de lote (FEFO)', icon: ArrowDownToLine, action: () => { setShowRegistrarSaida(true); setShowCommandPalette(false); } },
    { id: 'buscar', label: 'Buscar Medicamento', desc: 'Pesquisar no estoque', icon: Search, action: () => { document.querySelector<HTMLInputElement>('[placeholder*="Pesquisar"]')?.focus(); setShowCommandPalette(false); } },
  ], []);
  const filteredCommands = commandActions.filter(a =>
    a.label.toLowerCase().includes(cmdBusca.toLowerCase()) ||
    a.desc.toLowerCase().includes(cmdBusca.toLowerCase())
  );

  const validarPrecoEntrada = useCallback(async (medId: string, preco: string) => {
    const v = parseFloat(preco.replace(',', '.'));
    if (!medId || !v || v <= 0) { setValidacaoEntrada(null); return; }
    setValidando(true);
    try {
      const resultado = await api.validarPrecoCompleto(medId, v);
      setValidacaoEntrada(resultado);
    } finally {
      setValidando(false);
    }
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [data, ruptura] = await Promise.all([
        api.getEstoqueBase(),
        api.getRiscoRuptura().catch(() => []),
      ]);
      setMedicamentos(data);
      const map: Record<string, { dias: number; status: string }> = {};
      ruptura.forEach(r => {
        map[r.medicamento_id] = { dias: r.dias_restantes_estoque, status: r.status_logistico };
      });
      setRupturaMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expandedMeds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedMeds(next);
  };

  const filtered = medicamentos.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
  );

  async function handleNovoMedicamento() {
    if (!formMedicamento.nome || !formMedicamento.preco_teto_cmed) {
      toast.error("Preencha os campos obrigatórios (Nome e Preço Teto)");
      return;
    }
    const res = await api.createMedicamento({
      nome: formMedicamento.nome,
      dosagem: formMedicamento.dosagem || undefined,
      estoque_minimo: 0,
      preco_teto_cmed: Number(formMedicamento.preco_teto_cmed),
    });

    if (res.success) {
      toast.success("Medicamento cadastrado com sucesso!");
      setShowNovoMedicamento(false);
      setSuggestoes([]); setMedExistente(null);
      setFormMedicamento({ nome: '', dosagem: '', preco_teto_cmed: '' });
      loadData();
    } else {
      toast.error("Erro ao cadastrar: " + res.error);
    }
  }

  async function handleEntrada() {
    if (!formEntrada.med_id || !formEntrada.lote || !formEntrada.qtd || !formEntrada.preco) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const res = await api.registrarEntrada({
      medicamento_id: formEntrada.med_id,
      codigo_lote: formEntrada.lote,
      data_validade: formEntrada.validade,
      quantidade: Number(formEntrada.qtd),
      custo_unitario: Number(formEntrada.preco),
      ...(formEntrada.fornecedor_id ? { fornecedor_id: formEntrada.fornecedor_id } : {}),
    });

    if (res.success) {
      toast.success("Entrada registrada e auditada com sucesso!");
      setShowNovaEntrada(false);
      setFormEntrada({ med_id: '', lote: '', validade: '', qtd: '', preco: '', fornecedor_id: '' });
      setValidacaoEntrada(null);
      setEntradaMedNome('');
      setBuscaEntrada('');
      loadData();
    } else {
      toast.error("Erro na transação: " + res.error);
    }
  }

  async function handleSaida() {
    if (!formSaida.lote_id || !formSaida.qtd) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (isFefoViolation && !formSaida.justificativa_fefo.trim()) {
      toast.error("Justificativa obrigatória ao pular a ordem FEFO");
      return;
    }
    // Show security confirmation modal
    setShowAlertaSeguranca(true);
  }

  async function confirmarSaida() {
    setShowAlertaSeguranca(false);
    const motivo = isFefoViolation
      ? `${formSaida.motivo} [FEFO OVERRIDE: ${formSaida.justificativa_fefo}]`
      : formSaida.motivo;
    const res = await api.registrarSaida({
      lote_id: formSaida.lote_id,
      quantidade: Number(formSaida.qtd),
      motivo,
      destino: formSaida.destino
    });

    if (res.success) {
      toast.success("Baixa de estoque concluída com sucesso.");
      setShowRegistrarSaida(false);
      setFormSaida({ lote_id: '', qtd: '', motivo: 'Dispensação Manual', destino: '', justificativa_fefo: '' });
      setSaidaMedId('');
      setSaidaBuscaMed('');
      loadData();
    } else {
      toast.error("Erro: " + res.error);
    }
  }

  async function handleCatmatImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCatmatImporting(true);
    const toastId = toast.loading('Importando CATMAT...');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/catmat/import', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`CATMAT: ${json.inseridos} itens importados`, { id: toastId });
      } else {
        toast.error(json.error ?? 'Erro ao importar CATMAT', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Erro de conexão: ' + (err.message ?? ''), { id: toastId });
    } finally {
      setCatmatImporting(false);
    }
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestão de Estoque Tático</h1>
          <p className="text-slate-500 text-sm font-medium">Controle FEFO e conformidade financeira CMED</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <Button 
            onClick={() => setShowNovoMedicamento(true)}
            className="bg-[#1A2B6D] hover:bg-[#121f4f] text-white font-black h-11 px-6 rounded-xl shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Medicamento
          </Button>
          <Button 
            onClick={() => setShowNovaEntrada(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 px-6 rounded-xl shadow-lg shadow-emerald-100"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Entrada
          </Button>
          <Button 
            onClick={() => setShowRegistrarSaida(true)}
            variant="outline" 
            className="border-blue-900 text-blue-900 hover:bg-blue-50 font-black h-11 px-6 rounded-xl"
          >
            <ArrowDownToLine className="w-5 h-5 mr-2" />
            Registrar Saída
          </Button>
          {/* Importar CATMAT */}
          <input
            ref={catmatFileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCatmatImport}
          />
          <Button
            onClick={() => catmatFileInputRef.current?.click()}
            disabled={catmatImporting}
            variant="outline"
            className="border-purple-600 text-purple-700 hover:bg-purple-50 font-black h-11 px-6 rounded-xl"
          >
            {catmatImporting
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <UploadCloud className="w-4 h-4 mr-2" />
            }
            Importar CATMAT
          </Button>
        </div>
      </div>

      {/* Busca e Filtros */}
      <Card className="shadow-sm border-none bg-white">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Pesquisar medicamento, lote ou SKU..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-11 h-12 bg-slate-50 border-slate-100 rounded-xl focus-visible:ring-[#1E3A8A]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-none bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-2">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Calculando Balanço...</span>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="w-10"></th>
                    <th className="text-left py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Medicamento</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Lote</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Validade</th>
                    <th className="text-right py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Qtd. Atual</th>
                    <th className="text-right py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Est. Mínimo</th>
                    <th className="text-right py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Dias Cobertura</th>
                    <th className="text-center py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((med) => {
                    const lotesAtivos = (med.lotes || []).filter((l: any) => l.quantidade_disponivel > 0);
                    const lotesOrdenados = [...lotesAtivos].sort((a: any, b: any) =>
                      new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime()
                    );
                    const totalDisp = (med.lotes || []).reduce((s: number, l: any) => s + (l.quantidade_disponivel || 0), 0);
                    const totalLotes = (med.lotes || []).length;
                    const isExpanded = expandedMeds.has(med.id);
                    const hasMultiple = lotesOrdenados.length > 1;
                    const fefoLote = lotesOrdenados[0];
                    const ruptura = rupturaMap[med.id];
                    const diasCobertura = ruptura?.dias ?? null;
                    const statusLogistico = ruptura?.status ?? '';
                    const semConsumo = statusLogistico === 'SEM_CONSUMO' || med.estoque_minimo === 0;

                    // Status derivado direto da view (já considera lead time)
                    const isCritico = !semConsumo && (statusLogistico === 'CRITICO' || (!statusLogistico && totalDisp < med.estoque_minimo));
                    const isAtencao = !semConsumo && !isCritico && statusLogistico === 'ATENCAO';

                    const statusBadge = semConsumo
                      ? { label: 'Sem prescrição', cls: 'bg-slate-100 text-slate-500 border border-slate-200' }
                      : isCritico
                      ? { label: 'Crítico', cls: 'bg-red-50 text-red-700 border border-red-200' }
                      : isAtencao
                      ? { label: 'Atenção', cls: 'bg-amber-50 text-amber-700 border border-amber-200' }
                      : { label: 'Normal', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };

                    return (
                      <Fragment key={med.id}>
                        <tr
                          className={cn('border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer',
                            !semConsumo && isCritico && 'bg-red-50/20'
                          )}
                          onClick={() => {
                            toggleExpand(med.id);
                            router.push(`/dashboard/estoque/${med.id}`);
                          }}
                        >
                          <td className="py-4 px-4 text-center">
                            {totalLotes > 1
                              ? isExpanded
                                ? <ChevronDown size={14} className="text-blue-600 mx-auto"/>
                                : <ChevronRight size={14} className="text-slate-400 mx-auto"/>
                              : null
                            }
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 leading-tight">{med.nome}</span>
                              {totalLotes > 1 && (
                                <Badge className="bg-blue-50 text-blue-600 border-none shadow-none text-[9px] font-black px-1.5">
                                  {totalLotes} lotes
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-500 font-mono">
                            {hasMultiple ? '—' : fefoLote ? fefoLote.codigo_lote_fabricante : '—'}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-500">
                            {hasMultiple ? '—' : fefoLote?.data_validade
                              ? new Date(fefoLote.data_validade).toLocaleDateString('pt-BR')
                              : '—'
                            }
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className={cn('text-sm font-black', isCritico ? 'text-red-600' : 'text-slate-900')}>
                              {totalDisp}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-sm text-slate-500 font-mono">{med.estoque_minimo}</td>
                          <td className="py-4 px-4 text-right">
                            {semConsumo ? (
                              <span className="text-sm text-slate-300">—</span>
                            ) : diasCobertura !== null ? (
                              <span
                                title="Dias de cobertura já descontado o lead time de entrega do fornecedor"
                                className={cn('text-sm font-black',
                                  diasCobertura <= 0 ? 'text-red-600' : diasCobertura <= 30 ? 'text-amber-600' : 'text-slate-700'
                                )}
                              >
                                {diasCobertura}d
                              </span>
                            ) : (
                              <span className="text-sm text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge className={cn('shadow-none text-[9px] font-black uppercase px-2 py-0.5', statusBadge.cls)}>
                              {isCritico && <AlertTriangle size={9} className="inline mr-1" />}
                              {statusBadge.label}
                            </Badge>
                          </td>
                        </tr>

                        {isExpanded && (med.lotes || []).sort((a: any, b: any) =>
                          new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime()
                        ).map((l: any) => (
                          <tr key={l.id} className="bg-slate-50/50 border-b border-slate-100">
                            <td></td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <Layers size={11} className="text-blue-400 shrink-0"/>
                                <span className="text-xs text-slate-500 font-medium">Lote individual</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono text-slate-600 font-bold">{l.codigo_lote_fabricante}</td>
                            <td className="py-3 px-4 text-xs text-slate-600">
                              {l.data_validade ? new Date(l.data_validade).toLocaleDateString('pt-BR') : '—'}
                            </td>
                            <td className="py-3 px-4 text-right text-xs font-black text-slate-700">{l.quantidade_disponivel} un</td>
                            <td className="py-3 px-4 text-right text-xs text-slate-400">—</td>
                            <td className="py-3 px-4 text-right">
                              <span className={cn('text-[10px] font-mono font-bold',
                                (l.custo_unitario ?? 0) > med.preco_teto_cmed ? 'text-red-500' : 'text-slate-500'
                              )}>
                                R$ {l.custo_unitario?.toFixed(2) ?? '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className="bg-white border border-slate-200 text-slate-400 text-[8px] font-black uppercase shadow-none">
                                {l.status || 'ATIVO'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal - Novo Medicamento */}
      {showNovoMedicamento && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1001] p-4" onClick={() => { setShowNovoMedicamento(false); setSuggestoes([]); setMedExistente(null); }}>
          <Card className="w-full max-w-lg shadow-2xl bg-white border-0" onClick={e => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-100">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                     <Plus className="text-[#1A2B6D]"/> NOVO MEDICAMENTO
                  </CardTitle>
                  <button onClick={() => { setShowNovoMedicamento(false); setSuggestoes([]); setMedExistente(null); }} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">

               {/* Banner medicamento existente selecionado */}
               {medExistente && (
                 <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                   <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                   <div>
                     <p className="text-[10px] font-black text-blue-700 uppercase">Medicamento já cadastrado</p>
                     <p className="text-xs text-blue-600 font-medium">Valores CMED e BPS já configurados foram pré-preenchidos. Você pode ajustá-los.</p>
                   </div>
                 </div>
               )}

               {/* Campo nome com autocomplete */}
               <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Nome do Medicamento *</label>
                  <Input
                    placeholder="Digite para buscar ou criar..."
                    value={formMedicamento.nome}
                    autoComplete="off"
                    onChange={e => {
                      const val = e.target.value;
                      setFormMedicamento({...formMedicamento, nome: val});
                      setMedExistente(null);
                      if (val.length >= 2) {
                        const q = val.toLowerCase();
                        const localMatches = medicamentos.filter(m => m.nome.toLowerCase().includes(q)).slice(0, 4);
                        setSuggestoes(localMatches);
                        // Busca também na base CMED
                        api.buscarCmedReferencia(val).then(cmedResults => {
                          setSuggestoesCmed(cmedResults);
                          setShowSuggestoes(localMatches.length > 0 || cmedResults.length > 0);
                        });
                        setShowSuggestoes(localMatches.length > 0);
                      } else {
                        setSuggestoes([]);
                        setSuggestoesCmed([]);
                        setShowSuggestoes(false);
                      }
                    }}
                    onFocus={() => { if (suggestoes.length > 0) setShowSuggestoes(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestoes(false), 150)}
                  />
                  {showSuggestoes && (suggestoes.length > 0 || suggestoesCmed.length > 0) && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                      {/* Já cadastrados no sistema */}
                      {suggestoes.length > 0 && (
                        <>
                          <p className="text-[9px] font-black text-slate-400 uppercase px-3 pt-2 pb-1 sticky top-0 bg-white">Já cadastrados</p>
                          {suggestoes.map(m => {
                            const bpsPrecos: Record<string, number> = typeof window !== 'undefined'
                              ? JSON.parse(localStorage.getItem('bps_precos') || '{}') : {};
                            const bpsRef = bpsPrecos[m.id];
                            return (
                              <button
                                key={m.id}
                                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50"
                                onMouseDown={() => {
                                  setFormMedicamento({
                                    nome: m.nome,
                                    dosagem: m.dosagem || '',
                                    preco_teto_cmed: String(m.preco_teto_cmed ?? ''),
                                  });
                                  setMedExistente(m);
                                  setShowSuggestoes(false);
                                }}
                              >
                                <p className="text-sm font-bold text-slate-800">{m.nome}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {m.dosagem && <span className="text-[10px] text-slate-400">{m.dosagem}</span>}
                                  {m.preco_teto_cmed && <span className="text-[10px] font-bold text-blue-600">CMED R$ {m.preco_teto_cmed.toFixed(2)}</span>}
                                  {bpsRef && <span className="text-[10px] font-bold text-emerald-600">BPS R$ {bpsRef.toFixed(2)}</span>}
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}
                      {/* Base CMED ANVISA */}
                      {suggestoesCmed.length > 0 && (
                        <>
                          <p className="text-[9px] font-black text-blue-500 uppercase px-3 pt-2 pb-1 bg-blue-50 sticky top-0">Base CMED / ANVISA</p>
                          {suggestoesCmed.map((c, i) => (
                            <button
                              key={i}
                              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50"
                              onMouseDown={() => {
                                setFormMedicamento({
                                  nome: c.produto,
                                  dosagem: c.apresentacao || '',
                                  preco_teto_cmed: c.pf_17 ? String(c.pf_17) : (c.pmc_17 ? String(c.pmc_17) : ''),
                                });
                                setSuggestoesCmed([]);
                                setShowSuggestoes(false);
                              }}
                            >
                              <p className="text-sm font-bold text-slate-800">{c.produto}</p>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                {c.apresentacao && <span className="text-[10px] text-slate-400">{c.apresentacao.slice(0, 50)}</span>}
                                {c.pf_17 && <span className="text-[10px] font-bold text-emerald-600">PF R$ {c.pf_17.toFixed(2)}</span>}
                                {c.pmc_17 && <span className="text-[10px] font-bold text-blue-600">PMC R$ {c.pmc_17.toFixed(2)}</span>}
                                {c.catmat_codigo && <span className="text-[10px] font-bold text-purple-600">CATMAT {c.catmat_codigo}</span>}
                                {c.laboratorio && <span className="text-[10px] text-slate-400">{c.laboratorio}</span>}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
                        <p className="text-[9px] text-slate-400 font-medium">Selecione da base CMED para pré-preencher o teto de preço.</p>
                      </div>
                    </div>
                  )}
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Dosagem</label>
                  <Input placeholder="Ex: 500mg" value={formMedicamento.dosagem} onChange={e => setFormMedicamento({...formMedicamento, dosagem: e.target.value})} />
               </div>

               <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-3">
                  <ShieldCheck size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-blue-700 uppercase mb-0.5">Estoque Mínimo</p>
                    <p className="text-xs text-blue-600">Calculado automaticamente com base nas prescrições ativas de pacientes e hospitais.</p>
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block flex items-center gap-1">
                    Preço Teto CMED (R$) *
                    {medExistente?.preco_teto_cmed && <ShieldCheck size={10} className="text-blue-500" />}
                  </label>
                  <Input type="number" step="0.01" placeholder="0.00" value={formMedicamento.preco_teto_cmed} onChange={e => setFormMedicamento({...formMedicamento, preco_teto_cmed: e.target.value})} />
               </div>
               <Button onClick={handleNovoMedicamento} className="w-full bg-[#1A2B6D] hover:bg-[#121f4f] text-white font-black h-12 rounded-xl mt-4">
                  {medExistente ? 'Atualizar Cadastro' : 'Salvar Novo Medicamento'}
               </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal - Nova Entrada */}
      {showNovaEntrada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1001] p-4" onClick={() => { setShowNovaEntrada(false); setValidacaoEntrada(null); }}>
          <Card className="w-full max-w-lg shadow-2xl bg-white border-0" onClick={e => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-100">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                     <Plus className="text-emerald-600"/> NOVA ENTRADA (ESTOQUE)
                  </CardTitle>
                  <button onClick={() => { setShowNovaEntrada(false); setValidacaoEntrada(null); }} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               {/* Medicamento Alvo — Autocomplete com busca CMED */}
               <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Medicamento Alvo *</label>
                  {entradaMedNome ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{entradaMedNome}</p>
                        {(() => {
                          const selectedMed = medicamentos.find(m => m.id === formEntrada.med_id);
                          return selectedMed?.preco_teto_cmed ? (
                            <p className="text-[10px] font-bold text-blue-600">CMED Teto: R$ {selectedMed.preco_teto_cmed.toFixed(2)}</p>
                          ) : null;
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEntradaMedNome('');
                          setFormEntrada({...formEntrada, med_id: ''});
                          setBuscaEntrada('');
                          setValidacaoEntrada(null);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <Input
                      placeholder="Digite para buscar na base CMED e cadastrados..."
                      value={buscaEntrada}
                      autoComplete="off"
                      onChange={e => {
                        const val = e.target.value;
                        setBuscaEntrada(val);
                        if (val.length >= 2) {
                          const q = val.toLowerCase();
                          const localMatches = medicamentos.filter(m => m.nome.toLowerCase().includes(q)).slice(0, 5);
                          setSuggestoesEntrada(localMatches);
                          api.buscarCmedReferencia(val).then(cmedResults => {
                            setSuggestoesCmedEntrada(cmedResults);
                            setShowSuggestoesEntrada(localMatches.length > 0 || cmedResults.length > 0);
                          });
                          setShowSuggestoesEntrada(localMatches.length > 0);
                        } else {
                          setSuggestoesEntrada([]);
                          setSuggestoesCmedEntrada([]);
                          setShowSuggestoesEntrada(false);
                        }
                      }}
                      onFocus={() => { if (suggestoesEntrada.length > 0 || suggestoesCmedEntrada.length > 0) setShowSuggestoesEntrada(true); }}
                      onBlur={() => setTimeout(() => setShowSuggestoesEntrada(false), 200)}
                    />
                  )}
                  {/* Dropdown de sugestões */}
                  {showSuggestoesEntrada && (suggestoesEntrada.length > 0 || suggestoesCmedEntrada.length > 0) && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                      {/* Já cadastrados */}
                      {suggestoesEntrada.length > 0 && (
                        <>
                          <p className="text-[9px] font-black text-emerald-600 uppercase px-3 pt-2 pb-1 bg-emerald-50 sticky top-0">✓ Já cadastrados no sistema</p>
                          {suggestoesEntrada.map(m => (
                            <button
                              key={m.id}
                              className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors border-b border-slate-50"
                              onMouseDown={() => {
                                setFormEntrada({...formEntrada, med_id: m.id});
                                setEntradaMedNome(m.nome + (m.dosagem ? ` — ${m.dosagem}` : ''));
                                setBuscaEntrada('');
                                setSuggestoesEntrada([]);
                                setSuggestoesCmedEntrada([]);
                                setShowSuggestoesEntrada(false);
                                if (formEntrada.preco) validarPrecoEntrada(m.id, formEntrada.preco);
                              }}
                            >
                              <p className="text-sm font-bold text-slate-800">{m.nome}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                {m.dosagem && <span className="text-[10px] text-slate-400">{m.dosagem}</span>}
                                {m.preco_teto_cmed && <span className="text-[10px] font-bold text-blue-600">CMED R$ {m.preco_teto_cmed.toFixed(2)}</span>}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      {/* Base CMED para cadastrar + dar entrada */}
                      {suggestoesCmedEntrada.length > 0 && (
                        <>
                          <p className="text-[9px] font-black text-blue-500 uppercase px-3 pt-2 pb-1 bg-blue-50 sticky top-0">Base CMED / ANVISA — cadastrar e dar entrada</p>
                          {suggestoesCmedEntrada.map((c, i) => (
                            <button
                              key={`cmed-e-${i}`}
                              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50"
                              onMouseDown={async () => {
                                // Auto-cadastra o medicamento a partir da CMED e já seleciona
                                const precoTeto = c.pf_17 || c.pmc_17 || 0;
                                const res = await api.createMedicamento({
                                  nome: c.produto,
                                  dosagem: c.apresentacao || undefined,
                                  estoque_minimo: 0,
                                  preco_teto_cmed: precoTeto,
                                });
                                if (res.success && res.data) {
                                  toast.success(`"${c.produto}" cadastrado automaticamente via CMED!`);
                                  setFormEntrada({...formEntrada, med_id: res.data.id});
                                  setEntradaMedNome(c.produto + (c.apresentacao ? ` — ${c.apresentacao.slice(0, 40)}` : ''));
                                  loadData(); // refresh list
                                } else {
                                  toast.error('Erro ao cadastrar: ' + (res.error || 'desconhecido'));
                                }
                                setBuscaEntrada('');
                                setSuggestoesEntrada([]);
                                setSuggestoesCmedEntrada([]);
                                setShowSuggestoesEntrada(false);
                              }}
                            >
                              <p className="text-sm font-bold text-slate-800">{c.produto}</p>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                {c.apresentacao && <span className="text-[10px] text-slate-400">{c.apresentacao.slice(0, 50)}</span>}
                                {c.pf_17 && <span className="text-[10px] font-bold text-emerald-600">PF R$ {c.pf_17.toFixed(2)}</span>}
                                {c.pmc_17 && <span className="text-[10px] font-bold text-blue-600">PMC R$ {c.pmc_17.toFixed(2)}</span>}
                                {c.catmat_codigo && <span className="text-[10px] font-bold text-purple-600">CATMAT {c.catmat_codigo}</span>}
                                {c.laboratorio && <span className="text-[10px] text-slate-400">{c.laboratorio}</span>}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
                        <p className="text-[9px] text-slate-400 font-medium">Selecione um cadastrado ou escolha da CMED para cadastrar automaticamente.</p>
                      </div>
                    </div>
                  )}
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block flex items-center gap-1">
                    Fornecedor
                    <Truck size={10} className="text-slate-400" />
                  </label>
                  <Select onValueChange={v => setFormEntrada({...formEntrada, fornecedor_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione o fornecedor..." /></SelectTrigger>
                    <SelectContent>
                      {fornecedores.length === 0 ? (
                        <SelectItem value="sem-fornecedor" disabled>Nenhum fornecedor cadastrado</SelectItem>
                      ) : (
                        fornecedores.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.razao_social}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Código do Lote</label>
                    <Input placeholder="Ex: LOT2024-X" onChange={e => setFormEntrada({...formEntrada, lote: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Data Validade</label>
                    <Input type="date" onChange={e => setFormEntrada({...formEntrada, validade: e.target.value})} />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Quantidade (un)</label>
                    <Input type="number" placeholder="0" onChange={e => setFormEntrada({...formEntrada, qtd: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block flex items-center gap-1">
                      Custo Unitário (R$)
                      {validando && <Loader2 size={10} className="animate-spin" />}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={cn(
                        validacaoEntrada?.status === 'ALERTA_CMED' && 'border-red-400 focus-visible:ring-red-400',
                        validacaoEntrada?.status === 'ALERTA_BPS' && 'border-amber-400 focus-visible:ring-amber-400',
                        validacaoEntrada?.status === 'OK' && 'border-emerald-400 focus-visible:ring-emerald-400',
                      )}
                      onChange={e => {
                        setFormEntrada({...formEntrada, preco: e.target.value});
                        validarPrecoEntrada(formEntrada.med_id, e.target.value);
                      }}
                    />
                  </div>
               </div>

               {/* Painel de conformidade */}
               {validacaoEntrada && parseFloat(formEntrada.preco) > 0 && (
                 <div className="space-y-2">
                   <div className={cn(
                     'flex items-start gap-3 rounded-xl p-3 border',
                     validacaoEntrada.cmed.valido ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-300'
                   )}>
                     {validacaoEntrada.cmed.valido
                       ? <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={15} />
                       : <ShieldX className="text-red-600 shrink-0 mt-0.5 animate-pulse" size={15} />
                     }
                     <div className="flex-1">
                       <p className={cn('text-[10px] font-black uppercase', validacaoEntrada.cmed.valido ? 'text-emerald-700' : 'text-red-700')}>
                         CMED / ANVISA
                       </p>
                       <p className={cn('text-xs font-medium', validacaoEntrada.cmed.valido ? 'text-emerald-700' : 'text-red-700 font-bold')}>
                         {validacaoEntrada.cmed.valido
                           ? `Dentro do teto — R$ ${validacaoEntrada.cmed.teto.toFixed(2)}`
                           : `+${validacaoEntrada.cmed.percentual.toFixed(1)}% acima (teto: R$ ${validacaoEntrada.cmed.teto.toFixed(2)})`
                         }
                       </p>
                     </div>
                   </div>
                   {validacaoEntrada.bps.referencia !== null && (
                     <div className={cn(
                       'flex items-start gap-3 rounded-xl p-3 border',
                       validacaoEntrada.bps.valido ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                     )}>
                       {validacaoEntrada.bps.valido
                         ? <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={15} />
                         : <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={15} />
                       }
                       <div className="flex-1">
                         <p className={cn('text-[10px] font-black uppercase', validacaoEntrada.bps.valido ? 'text-emerald-700' : 'text-amber-700')}>
                           BPS / Ministério da Saúde
                         </p>
                         <p className={cn('text-xs font-medium', validacaoEntrada.bps.valido ? 'text-emerald-700' : 'text-amber-700 font-bold')}>
                           {validacaoEntrada.bps.valido
                             ? `Abaixo da referência — R$ ${validacaoEntrada.bps.referencia!.toFixed(2)}`
                             : `+${validacaoEntrada.bps.percentual!.toFixed(1)}% acima da ref. BPS (R$ ${validacaoEntrada.bps.referencia!.toFixed(2)})`
                           }
                         </p>
                       </div>
                     </div>
                   )}
                 </div>
               )}

               <Button
                 onClick={handleEntrada}
                 className={cn(
                   'w-full font-black h-12 rounded-xl mt-4 text-white',
                   validacaoEntrada?.status === 'ALERTA_CMED'
                     ? 'bg-red-600 hover:bg-red-700'
                     : validacaoEntrada?.status === 'ALERTA_BPS'
                     ? 'bg-amber-600 hover:bg-amber-700'
                     : 'bg-emerald-600 hover:bg-emerald-700'
                 )}
               >
                 {validacaoEntrada?.status === 'ALERTA_CMED'
                   ? 'Registrar Entrada (acima do teto CMED!)'
                   : validacaoEntrada?.status === 'ALERTA_BPS'
                   ? 'Registrar Entrada (acima do BPS)'
                   : 'Processar Entrada Tática'
                 }
               </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal - Registrar Saída (FEFO-Aware) */}
      {showRegistrarSaida && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1001] p-4" onClick={() => { setShowRegistrarSaida(false); setSaidaMedId(''); setSaidaBuscaMed(''); }}>
          <Card className="w-full max-w-2xl shadow-2xl bg-white border-0 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader className={cn('border-b', isFefoViolation ? 'border-red-200 bg-red-50/50' : 'border-slate-100')}>
               <div className="flex items-center justify-between">
                  <CardTitle className={cn('text-lg font-black flex items-center gap-2', isFefoViolation ? 'text-red-800' : 'text-slate-900')}>
                     {isFefoViolation ? <Shield className="text-red-600 animate-pulse"/> : <ArrowDownToLine className="text-blue-600"/>}
                     {isFefoViolation ? 'ATENÇÃO: FORA DA ORDEM FEFO' : 'BAIXA INTELIGENTE DE LOTE'}
                  </CardTitle>
                  <button onClick={() => { setShowRegistrarSaida(false); setSaidaMedId(''); setSaidaBuscaMed(''); }} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
               </div>
               {isFefoViolation && (
                 <p className="text-[10px] font-bold text-red-600 mt-1">Você selecionou um lote que NÃO é o mais próximo do vencimento. Justificativa obrigatória.</p>
               )}
            </CardHeader>
            <CardContent className="p-6 space-y-5">

               {/* Step 1: Selecionar Medicamento */}
               <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">1. Selecionar Medicamento</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      ref={saidaInputRef}
                      placeholder="digite para buscar..."
                      value={saidaBuscaMed}
                      autoComplete="off"
                      onChange={e => {
                        setSaidaBuscaMed(e.target.value);
                        setSaidaMedId('');
                        setFormSaida(prev => ({ ...prev, lote_id: '' }));
                      }}
                      className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                    />
                  </div>
                  {saidaBuscaMed.length >= 2 && !saidaMedId && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {medicamentos
                        .filter(m => m.nome.toLowerCase().includes(saidaBuscaMed.toLowerCase()) && (m.lotes || []).some(l => l.quantidade_disponivel > 0))
                        .map(m => {
                          const totalDisp = (m.lotes || []).reduce((s, l) => s + l.quantidade_disponivel, 0);
                          const numLotes = (m.lotes || []).filter(l => l.quantidade_disponivel > 0).length;
                          return (
                            <button
                              key={m.id}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                              onClick={() => {
                                setSaidaMedId(m.id);
                                setSaidaBuscaMed(m.nome);
                              }}
                            >
                              <div>
                                <span className="text-sm font-bold text-slate-900">{m.nome}</span>
                                {m.dosagem && <span className="text-xs text-slate-400 ml-1.5">{m.dosagem}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-blue-50 text-blue-600 border-none shadow-none text-[9px] font-black">{numLotes} lote{numLotes > 1 ? 's' : ''}</Badge>
                                <Badge className="bg-slate-100 text-slate-600 border-none shadow-none text-[9px] font-black">{totalDisp} un</Badge>
                              </div>
                            </button>
                          );
                        })}
                      {medicamentos.filter(m => m.nome.toLowerCase().includes(saidaBuscaMed.toLowerCase()) && (m.lotes || []).some(l => l.quantidade_disponivel > 0)).length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center">Nenhum medicamento com estoque encontrado</div>
                      )}
                    </div>
                  )}
               </div>

               {/* Step 2: Selecionar Lote com badges FEFO */}
               {saidaMedId && lotesFefo.length > 0 && (
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">2. Selecionar Lote (FEFO Ativo)</label>
                   <div className="space-y-2">
                     {lotesFefo.map((l, idx) => {
                       const isSelected = formSaida.lote_id === l.id;
                       const isFefo = idx === 0;
                       const totalMedDisp = lotesFefo.reduce((s, lt) => s + lt.quantidade_disponivel, 0);
                       const pctDisp = totalMedDisp > 0 ? Math.round((l.quantidade_disponivel / totalMedDisp) * 100) : 0;
                       const validade = new Date(l.data_validade);
                       const hoje = new Date();
                       const diasParaVencer = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                       const isVencendo = diasParaVencer <= 30;
                       const isVencido = diasParaVencer <= 0;

                       return (
                         <button
                           key={l.id}
                           onClick={() => setFormSaida(prev => ({ ...prev, lote_id: l.id, justificativa_fefo: '' }))}
                           className={cn(
                             'w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200',
                             isSelected
                               ? isFefo
                                 ? 'border-emerald-400 bg-emerald-50/60 ring-2 ring-emerald-200'
                                 : 'border-red-400 bg-red-50/60 ring-2 ring-red-200'
                               : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                           )}
                         >
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <span className="font-mono font-bold text-sm text-slate-800">{l.codigo_lote_fabricante}</span>
                               {isFefo && (
                                 <Badge className="bg-emerald-100 text-emerald-700 border-none shadow-none text-[8px] font-black uppercase px-1.5 animate-pulse">
                                   <Timer size={9} className="mr-0.5"/> FEFO
                                 </Badge>
                               )}
                               {isVencido ? (
                                 <Badge className="bg-red-100 text-red-700 border-none shadow-none text-[8px] font-black uppercase px-1.5">
                                   VENCIDO
                                 </Badge>
                               ) : isVencendo ? (
                                 <Badge className="bg-amber-100 text-amber-700 border-none shadow-none text-[8px] font-black uppercase px-1.5">
                                   {diasParaVencer}d p/ vencer
                                 </Badge>
                               ) : null}
                             </div>
                             <div className="flex items-center gap-3">
                               <span className="text-xs text-slate-500 font-medium">
                                 {validade.toLocaleDateString('pt-BR')}
                               </span>
                               <span className="text-sm font-black text-slate-800">{l.quantidade_disponivel} un</span>
                             </div>
                           </div>
                           {/* Capacity bar */}
                           <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div
                               className={cn(
                                 'h-full rounded-full transition-all duration-500',
                                 isVencido ? 'bg-red-400' : isVencendo ? 'bg-amber-400' : 'bg-emerald-400'
                               )}
                               style={{ width: `${pctDisp}%` }}
                             />
                           </div>
                           <div className="flex items-center justify-between mt-1">
                             <span className="text-[9px] text-slate-400 font-medium">{pctDisp}% do estoque total</span>
                             {l.custo_unitario && (
                               <span className="text-[9px] font-mono text-slate-400">R$ {l.custo_unitario.toFixed(2)}/un</span>
                             )}
                           </div>
                         </button>
                       );
                     })}
                   </div>
                 </div>
               )}

               {/* Step 3: Quantidade e Destino */}
               {formSaida.lote_id && (
                 <>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">3. Qtd para Retirada *</label>
                       <Input
                         type="number"
                         placeholder="0"
                         value={formSaida.qtd}
                         onChange={e => setFormSaida(prev => ({ ...prev, qtd: e.target.value }))}
                         className="h-11 rounded-xl"
                       />
                       {formSaida.qtd && Number(formSaida.qtd) > (lotesFefo.find(l => l.id === formSaida.lote_id)?.quantidade_disponivel || 0) && (
                         <p className="text-[10px] text-red-500 font-bold mt-1">⚠ Excede o saldo do lote</p>
                       )}
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Destino / Finalidade</label>
                       <Input
                         placeholder="UBS, Descarte, etc"
                         value={formSaida.destino}
                         onChange={e => setFormSaida(prev => ({ ...prev, destino: e.target.value }))}
                         className="h-11 rounded-xl"
                       />
                     </div>
                   </div>

                   {/* Motivo */}
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Motivo</label>
                     <Select value={formSaida.motivo} onValueChange={v => setFormSaida(prev => ({ ...prev, motivo: v }))}>
                       <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Dispensação Manual">Dispensação Manual</SelectItem>
                         <SelectItem value="Descarte / Vencido">Descarte / Vencido</SelectItem>
                         <SelectItem value="Transferência UBS">Transferência UBS</SelectItem>
                         <SelectItem value="Devolução Fornecedor">Devolução Fornecedor</SelectItem>
                         <SelectItem value="Recall">Recall</SelectItem>
                         <SelectItem value="Outro">Outro</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </>
               )}

               {/* FEFO Violation Warning + Justification */}
               {isFefoViolation && (
                 <div className="space-y-3">
                   <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
                     <Shield className="text-red-600 shrink-0 mt-0.5 animate-pulse" size={20}/>
                     <div>
                       <p className="text-[10px] font-black text-red-800 uppercase">Violação da Ordem FEFO</p>
                       <p className="text-xs text-red-700 font-medium leading-tight mt-0.5">
                         O lote {lotesFefo.find(l => l.id === formSaida.lote_id)?.codigo_lote_fabricante} não é o mais próximo do vencimento.
                         O lote FEFO correto é <strong>{lotesFefo[0]?.codigo_lote_fabricante}</strong> (vence em {new Date(lotesFefo[0]?.data_validade).toLocaleDateString('pt-BR')}).
                       </p>
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-red-600 uppercase mb-1.5 block flex items-center gap-1">
                       <ClipboardList size={10}/> Justificativa Obrigatória *
                     </label>
                     <textarea
                       placeholder="Ex: Lote FEFO reservado para programa especial, lote com recall parcial..."
                       value={formSaida.justificativa_fefo}
                       onChange={e => setFormSaida(prev => ({ ...prev, justificativa_fefo: e.target.value }))}
                       className="w-full border-2 border-red-200 rounded-xl p-3 text-sm text-red-900 bg-red-50/50 focus:outline-none focus:ring-2 focus:ring-red-300 placeholder:text-red-300 min-h-[80px] resize-none"
                     />
                   </div>
                 </div>
               )}

               {/* Audit trail warning */}
               {formSaida.lote_id && !isFefoViolation && (
                 <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                   <AlertTriangle className="text-amber-600 shrink-0" size={18}/>
                   <p className="text-[10px] font-bold text-amber-900 leading-tight">ATENÇÃO: A saída manual gera uma trilha de auditoria irreversível vinculada ao seu usuário.</p>
                 </div>
               )}

               {/* Submit button */}
               {formSaida.lote_id && (
                 <Button
                   onClick={handleSaida}
                   disabled={!formSaida.qtd || Number(formSaida.qtd) <= 0 || (!!isFefoViolation && !formSaida.justificativa_fefo.trim())}
                   className={cn(
                     'w-full font-black h-12 rounded-xl mt-2 text-white transition-all duration-200',
                     isFefoViolation
                       ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                       : 'bg-blue-900 hover:bg-black disabled:bg-slate-300'
                   )}
                 >
                   {isFefoViolation ? 'Confirmar Saída (Fora do FEFO)' : 'Confirmar Baixa de Lote'}
                 </Button>
               )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AlertaSegurançaModal - Confirmação de Segurança */}
      {showAlertaSeguranca && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[1002] p-4">
          <Card className={cn(
            'w-full max-w-md shadow-2xl border-0 animate-in zoom-in-95 fade-in duration-200',
            isFefoViolation ? 'bg-red-50' : 'bg-white'
          )} onClick={e => e.stopPropagation()}>
            <CardContent className="p-8 text-center space-y-4">
              <div className={cn(
                'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center',
                isFefoViolation ? 'bg-red-100' : 'bg-amber-100'
              )}>
                {isFefoViolation
                  ? <Shield className="text-red-600" size={32}/>
                  : <AlertTriangle className="text-amber-600" size={32}/>
                }
              </div>
              <div>
                <h3 className={cn('text-lg font-black', isFefoViolation ? 'text-red-900' : 'text-slate-900')}>
                  {isFefoViolation ? 'Confirmar Saída Fora do FEFO?' : 'Confirmar Baixa de Estoque?'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {isFefoViolation
                    ? 'Esta ação ficará registrada na auditoria como violação da política FEFO.'
                    : 'Esta ação é irreversível e será registrada na trilha de auditoria.'
                  }
                </p>
                {isFefoViolation && formSaida.justificativa_fefo && (
                  <div className="mt-3 p-3 bg-red-100 rounded-lg text-left">
                    <p className="text-[9px] font-black text-red-600 uppercase">Justificativa registrada:</p>
                    <p className="text-xs text-red-800 mt-0.5">{formSaida.justificativa_fefo}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAlertaSeguranca(false)}
                  className="flex-1 h-11 rounded-xl font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmarSaida}
                  className={cn(
                    'flex-1 h-11 rounded-xl font-black text-white',
                    isFefoViolation ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-900 hover:bg-black'
                  )}
                >
                  {isFefoViolation ? 'Sim, registrar' : 'Confirmar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Command Palette (Ctrl+K) */}
      {showCommandPalette && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[1003] pt-[20vh]" onClick={() => { setShowCommandPalette(false); setSerialMode(false); setSerialResult(null); }}>
          <Card className="w-full max-w-lg shadow-2xl bg-white border-0 animate-in slide-in-from-top-4 fade-in duration-200" onClick={e => e.stopPropagation()}>
            <CardContent className="p-0">
              <div className="flex items-center border-b border-slate-100 px-4 gap-2">
                {serialMode ? (
                  <>
                    <button onClick={() => { setSerialMode(false); setSerialResult(null); setCmdBusca(''); }} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                      <ArrowLeftCircle size={18} />
                    </button>
                    <ScanBarcode size={16} className="text-blue-500 shrink-0" />
                  </>
                ) : (
                  <Command size={16} className="text-slate-400 shrink-0" />
                )}
                <Input
                  ref={cmdInputRef}
                  placeholder={serialMode ? 'Digite o serial number...' : 'O que deseja fazer?'}
                  value={cmdBusca}
                  onChange={e => { setCmdBusca(e.target.value); if (serialMode) setSerialResult(null); }}
                  className="border-0 shadow-none focus-visible:ring-0 h-14 text-base"
                  onKeyDown={e => {
                    if (e.key === 'Escape' && serialMode) {
                      e.stopPropagation();
                      setSerialMode(false); setSerialResult(null); setCmdBusca('');
                      return;
                    }
                    if (e.key === 'Enter') {
                      if (serialMode) {
                        handleSerialSearch(cmdBusca);
                      } else if (filteredCommands.length > 0) {
                        filteredCommands[0].action();
                      }
                    }
                  }}
                />
                {serialMode && serialLoading && <Loader2 size={16} className="animate-spin text-blue-500 shrink-0" />}
                <kbd className="hidden sm:flex items-center gap-0.5 text-[9px] font-mono text-slate-300 border border-slate-200 rounded px-1.5 py-0.5 shrink-0">
                  ESC
                </kbd>
              </div>

              {/* Standard command list */}
              {!serialMode && (
                <div className="py-2 max-h-64 overflow-y-auto">
                  {filteredCommands.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors"
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cmd.id === 'rastrear-sn' ? 'bg-blue-50' : 'bg-slate-100')}>
                        <cmd.icon size={16} className={cmd.id === 'rastrear-sn' ? 'text-blue-600' : 'text-slate-600'} />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-bold text-slate-900">{cmd.label}</span>
                        <p className="text-xs text-slate-400">{cmd.desc}</p>
                      </div>
                      <kbd className="hidden sm:block text-[8px] font-mono text-slate-300 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                        ↵
                      </kbd>
                    </button>
                  ))}
                  {filteredCommands.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">Nenhum comando encontrado</div>
                  )}
                </div>
              )}

              {/* Serial tracking result area */}
              {serialMode && (
                <div className="py-3 px-4 max-h-80 overflow-y-auto">
                  {!serialResult && !serialLoading && (
                    <div className="text-center py-8">
                      <ScanBarcode size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-sm text-slate-400">Digite um serial number e pressione <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">Enter</kbd></p>
                      <p className="text-[10px] text-slate-300 mt-1">Ex: SN-2024-00001</p>
                    </div>
                  )}

                  {serialLoading && (
                    <div className="text-center py-8">
                      <Loader2 size={24} className="mx-auto animate-spin text-blue-500 mb-2" />
                      <p className="text-sm text-slate-400">Rastreando serial...</p>
                    </div>
                  )}

                  {serialResult === 'NOT_FOUND' && (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                        <X size={20} className="text-red-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">Serial não encontrado</p>
                      <p className="text-xs text-slate-400 mt-1">Verifique o número e tente novamente</p>
                    </div>
                  )}

                  {serialResult && serialResult !== 'NOT_FOUND' && (
                    <div className="space-y-3">
                      {/* Header card */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Serial Number</p>
                            <p className="text-lg font-black text-slate-900 font-mono">{serialResult.serial_number}</p>
                          </div>
                          <Badge className={cn('shadow-none text-[9px] font-black uppercase',
                            serialResult.status === 'DISPONIVEL' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            serialResult.status === 'DISPENSADO' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            serialResult.status === 'BLOQUEADO' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          )}>{serialResult.status}</Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-700 mt-1">{serialResult.medicamento_nome}</p>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Package size={11} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase">Lote</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 font-mono">{serialResult.lote_codigo}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Calendar size={11} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase">Validade</span>
                          </div>
                          <p className={cn('text-sm font-bold font-mono',
                            new Date(serialResult.data_validade) < new Date() ? 'text-red-600' : 'text-slate-800'
                          )}>{new Date(serialResult.data_validade).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <DollarSign size={11} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase">Custo Unit.</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800">R$ {serialResult.custo_unitario.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Building2 size={11} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase">Fornecedor</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 truncate">{serialResult.fornecedor_nome ?? '—'}</p>
                        </div>
                      </div>

                      {/* Dispensação info */}
                      {serialResult.paciente_nome && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <User size={12} className="text-amber-600" />
                            <span className="text-[9px] font-black text-amber-600 uppercase">Dispensado para</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800">{serialResult.paciente_nome}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-500">CPF: <span className="font-mono font-bold">{serialResult.paciente_cpf}</span></span>
                            {serialResult.data_dispensacao && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <CalendarClock size={10} />
                                {new Date(serialResult.data_dispensacao).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between text-[9px] text-slate-300 font-medium">
                <span className="flex items-center gap-1"><Keyboard size={10}/> {serialMode ? '← Voltar · Enter buscar' : 'Ctrl+K para abrir'}</span>
                <span>{serialMode ? 'Rastreamento S/N' : `${filteredCommands.length} comando${filteredCommands.length !== 1 ? 's' : ''}`}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

export default function EstoquePage() {
  return (
    <Suspense fallback={<div className="p-8"><Loader2 className="animate-spin text-blue-500" /></div>}>
      <EstoqueContent />
    </Suspense>
  );
}
