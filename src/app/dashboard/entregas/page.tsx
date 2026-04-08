'use client';

import { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Truck, MapPin, ScanBarcode, 
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Copy, ShieldAlert,
  Phone, Map, Clock, FileCheck, X
} from 'lucide-react';

// === Typings ===
type SerialItem = {
  serialId: string;
  medicamento: string;
  batchId: string;
  altoCusto: boolean;
  custoUnitario: number;
  scanned: boolean;
};

type Entrega = {
  id: string;
  pacienteNome: string;
  endereco: string;
  status: 'Separado' | 'Em Rota' | 'Entregue';
  distanciaKm: number;
  itens: SerialItem[];
};

// === Mock Data ===
const MOCK_ENTREGAS: Entrega[] = [
  {
    id: 'ENT-001', pacienteNome: 'Ana Beatriz Mendes', endereco: 'Rua São Paulo, 45 - Vila Nova', status: 'Separado', distanciaKm: 3.2,
    itens: [
      { serialId: 'SN-A101', medicamento: 'Rivastigmina 1.5mg', batchId: 'LT-23A', altoCusto: true, custoUnitario: 350.00, scanned: false },
      { serialId: 'SN-A102', medicamento: 'Insulina NPH', batchId: 'LT-23B', altoCusto: false, custoUnitario: 42.00, scanned: false }
    ]
  },
  {
    id: 'ENT-002', pacienteNome: 'João Pedro Alves', endereco: 'Av. Joaquim Teixeira, 500 - Jd. Europa', status: 'Em Rota', distanciaKm: 5.8,
    itens: [
      { serialId: 'SN-B201', medicamento: 'Sinvastatina 20mg', batchId: 'LT-99Z', altoCusto: false, custoUnitario: 1.50, scanned: true },
    ]
  },
  {
    id: 'ENT-003', pacienteNome: 'Maria Aparecida da Silva', endereco: 'Rua das Flores, 120 - Centro', status: 'Entregue', distanciaKm: 1.2,
    itens: [
      { serialId: 'SN-C301', medicamento: 'Losartana 50mg', batchId: 'LT-88Y', altoCusto: false, custoUnitario: 0.80, scanned: true }
    ]
  }
];

export default function EntregasLogistica() {
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [entregas, setEntregas] = useState<Entrega[]>(MOCK_ENTREGAS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [warningModalAberto, setWarningModalAberto] = useState(false);
  const [proofModalAberto, setProofModalAberto] = useState(false);

  // Derivated Data
  const totalEntregas = entregas.length;
  const entregues = entregas.filter(e => e.status === 'Entregue').length;
  const pendentes = totalEntregas - entregues;
  
  const totalItensCarga = entregas.reduce((acc, e) => acc + e.itens.length, 0);
  const escaneadosCarga = entregas.reduce((acc, e) => acc + e.itens.filter(i => i.scanned).length, 0);
  const progressoCarga = Math.round((escaneadosCarga / (totalItensCarga || 1)) * 100);

  // Handler: Scan Serial Number
  const handleScan = (entregaId: string, serialId: string) => {
    // In real app, this calls Supabase to validate `codigo_serial` in `unidades_serializadas`
    setEntregas(prev => prev.map(e => {
      if (e.id === entregaId) {
        const novosItens = e.itens.map(i => i.serialId === serialId ? { ...i, scanned: true } : i);
        // Autocomplete rule: if all scanned, route can start (Mock automatic transition to 'Em Rota')
        // In reality, motorista clicks "Iniciar Rota" when 100% is reached.
        return { ...e, itens: novosItens };
      }
      return e;
    }));
  };

  // Valor em Risco do Modal
  const valorEmRisco = useMemo(() => {
    // Simulation of calculating 'Alto Custo' meds on the specific delivery that triggered the alert
    const entregaComDesvio = entregas[0]; // mock ENT-001
    return entregaComDesvio.itens
      .filter(i => i.altoCusto)
      .reduce((sum, item) => sum + item.custoUnitario, 0);
  }, [entregas]);

  return (
    <div className="p-8 space-y-6 bg-slate-50/50 min-h-full">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Programação de Entregas</h1>
          <p className="text-sm text-slate-500 mt-1">Roteirização, Conferência de Carga e Monitoramento Tático</p>
        </div>
        <div className="flex items-center gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
           <div><p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Total Programado</p><h3 className="text-3xl font-black text-slate-800">{totalEntregas}</h3></div>
           <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center"><Truck size={24}/></div>
         </div>
         <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
           <div><p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">Entregues</p><h3 className="text-3xl font-black text-emerald-600">{entregues}</h3></div>
           <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"><CheckCircle2 size={24}/></div>
         </div>
         <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
           <div><p className="text-xs uppercase tracking-widest text-orange-400 font-bold mb-1">Pendentes / Em Rota</p><h3 className="text-3xl font-black text-orange-600">{pendentes}</h3></div>
           <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center"><Clock size={24}/></div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* COLUNA ESQUERDA: LISTA DE ENTREGAS */}
        <div className="xl:col-span-3 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-blue-500" /> Painel Operacional de Rotas
          </h2>

          {entregas.map((entrega) => {
            const isExpanded = expandedId === entrega.id;
            const itensScanned = entrega.itens.filter(i => i.scanned).length;
            const totalItens = entrega.itens.length;
            const concluido = itensScanned === totalItens;

            return (
              <div key={entrega.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                {/* Resumo do Card */}
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entrega.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      {entrega.id.split('-')[1]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{entrega.pacienteNome}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{entrega.endereco} • <span className="font-medium text-slate-700">{entrega.distanciaKm} km da base</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                      entrega.status === 'Entregue' ? 'bg-emerald-100 text-emerald-700' :
                      entrega.status === 'Em Rota' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {entrega.status}
                    </span>
                    
                    {entrega.status === 'Entregue' && (
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

                {/* Área Expandida (Conferência de Carga e Rastreabilidade) */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 p-6 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-800">Conferência de Rastreabilidade S/N</h4>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${concluido ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {itensScanned} de {totalItens} Itens Conferidos
                      </span>
                    </div>

                    <div className="space-y-3">
                      {entrega.itens.map(item => (
                        <div key={item.serialId} className={`flex items-center justify-between p-4 rounded-xl border ${item.scanned ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800 text-sm">{item.medicamento}</p>
                              {item.altoCusto && <span className="bg-red-100 text-red-600 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">Alto Custo</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium font-mono">
                              <p>LOTE: {item.batchId}</p>
                              <p className="flex items-center gap-1"><Copy size={12}/> S/N: {item.serialId}</p>
                            </div>
                          </div>
                          
                          {item.scanned ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold bg-emerald-100 px-3 py-1.5 rounded-lg">
                              <CheckCircle2 size={16} /> Validado
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleScan(entrega.id, item.serialId)}
                              className="flex items-center gap-1.5 bg-[#1A2B6D] hover:bg-[#121f4f] text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95"
                            >
                              <ScanBarcode size={16} /> Escanear S/N
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {!concluido && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 text-blue-800 text-xs rounded-lg font-medium">
                        Info: A rota só pode ser iniciada pelo motorista após a bipagem (Scan) de 100% dos códigos seriais contidos nesta ordem.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* COLUNA DIREITA: SIDEBAR (Progresso de Carga e Alertas) */}
        <div className="xl:col-span-1 space-y-6">
           
           {/* Barra de Progresso do Roteiro */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-4 text-sm">Carregamento da Van</h3>
             <div className="flex justify-between items-end mb-2">
               <span className="text-3xl font-black text-slate-800">{progressoCarga}%</span>
               <span className="text-xs text-slate-400 font-bold uppercase mb-1">{escaneadosCarga} de {totalItensCarga} Validados</span>
             </div>
             <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
               <div className={`h-full transition-all duration-500 ${progressoCarga === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progressoCarga}%` }} />
             </div>
           </div>

           {/* Alertas Ativos na Rota */}
           <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5 text-white">
                <ShieldAlert size={120} />
              </div>
              <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                <ShieldAlert size={18} className="text-red-400" /> Alertas de Rota (Real-Time)
              </h3>
              
              <div className="space-y-3 relative z-10">
                {/* Desvio Detectado Card */}
                <button 
                  onClick={() => setWarningModalAberto(true)}
                  className="w-full text-left bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 p-4 rounded-xl transition-colors group"
                >
                   <div className="flex items-center gap-2 mb-1">
                     <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                     <h4 className="font-bold text-red-200 text-sm group-hover:text-red-100">Desvio de Rota</h4>
                   </div>
                   <p className="text-xs text-red-200/60 leading-relaxed font-medium">Veículo 04 desviou &gt; 1km da rota otimizada. Risco potencial detectado.</p>
                </button>

                {/* Tempo Parado Card */}
                <div className="w-full text-left bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl cursor-not-allowed">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="w-2 h-2 rounded-full bg-orange-500" />
                     <h4 className="font-bold text-orange-200 text-sm">Tempo Parado</h4>
                   </div>
                   <p className="text-xs text-orange-200/60 leading-relaxed font-medium">Veículo 02 parado há mais de 15 minutos em área não cadastrada.</p>
                </div>
              </div>
           </div>

        </div>

      </div>

      {/* MODAL DE SEGURANÇA (DESVIO DE ROTA) */}
      {warningModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setWarningModalAberto(false)} />
          
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95">
             <div className="bg-red-600 p-6 flex items-start gap-4">
               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                 <ShieldAlert size={28} className="text-white" />
               </div>
               <div className="text-white pt-1">
                  <h2 className="text-xl font-bold">ALERTA DE SEGURANÇA</h2>
                  <p className="text-red-100 text-sm font-medium mt-1">Desvio Crítico de Rota Georreferenciada</p>
               </div>
             </div>

             <div className="p-6 space-y-6">
                
                {/* Inteligência de Risco */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center shadow-inner">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Cálculo de Risco da Carga</p>
                    <p className="text-sm font-bold text-slate-700">Valor em Risco (Medicamentos AC)</p>
                  </div>
                  <h2 className="text-2xl font-black text-red-600">R$ {valorEmRisco.toFixed(2).replace('.',',')}</h2>
                </div>

                {/* Detalhes Técnicos do Desvio */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                     <span className="text-sm font-semibold text-slate-500">Hora da Detecção:</span>
                     <span className="text-sm font-bold text-slate-800">Hoje, 14:32:05</span>
                   </div>
                   <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                     <span className="text-sm font-semibold text-slate-500">Motorista:</span>
                     <span className="text-sm font-bold text-slate-800">Carlos dos Santos (Van 04)</span>
                   </div>
                   <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                     <span className="text-sm font-semibold text-slate-500">Localização GPS:</span>
                     <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">-22.2341, -54.7891</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-semibold text-slate-500">Distância da Rota Base:</span>
                     <span className="text-sm font-black text-red-600 px-2 py-1 bg-red-50 rounded">1.4 km de desvio</span>
                   </div>
                </div>

                {/* Ações Geotáticas */}
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-3 bg-[#1A2B6D] hover:bg-[#121f4f] text-white rounded-xl font-bold shadow-md transition-all">
                    <Map size={18} /> Ver no Mapa
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all">
                    <Phone size={18} /> Acionar Motorista
                  </button>
                </div>
             </div>
             
             <button onClick={() => setWarningModalAberto(false)} className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors">
               <X size={20} />
             </button>
          </div>
        </div>
      )}

      {/* MODAL PLACEHOLDER PARA O COMPROVANTE */}
      {proofModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setProofModalAberto(false)} />
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl relative z-10 text-center animate-in zoom-in">
             <FileCheck size={48} className="mx-auto text-emerald-500 mb-4" />
             <h3 className="text-xl font-bold text-slate-800 mb-2">Comprovante Acessado</h3>
             <p className="text-slate-500">Este modal já foi implementado previamente na gestão do paciente com a tríade de foto, assinatura e timestamp.</p>
             <button onClick={() => setProofModalAberto(false)} className="mt-8 px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 w-full">FECHAR</button>
          </div>
        </div>
      )}

    </div>
  );
}
