'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Truck, 
  Thermometer, 
  Navigation, 
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  Activity,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api, EntregaLogistica } from '@/lib/api';

// Dynamic import for Leaflet (No SSR)
const MapRealTime = dynamic(() => import('@/components/MapRealTime'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center animate-pulse"><Loader2 className="animate-spin text-slate-400" /></div>
});

export default function MonitoramentoPage() {
  const [entregas, setEntregas] = useState<EntregaLogistica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await api.getEntregasLogistica();
      setEntregas(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const mapMarkers = (entregas || []).map(e => ({
    id: e.id,
    lat: e.lat_entrega || -22.2234 + (Math.random() - 0.5) * 0.05, // Mock coords if null
    lng: e.lng_entrega || -54.8064 + (Math.random() - 0.5) * 0.05,
    label: e.pacientes?.nome_completo || 'Entrega Pendente',
    status: e.status_entrega
  }));

  return (
    <div className="h-full w-full bg-slate-100 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* LADO ESQUERDO: MAPA REAL */}
        <ResizablePanel defaultSize={70}>
          <div className="h-full w-full relative overflow-hidden">
             <MapRealTime markers={mapMarkers} />

             {/* Indicadores Flutuantes no Mapa */}
             <div className="absolute top-6 left-6 p-4 bg-white/90 backdrop-blur rounded-xl border shadow-xl flex items-center gap-4 z-[1000] animate-in fade-in slide-in-from-left-4">
                <div className="w-10 h-10 bg-[#1E3A8A] text-white rounded-lg flex items-center justify-center"><Truck size={20}/></div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase">Monitoramento Tático</p>
                   <h3 className="text-xl font-black">{entregas.length} Entregas</h3>
                </div>
             </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* LADO DIREITO: DASHBOARD OPERACIONAL */}
        <ResizablePanel defaultSize={30} minSize={20}>
           <div className="h-full bg-white flex flex-col">
              <div className="p-6 border-b shrink-0 bg-slate-50/50">
                 <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
                    <Activity className="text-[#1E3A8A]" size={20}/> Tempo Real
                 </h2>
                 <p className="text-xs text-slate-500 font-medium mt-1">Status da Frota em Municipio Teste-MS</p>
              </div>

              <ScrollArea className="flex-1">
                 <div className="p-4 space-y-4">
                    {loading ? (
                       <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
                          <Loader2 className="animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-widest">Sincronizando...</span>
                       </div>
                    ) : entregas.length === 0 ? (
                       <div className="p-8 text-center text-slate-400">
                          <Truck size={40} className="mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-medium">Nenhuma entrega ativa no momento.</p>
                       </div>
                    ) : (
                       entregas.map((entrega) => (
                         <div key={entrega.id} className="p-4 rounded-xl border hover:bg-slate-50 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-3">
                               <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{entrega.pacientes?.nome_completo || 'S/ Nome'}</h4>
                                  <p className="text-[10px] font-mono text-slate-500 uppercase">{entrega.motoristas?.nome || 'Aguardando Motorista'}</p>
                               </div>
                               <Badge variant={entrega.status_entrega === 'FALHA' ? 'destructive' : 'outline'}>{entrega.status_entrega}</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                               <div className="bg-white p-2 rounded-lg border flex items-center gap-2">
                                  <Thermometer size={14} className="text-blue-500" />
                                  <span className="text-xs font-black">4.5°C</span>
                               </div>
                               <div className="bg-white p-2 rounded-lg border flex items-center gap-2">
                                  <Clock size={14} className="text-slate-400" />
                                  <span className="text-xs font-black">Em Rota</span>
                               </div>
                            </div>

                            <Button size="sm" variant="outline" className="w-full text-[10px] h-8 font-bold gap-2">
                               <MapPin size={12}/> Detalhes da Rota
                            </Button>
                         </div>
                       ))
                    )}
                 </div>
              </ScrollArea>

              <div className="p-6 border-t bg-slate-50 shrink-0">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500">Conformidade Total</span>
                    <span className="text-xs font-black text-emerald-600">92.4%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[92.4%]" />
                 </div>
                 <Button className="w-full mt-6 bg-[#1E3A8A] font-bold gap-2">
                   <ShieldCheck size={18}/> Audit Log Geo-Tagging
                 </Button>
              </div>
           </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}
