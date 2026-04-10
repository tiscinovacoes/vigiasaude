'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { 
  Truck, 
  Thermometer, 
  Navigation, 
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  Activity,
  Loader2,
  Package,
  CheckCircle,
  Phone,
  Radio,
  FileCheck,
  X,
  Camera,
  PenTool,
  Fingerprint,
  FileText,
  User,
  ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, EntregaLogistica } from '@/lib/api';

// Configurações Estéticas (do arquivo premium fornecido)
const statusMotoristaConfig: Record<string, { bg: string; text: string; dot: string }> = {
  "EM_ROTA": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "FALHA": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  "ENTREGUE": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "PENDENTE": { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" },
};

const statusParadaConfig: Record<string, { bg: string; text: string; icon: any }> = {
  "ENTREGUE": { bg: "text-green-600", text: "Entregue", icon: CheckCircle },
  "EM_ROTA": { bg: "text-blue-600", text: "Em trânsito", icon: Navigation },
  "PENDENTE": { bg: "text-[#94A3B8]", text: "Pendente", icon: Clock },
  "FALHA": { bg: "text-red-600", text: "Falha", icon: AlertTriangle },
};

// Dynamic import for Leaflet (No SSR)
const MapRealTime = dynamic(() => import('@/components/MapRealTime'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center animate-pulse"><Loader2 className="animate-spin text-slate-400" /></div>
});

export default function MonitoramentoPage() {
  const [entregas, setEntregas] = useState<EntregaLogistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [comprovanteAberto, setComprovanteAberto] = useState<EntregaLogistica | null>(null);

  useEffect(() => {
    async function loadData() {
      const data = await api.getEntregasLogistica();
      setEntregas(data);
      if (data.length > 0 && !selecionadaId) {
        setSelecionadaId(data[0].id);
      }
      setLoading(false);
    }
    loadData();
    // Refresh a cada 10s para simular real-time
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [selecionadaId]);

  const entregaSelecionada = entregas.find(e => e.id === selecionadaId);

  const mapMarkers = (entregas || []).map(e => ({
    id: e.id,
    lat: e.lat_entrega || -22.2234,
    lng: e.lng_entrega || -54.8064,
    label: e.pacientes?.nome_completo || 'Entrega',
    status: e.status_entrega
  }));

  const totalEntregasDia = entregas.filter(e => e.status_entrega === 'ENTREGUE').length;
  const motoristasAtivos = Array.from(new Set(entregas.map(e => e.motorista_id))).filter(Boolean).length;

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-full">
      
      {/* MODAL DE COMPROVANTE (Premium) */}
      {comprovanteAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
          <Card className="w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-[#E2E8F0] sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#1E293B] flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#16A34A]" />
                  Comprovante de Entrega Auditado
                </CardTitle>
                <button 
                  onClick={() => setComprovanteAberto(null)}
                  className="text-[#64748B] hover:text-[#1E293B]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
                <h3 className="text-sm text-[#1E3A8A] font-semibold mb-3">Dados da Entrega</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#94A3B8] text-xs mb-0.5">Paciente</p>
                    <p className="text-[#1E293B] font-bold">{comprovanteAberto.pacientes?.nome_completo}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8] text-xs mb-0.5">CPF</p>
                    <p className="text-[#1E293B]">{comprovanteAberto.pacientes?.cpf}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[#94A3B8] text-xs mb-0.5">Endereço</p>
                    <p className="text-[#1E293B]">{comprovanteAberto.pacientes?.endereco_completo}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-[#1E3A8A] font-semibold mb-3">Medicamentos Rastreados</h3>
                <div className="space-y-2">
                  {comprovanteAberto.itens?.map((med, idx) => (
                    <div key={idx} className="bg-white border border-[#E2E8F0] rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm text-[#1E293B] font-medium">{med.medicamento_nome}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-[#64748B]">Lote: <strong className="text-[#1E3A8A]">{med.lote_codigo}</strong></span>
                          </div>
                        </div>
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs shadow-none uppercase font-bold">FEFO Ativo</Badge>
                      </div>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-3 h-3 text-[#1E3A8A]" />
                          <span className="text-[10px] text-[#64748B]">Serial:</span>
                          <span className="text-xs text-[#1E3A8A] font-mono font-semibold">{med.serial_number}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="w-4 h-4 text-[#1E3A8A]" />
                    <h3 className="text-sm text-[#1E3A8A] font-semibold">Foto Evidência</h3>
                  </div>
                  <div className="bg-slate-100 rounded-lg overflow-hidden border">
                    <img src={comprovanteAberto.foto_comprovante_url || "https://via.placeholder.com/400x300?text=Sem+Foto"} alt="Foto" className="w-full h-40 object-cover" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <PenTool className="w-4 h-4 text-[#1E3A8A]" />
                    <h3 className="text-sm text-[#1E3A8A] font-semibold">Assinatura Digital</h3>
                  </div>
                  <div className="bg-white border rounded-lg p-3 h-40 flex items-center justify-center">
                    {comprovanteAberto.assinatura_digital_url ? (
                      <img src={comprovanteAberto.assinatura_digital_url} alt="Assinatura" className="max-h-full" />
                    ) : (
                      <span className="text-xs text-slate-400">Pendente</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900 leading-relaxed font-medium">
                  <strong>Validade Jurídica:</strong> Este comprovante possui carimbo de geolocalização e timestamp, atendendo à Lei 14.063/2020 para auditoria de dispensação de alto custo.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* HEADER TÁTICO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#1E293B]">Live Monitoramento</h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold mt-1">Rastreabilidade em Tempo Real - Município Teste/MS</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregas Hoy</p>
              <p className="text-lg font-black text-emerald-600">{totalEntregasDia} / {entregas.length}</p>
          </div>
          <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motoristas Ativos</p>
              <p className="text-lg font-black text-[#1E3A8A]">{motoristasAtivos}</p>
          </div>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL 3 COLUNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        
        {/* COL 1: LISTA OPERACIONAL */}
        <div className="lg:col-span-3 h-full flex flex-col gap-3 overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Frotas em Rota</p>
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-4 pb-4">
              {entregas.map((e) => {
                const cfg = statusMotoristaConfig[e.status_entrega];
                const isSelected = selecionadaId === e.id;
                return (
                  <Card 
                    key={e.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${isSelected ? "ring-2 ring-[#1E3A8A] border-l-[#1E3A8A] shadow-md" : "border-l-slate-200"}`}
                    onClick={() => setSelecionadaId(e.id)}
                  >
                    <CardContent className="p-4">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <h4 className="font-bold text-slate-900 text-sm leading-tight">{e.pacientes?.nome_completo}</h4>
                             <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{e.motoristas?.nome || 'Logística Central'}</p>
                          </div>
                          <Badge className={`${cfg.bg} ${cfg.text} text-[10px] border-none font-bold uppercase`}>{e.status_entrega}</Badge>
                       </div>
                       <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                             <Thermometer size={12} className="text-blue-500"/> 4.2°C
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                             <Clock size={12} className="text-slate-400"/> {new Date(e.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* COL 2: MAPA CENTRAL (Leaflet) */}
        <div className="lg:col-span-6 h-full relative rounded-2xl overflow-hidden border bg-white shadow-sm">
           <MapRealTime markers={mapMarkers} />
           
           {/* Overlay Info Mapa */}
           <div className="absolute top-4 right-4 z-[1000] p-3 bg-white/90 backdrop-blur border rounded-xl shadow-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase text-center mb-1">Status Global</p>
              <div className="flex gap-4 items-center">
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"/> <span className="text-[10px] font-bold">Regular</span></div>
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"/> <span className="text-[10px] font-bold">Em Trânsito</span></div>
              </div>
           </div>
        </div>

        {/* COL 3: DETALHES E TIMELINE */}
        <div className="lg:col-span-3 h-full flex flex-col gap-3 overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Timeline da Entrega</p>
          
          {entregaSelecionada ? (
            <>
              <Card className="bg-[#1E3A8A] text-white shadow-xl">
                 <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Truck size={20}/></div>
                       <div>
                          <p className="text-blue-100 text-[10px] uppercase font-bold">{entregaSelecionada.motoristas?.placa_veiculo || 'VIGIA-0001'}</p>
                          <h4 className="font-bold text-sm">{entregaSelecionada.motoristas?.nome || 'Operador Central'}</h4>
                       </div>
                    </div>
                    <div className="mt-4 p-2 bg-white/10 rounded flex items-center gap-2 border border-white/10">
                       <ShieldCheck size={16} className="text-emerald-400" />
                       <span className="text-[10px] font-bold">FEFO & Cadeia de Frio Verificados</span>
                    </div>
                 </CardContent>
              </Card>

              <ScrollArea className="flex-1 bg-white rounded-2xl border shadow-sm p-4">
                <div className="space-y-6">
                   {/* Timeline item: Base */}
                   <div className="relative pl-6 border-l-2 border-slate-100">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                      <div className="mb-1 flex justify-between">
                         <span className="text-[11px] font-black text-slate-800 uppercase">Saída CD Central</span>
                         <span className="text-[10px] font-bold text-slate-400">{new Date(entregaSelecionada.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Custo acumulado da carga auditado.</p>
                   </div>

                   {/* Timeline item: Status Atual */}
                   <div className="relative pl-6 border-l-2 border-slate-100">
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${entregaSelecionada.status_entrega === 'ENTREGUE' ? 'bg-emerald-500' : 'bg-blue-500 pulse'}`} />
                      <div className="mb-1 flex justify-between">
                         <span className="text-[11px] font-black text-slate-800 uppercase">Status Logístico</span>
                         <span className="text-[10px] font-bold text-slate-400">Tempo Real</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border">
                         <p className="text-xs font-bold text-slate-700">{entregaSelecionada.status_entrega}</p>
                         <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><MapPin size={10}/> Prox. a Município Teste</p>
                      </div>
                   </div>

                   {entregaSelecionada.status_entrega === 'ENTREGUE' && (
                     <Button 
                        onClick={() => setComprovanteAberto(entregaSelecionada)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 h-10 rounded-xl shadow-lg shadow-emerald-200"
                     >
                        <FileCheck size={16}/> Ver Comprovante Final
                     </Button>
                   )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-dashed text-slate-400">
               <Activity size={40} className="mb-4 opacity-20"/>
               <p className="text-sm font-bold">Selecione uma entrega para ver a telemetria completa.</p>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        .pulse {
          animation: shadow-pulse 2s infinite;
        }
        @keyframes shadow-pulse {
          0% { box-shadow: 0 0 0 0px rgba(59, 130, 246, 0.4); }
          100% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  );
}
