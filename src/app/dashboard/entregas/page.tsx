'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Truck, MapPin, ScanBarcode, 
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Copy, ShieldAlert,
  Phone, Map, Clock, FileCheck, X, Loader2, RefreshCw
} from 'lucide-react';
import { api, type EntregaLogistica } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function EntregasLogistica() {
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [entregas, setEntregas] = useState<EntregaLogistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [warningModalAberto, setWarningModalAberto] = useState(false);
  const [proofModalAberto, setProofModalAberto] = useState(false);

  useEffect(() => {
    loadEntregas();
  }, []);

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

  // Derived Data
  const totalEntregas = entregas.length;
  const entregues = entregas.filter(e => e.status_entrega === 'ENTREGUE').length;
  const emRota = entregas.filter(e => e.status_entrega === 'EM_ROTA').length;
  const pendentes = entregas.filter(e => e.status_entrega === 'PENDENTE').length;
  const falhas = entregas.filter(e => e.status_entrega === 'FALHA').length;

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'ENTREGUE': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Entregue' };
      case 'EM_ROTA': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em Rota' };
      case 'FALHA': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Falha' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Pendente' };
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR');
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-8 space-y-6 bg-slate-50/50 min-h-full">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Programação de Entregas</h1>
          <p className="text-sm text-slate-500 mt-1">Roteirização, Conferência de Carga e Monitoramento Tático</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={loadEntregas}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-sm">
            <CalendarIcon size={16} className="text-slate-400" />
            <input 
              type="date" 
              value={dataFiltro} 
              onChange={(e) => setDataFiltro(e.target.value)}
              className="outline-none text-slate-700 bg-transparent font-medium cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* KPI HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
           <div><p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Total</p><h3 className="text-3xl font-black text-slate-800">{totalEntregas}</h3></div>
           <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center"><Truck size={24}/></div>
         </div>
         <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
           <div><p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">Entregues</p><h3 className="text-3xl font-black text-emerald-600">{entregues}</h3></div>
           <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"><CheckCircle2 size={24}/></div>
         </div>
         <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
           <div><p className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-1">Em Rota</p><h3 className="text-3xl font-black text-blue-600">{emRota}</h3></div>
           <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center"><MapPin size={24}/></div>
         </div>
         <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
           <div><p className="text-xs uppercase tracking-widest text-orange-400 font-bold mb-1">Pendentes</p><h3 className="text-3xl font-black text-orange-600">{pendentes}</h3></div>
           <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center"><Clock size={24}/></div>
         </div>
      </div>

      {/* ENTREGAS LIST */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Carregando entregas do banco de dados...</p>
        </div>
      ) : entregas.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-100">
          <Truck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-600">Nenhuma entrega registrada</p>
          <p className="text-sm text-slate-400 mt-1">As entregas cadastradas no Supabase aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-blue-500" /> Painel Operacional de Rotas
          </h2>

          {entregas.map((entrega) => {
            const isExpanded = expandedId === entrega.id;
            const statusConfig = getStatusConfig(entrega.status_entrega);
            const pacienteNome = entrega.pacientes?.nome_completo || 'Paciente não identificado';
            const pacienteEndereco = entrega.pacientes?.endereco_completo || 'Endereço não disponível';
            const motoristaNome = entrega.motoristas?.nome || 'Sem motorista';
            const motoristaPlaca = entrega.motoristas?.placa_veiculo || '-';

            return (
              <div key={entrega.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                {/* Row */}
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entrega.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      {pacienteNome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{pacienteNome}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin size={10}/> {pacienteEndereco.substring(0, 40)}{pacienteEndereco.length > 40 ? '...' : ''}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                    
                    {entrega.status_entrega === 'ENTREGUE' && (
                      <button 
                         onClick={(e) => { e.stopPropagation(); setProofModalAberto(true); }}
                         className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <FileCheck size={14}/> Ver Comprovante
                      </button>
                    )}

                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 p-6 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Detalhes da Entrega */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm">Detalhes da Entrega</h4>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between pb-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">ID Dispense:</span>
                            <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded">{entrega.dispense_id}</span>
                          </div>
                          <div className="flex justify-between pb-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Motorista:</span>
                            <span className="font-bold text-slate-800">{motoristaNome}</span>
                          </div>
                          <div className="flex justify-between pb-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Placa:</span>
                            <span className="font-mono font-bold text-slate-800">{motoristaPlaca}</span>
                          </div>
                          <div className="flex justify-between pb-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Telefone Paciente:</span>
                            <span className="font-bold text-slate-800">{entrega.pacientes?.telefone || 'Não cadastrado'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Data:</span>
                            <span className="font-bold text-slate-800">{formatDate(entrega.created_at)} às {formatTime(entrega.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* GPS / Comprovantes */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm">Rastreabilidade</h4>
                        
                        <div className="space-y-3 text-sm">
                          {entrega.lat_entrega && entrega.lng_entrega ? (
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">GPS da Entrega</p>
                              <p className="font-mono text-xs font-bold text-slate-700">{entrega.lat_entrega}, {entrega.lng_entrega}</p>
                            </div>
                          ) : (
                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                              <p className="text-[10px] uppercase font-bold text-orange-500 tracking-widest mb-1">GPS da Entrega</p>
                              <p className="text-xs font-bold text-orange-700">Coordenadas não registradas</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-xl border text-center ${entrega.foto_comprovante_url ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-100 border-slate-200'}`}>
                              <FileCheck size={20} className={`mx-auto mb-1 ${entrega.foto_comprovante_url ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <p className="text-[10px] font-bold uppercase">{entrega.foto_comprovante_url ? 'Foto OK' : 'Sem Foto'}</p>
                            </div>
                            <div className={`p-3 rounded-xl border text-center ${entrega.assinatura_digital_url ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-100 border-slate-200'}`}>
                              <FileCheck size={20} className={`mx-auto mb-1 ${entrega.assinatura_digital_url ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <p className="text-[10px] font-bold uppercase">{entrega.assinatura_digital_url ? 'Assinatura OK' : 'Sem Assinatura'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PLACEHOLDER PARA O COMPROVANTE */}
      {proofModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setProofModalAberto(false)} />
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl relative z-10 text-center animate-in zoom-in">
             <FileCheck size={48} className="mx-auto text-emerald-500 mb-4" />
             <h3 className="text-xl font-bold text-slate-800 mb-2">Comprovante Acessado</h3>
             <p className="text-slate-500">Comprovante com foto, assinatura digital e coordenadas GPS vinculados a esta entrega.</p>
             <button onClick={() => setProofModalAberto(false)} className="mt-8 px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 w-full">FECHAR</button>
          </div>
        </div>
      )}

    </div>
  );
}
