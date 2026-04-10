'use client';

import { Suspense, useState, useEffect, Fragment } from 'react';
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
  Truck
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

function EstoqueContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [busca, setBusca] = useState("");
  const [expandedMeds, setExpandedMeds] = useState<Set<string>>(new Set());
  
  // Modais
  const [showNovaEntrada, setShowNovaEntrada] = useState(false);
  const [showRegistrarSaida, setShowRegistrarSaida] = useState(false);
  
  // States para Formulários
  const [formEntrada, setFormEntrada] = useState({
    med_id: '', lote: '', validade: '', qtd: '', preco: ''
  });
  const [formSaida, setFormSaida] = useState({
    lote_id: '', qtd: '', motivo: 'Dispensão Manual', destino: ''
  });

  useEffect(() => {
    loadData();
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
    m.nome.toLowerCase().includes(busca.toLowerCase()) || m.codigo.includes(busca)
  );

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
        <div className="flex gap-3">
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
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{med.codigo} | {med.dosagem}</p>
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

      {/* Modal - Nova Entrada */}
      {showNovaEntrada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4" onClick={() => setShowNovaEntrada(false)}>
          <Card className="w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-100">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                     <Plus className="text-emerald-600"/> NOVA ENTRADA (ESTOQUE)
                  </CardTitle>
                  <button onClick={() => setShowNovaEntrada(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Medicamento Alvo</label>
                  <Select onValueChange={v => setFormEntrada({...formEntrada, med_id: v})}>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Custo Unitário (R$)</label>
                    <Input type="number" step="0.01" placeholder="0.00" onChange={e => setFormEntrada({...formEntrada, preco: e.target.value})} />
                  </div>
               </div>
               <Button onClick={handleEntrada} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-xl mt-4">
                  Processar Entrada tática
               </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal - Registrar Saída */}
      {showRegistrarSaida && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4" onClick={() => setShowRegistrarSaida(false)}>
          <Card className="w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
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
