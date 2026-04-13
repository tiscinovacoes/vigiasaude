'use client';

import { Suspense, useState, useEffect, Fragment, useCallback } from 'react';
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
import { api, Medicamento, Lote } from '@/lib/api';
import { useRouter } from 'next/navigation';
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
  const [busca, setBusca] = useState("");
  const [expandedMeds, setExpandedMeds] = useState<Set<string>>(new Set());
  
  // Modais
  const [showNovoMedicamento, setShowNovoMedicamento] = useState(false);
  const [showNovaEntrada, setShowNovaEntrada] = useState(false);
  const [showRegistrarSaida, setShowRegistrarSaida] = useState(false);
  
  // States para Formulários
  const [formMedicamento, setFormMedicamento] = useState({
    nome: '', dosagem: '', estoque_minimo: '', preco_teto_cmed: '', fornecedor_id: ''
  });
  const [suggestoes, setSuggestoes] = useState<Medicamento[]>([]);
  const [suggestoesCmed, setSuggestoesCmed] = useState<{ produto: string; apresentacao: string | null; substancia: string | null; laboratorio: string | null; pmc_17: number | null; pf_17: number | null; classe_terapeutica: string | null }[]>([]);
  const [showSuggestoes, setShowSuggestoes] = useState(false);
  const [medExistente, setMedExistente] = useState<Medicamento | null>(null);
  const [fornecedores, setFornecedores] = useState<{ id: string; razao_social: string }[]>([]);
  const [formEntrada, setFormEntrada] = useState({
    med_id: '', lote: '', validade: '', qtd: '', preco: ''
  });
  const [formSaida, setFormSaida] = useState({
    lote_id: '', qtd: '', motivo: 'Dispensão Manual', destino: ''
  });
  const [validacaoEntrada, setValidacaoEntrada] = useState<ValidacaoPreco>(null);
  const [validando, setValidando] = useState(false);

  useEffect(() => {
    loadData();
    api.getFornecedores().then(list =>
      setFornecedores(list.map(f => ({ id: f.id, razao_social: f.razao_social })))
    ).catch(() => {});
  }, []);

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
      const data = await api.getEstoqueBase();
      setMedicamentos(data);
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
    if (!formMedicamento.nome || !formMedicamento.estoque_minimo || !formMedicamento.preco_teto_cmed) {
      toast.error("Preencha os campos obrigatórios (Nome, Mínimo e Preço Teto)");
      return;
    }
    const res = await api.createMedicamento({
      nome: formMedicamento.nome,
      dosagem: formMedicamento.dosagem || undefined,
      estoque_minimo: Number(formMedicamento.estoque_minimo),
      preco_teto_cmed: Number(formMedicamento.preco_teto_cmed),
      ...(formMedicamento.fornecedor_id ? { fornecedor_preferencial_id: formMedicamento.fornecedor_id } : {}),
    });

    if (res.success) {
      toast.success("Medicamento cadastrado com sucesso!");
      setShowNovoMedicamento(false);
      setSuggestoes([]); setMedExistente(null);
      setFormMedicamento({ nome: '', dosagem: '', estoque_minimo: '', preco_teto_cmed: '', fornecedor_id: '' });
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
      custo_unitario: Number(formEntrada.preco)
    });

    if (res.success) {
      toast.success("Entrada registrada e auditada com sucesso!");
      setShowNovaEntrada(false);
      loadData();
    } else {
      toast.error("Erro na transação: " + res.error);
    }
  }

  async function handleSaida() {
    if (!formSaida.lote_id || !formSaida.qtd) {
      toast.error("Preencha todos os campos");
      return;
    }
    const res = await api.registrarSaida({
      lote_id: formSaida.lote_id,
      quantidade: Number(formSaida.qtd),
      motivo: formSaida.motivo,
      destino: formSaida.destino
    });

    if (res.success) {
      toast.success("Baixa de estoque concluída.");
      setShowRegistrarSaida(false);
      loadData();
    } else {
      toast.error("Erro: " + res.error);
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
                    <th className="text-left py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Medicamento / SKU</th>
                    <th className="text-right py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Consolidado</th>
                    <th className="text-right py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Estoque Mín.</th>
                    <th className="text-right py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">CMED Unit.</th>
                    <th className="text-center py-4 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((med) => {
                    const totalDisp = (med.lotes || []).reduce((s, l) => s + (l.quantidade_disponivel || 0), 0);
                    const isExpanded = expandedMeds.has(med.id);
                    const isCritico = totalDisp < med.estoque_minimo;

                    return (
                      <Fragment key={med.id}>
                        <tr className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${isCritico ? 'bg-red-50/20' : ''}`} onClick={() => toggleExpand(med.id)}>
                          <td className="py-4 px-4 text-center">
                            {isExpanded ? <ChevronDown size={14} className="text-blue-600"/> : <ChevronRight size={14} className="text-slate-400"/>}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-900 leading-tight">{med.nome}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{med.dosagem || '—'}</p>
                          </td>
                          <td className="py-4 px-4 text-right">
                             <div className="flex flex-col items-end">
                                <span className={`text-sm font-black ${isCritico ? 'text-red-600' : 'text-slate-900'}`}>{totalDisp} un</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Total Em Lotes</span>
                             </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-xs text-slate-500">{med.estoque_minimo}</td>
                          <td className="py-4 px-4 text-right font-mono text-xs text-blue-600">R$ {med.preco_teto_cmed?.toFixed(2)}</td>
                          <td className="py-4 px-4 text-center">
                             <Badge className={`${isCritico ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'} border-none shadow-none text-[9px] font-black uppercase`}>
                                {isCritico ? 'Reabastecer' : 'Normal'}
                             </Badge>
                          </td>
                        </tr>

                        {isExpanded && med.lotes?.map((l: any) => (
                           <tr key={l.id} className="bg-slate-50/50 border-b border-slate-100">
                              <td colSpan={2} className="py-3 px-12">
                                 <div className="flex items-center gap-2">
                                    <Layers size={12} className="text-blue-400"/>
                                    <span className="text-xs font-bold text-slate-600">Lote: {l.codigo_lote_fabricante}</span>
                                    <Badge variant="outline" className="text-[9px] font-black tracking-widest px-1 py-0 h-4 border-slate-200 text-slate-400 uppercase">
                                       Validade: {new Date(l.data_validade).toLocaleDateString('pt-BR')}
                                    </Badge>
                                 </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                 <span className="text-xs font-black text-slate-700">{l.quantidade_disponivel} un</span>
                              </td>
                              <td colSpan={2} className="py-3 px-4">
                                 <div className="flex items-center justify-end gap-2">
                                    <span className="text-[10px] text-slate-400 font-medium">Custo Unit:</span>
                                    <span className={`text-[10px] font-mono font-bold ${l.custo_unitario_compra > med.preco_teto_cmed ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                                       R$ {l.custo_unitario_compra?.toFixed(2)}
                                    </span>
                                 </div>
                              </td>
                              <td className="text-center">
                                 <Badge className="bg-white border border-slate-200 text-slate-400 text-[8px] font-black uppercase">Individual</Badge>
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
                                    estoque_minimo: String(m.estoque_minimo),
                                    preco_teto_cmed: String(m.preco_teto_cmed ?? ''),
                                    fornecedor_id: m.fornecedor_preferencial_id || '',
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
                                  estoque_minimo: '',
                                  preco_teto_cmed: c.pmc_17 ? String(c.pmc_17) : '',
                                  fornecedor_id: '',
                                });
                                setSuggestoesCmed([]);
                                setShowSuggestoes(false);
                              }}
                            >
                              <p className="text-sm font-bold text-slate-800">{c.produto}</p>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                {c.apresentacao && <span className="text-[10px] text-slate-400">{c.apresentacao.slice(0, 50)}</span>}
                                {c.pmc_17 && <span className="text-[10px] font-bold text-blue-600">PMC 17% R$ {c.pmc_17.toFixed(2)}</span>}
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

               {/* Fornecedor preferencial */}
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block flex items-center gap-1">
                    Fornecedor Preferencial *
                    <Truck size={10} className="text-slate-400" />
                  </label>
                  <Select onValueChange={v => setFormMedicamento({...formMedicamento, fornecedor_id: v})}>
                    <SelectTrigger className={cn(!formMedicamento.fornecedor_id && 'border-amber-300')}>
                      <SelectValue placeholder="Selecione um fornecedor..." />
                    </SelectTrigger>
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
                  {!formMedicamento.fornecedor_id && (
                    <p className="text-[9px] text-amber-600 font-bold mt-1">Vincule um fornecedor para triagem de compras</p>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Estoque Mínimo *</label>
                    <Input type="number" placeholder="Ex: 100" value={formMedicamento.estoque_minimo} onChange={e => setFormMedicamento({...formMedicamento, estoque_minimo: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block flex items-center gap-1">
                      Preço Teto CMED (R$) *
                      {medExistente?.preco_teto_cmed && <ShieldCheck size={10} className="text-blue-500" />}
                    </label>
                    <Input type="number" step="0.01" placeholder="0.00" value={formMedicamento.preco_teto_cmed} onChange={e => setFormMedicamento({...formMedicamento, preco_teto_cmed: e.target.value})} />
                  </div>
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
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Medicamento Alvo</label>
                  <Select onValueChange={v => {
                    setFormEntrada({...formEntrada, med_id: v});
                    if (formEntrada.preco) validarPrecoEntrada(v, formEntrada.preco);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {medicamentos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
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

      {/* Modal - Registrar Saída */}
      {showRegistrarSaida && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1001] p-4" onClick={() => setShowRegistrarSaida(false)}>
          <Card className="w-full max-w-lg shadow-2xl bg-white border-0" onClick={e => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-100">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                     <ArrowDownToLine className="text-blue-600"/> BAIXA MANUAL DE LOTE
                  </CardTitle>
                  <button onClick={() => setShowRegistrarSaida(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Selecionar Lote (FEFO Ativo)</label>
                  <Select onValueChange={v => setFormSaida({...formSaida, lote_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Buscas por lote..." /></SelectTrigger>
                    <SelectContent>
                      {medicamentos.flatMap(m => m.lotes?.map(l => (
                        <SelectItem key={l.id} value={l.id}>{m.nome} - Lote: {l.codigo_lote_fabricante} ({l.quantidade_disponivel} un)</SelectItem>
                      )) || [])}
                    </SelectContent>
                  </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Qtd para Retirada</label>
                    <Input type="number" placeholder="0" onChange={e => setFormSaida({...formSaida, qtd: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Destino / Finalidade</label>
                    <Input placeholder="UBS, Descarte, etc" onChange={e => setFormSaida({...formSaida, destino: e.target.value})} />
                  </div>
               </div>
               <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0" size={18}/>
                  <p className="text-[10px] font-bold text-amber-900 leading-tight">ATENÇÃO: A saída manual gera uma trilha de auditoria irreversível vinculada ao seu usuário.</p>
               </div>
               <Button onClick={handleSaida} className="w-full bg-blue-900 hover:bg-black text-white font-black h-12 rounded-xl mt-4">
                  Confirmar Baixa de Lote
               </Button>
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
