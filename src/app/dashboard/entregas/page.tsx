'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Truck, MapPin, ScanBarcode, 
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  Clock, FileCheck, X, Loader2, RefreshCw, Route, Plus,
  Package, CheckCircle, Hash, Fingerprint, Link2,
  User, FileText, Camera, ShieldAlert, ScanLine, CheckSquare, AlertCircle
} from 'lucide-react';
import { api, type EntregaLogistica } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';


const statusConfig: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  PENDENTE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Package },
  EM_ROTA: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Truck },
  ENTREGUE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  FALHA: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle },
};

export default function EntregasLogistica() {
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [entregas, setEntregas] = useState<EntregaLogistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  
  const [itensEscaneados, setItensEscaneados] = useState<Set<string>>(new Set());
  const [logRastreabilidadeAberto, setLogRastreabilidadeAberto] = useState(false);
  const [comprovanteAberto, setComprovanteAberto] = useState(false);
  const [alertaAberto, setAlertaAberto] = useState(false);
  const [entregaSelecionada, setEntregaSelecionada] = useState<EntregaLogistica | null>(null);

  const [showNovoMotorista, setShowNovoMotorista] = useState(false);
  const [formMotorista, setFormMotorista] = useState({
    nome: '', cnh: '', placa_veiculo: ''
  });

  useEffect(() => {
    loadEntregas();
  }, []);

  const handleNovoMotorista = async () => {
    if (!formMotorista.nome || !formMotorista.cnh || !formMotorista.placa_veiculo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const res = await api.createMotorista({
      nome: formMotorista.nome,
      cnh: formMotorista.cnh,
      placa_veiculo: formMotorista.placa_veiculo
    });

    if (res.success) {
      toast.success("Motorista cadastrado com sucesso!");
      setShowNovoMotorista(false);
      setFormMotorista({ nome: '', cnh: '', placa_veiculo: '' });
    } else {
      toast.error("Erro ao cadastrar motorista: " + res.error);
    }
  };

  const loadEntregas = async () => {
    setLoading(true);
    try {
      const data = await api.getEntregasLogistica();
      setEntregas(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpansao = (id: string) => {
    setExpandido(expandido === id ? null : id);
  };

  const abrirLogRastreabilidade = (entrega: EntregaLogistica) => {
    if (entrega.status_entrega === "ENTREGUE") {
      setEntregaSelecionada(entrega);
      setLogRastreabilidadeAberto(true);
    }
  };

  const abrirComprovante = (entrega: EntregaLogistica, event: React.MouseEvent) => {
    event.stopPropagation();
    setEntregaSelecionada(entrega);
    setComprovanteAberto(true);
  };

  const toggleEscanear = (unidadeId: string) => {
    const novosEscaneados = new Set(itensEscaneados);
    if (novosEscaneados.has(unidadeId)) {
      novosEscaneados.delete(unidadeId);
    } else {
      novosEscaneados.add(unidadeId);
    }
    setItensEscaneados(novosEscaneados);
  };

  // KPIs Lineares
  const totalEntregas = entregas.length;
  const entregues = entregas.filter(e => e.status_entrega === 'ENTREGUE').length;
  const pendentes = entregas.filter(e => e.status_entrega !== 'ENTREGUE').length;

  // KPIs Progress Bar Router
  const entregasEmTransito = entregas.filter(e => e.status_entrega === 'PENDENTE' || e.status_entrega === 'EM_ROTA');
  const totalItensRota = entregasEmTransito.reduce((sum, e) => sum + (e.itens?.length || 0), 0);
  const itensEscaneadosRota = entregasEmTransito.flatMap((e) => e.itens || [])
      .filter((m) => itensEscaneados.has(m.id)).length;
  const percentualEscaneado = totalItensRota > 0 ? Math.round((itensEscaneadosRota / totalItensRota) * 100) : 0;

  return (
    <div className="p-8 space-y-6 bg-slate-50/50 min-h-full">

      {/* Modal de Log de Rastreabilidade */}
      {logRastreabilidadeAberto && entregaSelecionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl shadow-xl border-0">
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#1E293B] flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[#1E3A8A]" />
                  Log de Rastreabilidade - Entrega Completa
                </CardTitle>
                <button
                  onClick={() => setLogRastreabilidadeAberto(false)}
                  className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-[#1E3A8A]" />
                  <div>
                    <p className="text-sm text-[#1E3A8A] font-semibold">Paciente</p>
                    <p className="text-lg text-[#1E293B] font-bold">
                      {entregaSelecionada.pacientes?.nome_completo}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#64748B]">Endereço</p>
                    <p className="text-[#1E293B] font-medium">
                      {entregaSelecionada.pacientes?.endereco_completo}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#64748B]">Status</p>
                    <Badge className="bg-green-100 text-green-700 border-green-300 mt-1">
                      {entregaSelecionada.status_entrega}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm text-[#1E293B] font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1E3A8A]" />
                  Histórico e Rastreabilidade do Lote
                </h4>

                {entregaSelecionada.itens?.map((med, idx) => (
                  <Card key={idx} className="border-l-4 border-l-[#1E3A8A]">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-[#1E3A8A]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[#1E293B] font-semibold">
                            {med.medicamento_nome}
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#F8FAFC] rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Hash className="w-4 h-4 text-[#64748B]" />
                          <span className="text-[#64748B]">Lote:</span>
                          <span className="font-mono text-[#1E3A8A] font-semibold">
                            {med.lote_codigo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Fingerprint className="w-4 h-4 text-[#64748B]" />
                          <span className="text-[#64748B]">Serial Number:</span>
                          <span className="font-mono text-[#1E3A8A] font-semibold">
                            {med.serial_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-[#64748B]" />
                          <span className="text-[#64748B]">ID Relacional DB:</span>
                          <span className="font-mono text-[#1E3A8A] font-semibold">
                            {med.id.substring(0,8)}...
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#64748B] mb-1">Criação / Saída</p>
                      <p className="text-[#1E293B] font-medium">
                        {new Date(entregaSelecionada.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#64748B] mb-1">Motorista</p>
                      <p className="text-[#1E293B] font-medium">
                        {entregaSelecionada.motoristas?.nome || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setLogRastreabilidadeAberto(false)} className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white cursor-pointer">
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal - Novo Motorista */}
      {showNovoMotorista && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4" onClick={() => setShowNovoMotorista(false)}>
          <Card className="w-full max-w-md shadow-xl bg-white border-0" onClick={e => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-100">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                     <Plus className="text-[#1A2B6D]"/> NOVO MOTORISTA
                  </CardTitle>
                  <button onClick={() => setShowNovoMotorista(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Nome Completo *</label>
                  <Input placeholder="Nome do Motorista" value={formMotorista.nome} onChange={e => setFormMotorista({...formMotorista, nome: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">CNH *</label>
                    <Input placeholder="Número CNH" value={formMotorista.cnh} onChange={e => setFormMotorista({...formMotorista, cnh: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Placa do Veículo *</label>
                    <Input placeholder="Ex: ABC-1234" value={formMotorista.placa_veiculo} onChange={e => setFormMotorista({...formMotorista, placa_veiculo: e.target.value})} />
                  </div>
               </div>
               <Button onClick={handleNovoMotorista} className="w-full bg-[#1A2B6D] hover:bg-[#121f4f] text-white font-black h-12 rounded-xl mt-4">
                  Cadastrar Motorista
               </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Comprovante Simples */}
      {comprovanteAberto && entregaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setComprovanteAberto(false)} />
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl relative z-10 text-center animate-in zoom-in">
             <FileCheck size={48} className="mx-auto text-emerald-500 mb-4" />
             <h3 className="text-xl font-bold text-slate-800 mb-2">Comprovante de Entrega</h3>
             <p className="text-slate-500 mb-4 text-sm">Coordenadas: {entregaSelecionada.lat_entrega || 'N/A'}, {entregaSelecionada.lng_entrega || 'N/A'}</p>
             <div className="flex gap-4 justify-center mb-6">
                {entregaSelecionada.foto_comprovante_url && (
                    <div className="border p-2 rounded bg-slate-50"><Camera size={32} className="text-emerald-500 mx-auto" /><p className="text-xs font-bold mt-1">Foto Ok</p></div>
                )}
                {entregaSelecionada.assinatura_digital_url && (
                    <div className="border p-2 rounded bg-slate-50"><CheckSquare size={32} className="text-emerald-500 mx-auto" /><p className="text-xs font-bold mt-1">Assinatura Ok</p></div>
                )}
             </div>
             <button onClick={() => setComprovanteAberto(false)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 w-full">FECHAR</button>
          </div>
        </div>
      )}

      {/* Título & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1E293B]">Programação de Entregas</h1>
          <p className="text-[#64748B] mt-1 font-medium">Logística diária, Roteirização e Conferência de Carga</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNovoMotorista(true)} className="bg-[#1A2B6D] hover:bg-[#121f4f] text-white cursor-pointer font-bold gap-2">
             <Plus size={16} /> Novo Motorista
          </Button>
          {/* Modal Novo Motorista — transparência corrigida (bg-white border-0) */}
          <Button onClick={loadEntregas} variant="outline" className="text-slate-600 gap-2">
             <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Atualizar DB
          </Button>
          <Button className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white cursor-pointer font-bold">
            <Route className="w-4 h-4 mr-2" />
            Gerar Rota Otimizada
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
             <CalendarIcon className="w-5 h-5 text-[#1E3A8A]" />
             <span className="text-[#1E293B]">
               Data selecionada:{" "}
               <strong>
                 {new Date(dataFiltro).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", })}
               </strong>
             </span>
          </div>
          <div className="flex gap-4 text-sm bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
            <span className="text-[#64748B]">Total: <strong className="text-[#1E293B]">{totalEntregas}</strong></span>
            <span className="text-[#64748B]">Entregues: <strong className="text-green-600">{entregues}</strong></span>
            <span className="text-[#64748B]">Pendentes: <strong className="text-amber-600">{pendentes}</strong></span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Entregas List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
             <div className="p-16 text-center bg-white rounded-2xl border border-slate-100"><Loader2 size={32} className="mx-auto animate-spin text-blue-500 mb-3" /></div>
          ) : entregas.length === 0 ? (
             <div className="p-16 text-center bg-white rounded-2xl border border-slate-100"><Truck size={40} className="mx-auto text-slate-300 mb-3" /><p className="font-bold text-slate-600">Nenhuma entrega registrada</p></div>
          ) : entregas.map((e) => {
            const cfg = statusConfig[e.status_entrega] || statusConfig.PENDENTE;
            const Icon = cfg.icon;
            const isExpandido = expandido === e.id;
            const conferido = false; // Mock until field added to DB
            const alerta = false; // Mock alerta roteamento (simulate via modal trigger directly if needed)

            return (
              <Card key={e.id} className="shadow-sm border-slate-200 hover:shadow-md transition-all overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-4 cursor-pointer" onClick={() => e.status_entrega === "ENTREGUE" ? abrirLogRastreabilidade(e) : toggleExpansao(e.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg} shrink-0`}>
                          <Icon className={`w-6 h-6 ${cfg.text}`} />
                        </div>
                        <div className="flex-1 mt-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-slate-800 font-bold text-lg leading-none">{e.pacientes?.nome_completo}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                            <span className="text-sm text-[#64748B] font-medium">{e.pacientes?.endereco_completo}</span>
                          </div>
                          
                          <div className="mt-3 flex flex-wrap gap-2">
                            {e.itens?.map((med, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-600">
                                {med.medicamento_nome}
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Fingerprint className="w-3 h-3 text-[#1E3A8A]" />
                                  <span className="font-mono text-[10px] text-[#1E3A8A] font-bold">LOTE: {med.lote_codigo}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {e.status_entrega === "ENTREGUE" && (
                            <div className="mt-4">
                              <Button onClick={(event) => abrirComprovante(e, event)} className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white cursor-pointer text-xs h-8 px-3 font-bold">
                                <FileText className="w-3.5 h-3.5 mr-1.5" /> Ver Comprovante e Assinatura
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 pt-1">
                        <Badge className={`${cfg.bg} ${cfg.text} ${cfg.border} border shadow-none px-3 py-1 font-bold tracking-widest uppercase text-[10px]`}>
                          {e.status_entrega.replace('_', ' ')}
                        </Badge>
                        {e.status_entrega !== "ENTREGUE" && (
                          isExpandido ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        )}
                        {/* Simular App driver para demos locais */}
                        {(e.status_entrega === "PENDENTE" || e.status_entrega === "EM_ROTA") && (
                             <button
                               onClick={(ev) => { ev.stopPropagation(); window.open(`/dashboard/entregas/confirmacao`, '_blank') }}
                               className="text-[10px] font-black text-indigo-500 uppercase hover:underline mt-2 tracking-widest text-right"
                             >
                               APP CONFIRMAÇÃO
                             </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpandido && (
                    <div className="border-t border-[#E2E8F0] animate-in slide-in-from-top-2">
                      <div className="p-4 bg-[#F8FAFC]">
                        <h4 className="text-sm text-[#1E293B] font-black mb-3 flex items-center gap-2 tracking-tight">
                          <Link2 className="w-4 h-4 text-[#1E3A8A]" />
                          Conferência de Carga (Checklist Veicular)
                        </h4>
                        <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
                                <th className="text-left py-3 px-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Medicamento</th>
                                <th className="text-left py-3 px-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Rastreabilidade</th>
                                <th className="text-center py-3 px-4 text-slate-500 text-[10px] font-black uppercase tracking-widest border-l border-slate-100">Bipar Saída</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {e.itens?.map((med, idx) => {
                                const escaneado = itensEscaneados.has(med.id);
                                return (
                                  <tr key={idx} className={`transition-colors ${escaneado ? "bg-green-50/50" : "hover:bg-slate-50"}`}>
                                    <td className="py-3 px-4">
                                      <span className="text-[#1E293B] font-bold">{med.medicamento_nome}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <Hash className="w-3.5 h-3.5 text-[#64748B]" />
                                          <span className="text-xs text-[#64748B] font-medium">Lote: <span className="font-mono text-[#1E3A8A] font-bold">{med.lote_codigo}</span></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <ScanBarcode className="w-3.5 h-3.5 text-[#64748B]" />
                                          <span className="text-xs text-[#64748B] font-medium">Serial: <span className="font-mono text-[#1E3A8A] font-bold">{med.serial_number}</span></span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center border-l border-slate-100 bg-slate-50/30">
                                      <button
                                        onClick={() => toggleEscanear(med.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all w-28 mx-auto flex items-center justify-center gap-1.5 ${
                                          escaneado
                                            ? "bg-green-100 text-green-700 border border-green-300"
                                            : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 shadow-sm"
                                        }`}
                                      >
                                        {escaneado ? (
                                          <><CheckSquare className="w-3.5 h-3.5" /> Bipado</>
                                        ) : (
                                          <><ScanLine className="w-3.5 h-3.5" /> Bipar</>
                                        )}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* SIDEBAR WIDGETS */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 border-b border-[#E2E8F0] bg-slate-50/80 rounded-t-xl">
              <CardTitle className="text-[#1E293B] font-black uppercase tracking-widest text-xs flex items-center gap-2">
                 <Route size={16} className="text-indigo-500" /> Roteirizador IA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <Card className="mb-5 border border-slate-200 shadow-none bg-slate-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                       <ScanLine className="w-5 h-5 text-indigo-500" />
                       <span className="text-sm font-black text-slate-700 uppercase tracking-widest text-[10px]">Conferência Veículo</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl text-[#1E3A8A] font-black leading-none">{itensEscaneadosRota}/{totalItensRota}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{percentualEscaneado}% Bipado</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${percentualEscaneado === 100 ? "bg-emerald-500" : percentualEscaneado >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
                        style={{ width: `${percentualEscaneado}%` }}
                      />
                    </div>
                    {percentualEscaneado < 100 ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase">
                        <AlertCircle className="w-3 h-3" /> Aguardando bipagem de carga
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                        <CheckCircle className="w-3 h-3" /> Carga completa - Iniciar Rota
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mapa de Rota Placeholder */}
              <div className="bg-slate-100 rounded-xl p-6 border border-slate-200 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/12/1505/2361.png')] opacity-30 mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-1000 bg-cover bg-center" />
                 <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white mb-3">
                       <MapPin size={24} />
                    </div>
                    <p className="font-black text-lg text-slate-800">Mapa de Integração</p>
                    <p className="font-medium text-xs text-slate-600 mt-1 max-w-[200px]">Roteamento tático processado. Veículos em monitoramento GPS.</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
