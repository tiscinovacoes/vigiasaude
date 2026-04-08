'use client';

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
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const MOCK_MOTORES = [
  { id: 'MOT-01', nome: 'Carlos Silva', status: 'Em Rota', temp: '4.2°C', progresso: '85%', alerta: false },
  { id: 'MOT-02', nome: 'João Souza', status: 'Risco de Desvio', temp: '5.1°C', progresso: '40%', alerta: true },
  { id: 'MOT-03', nome: 'Marcos Lima', status: 'Concluído', temp: '4.8°C', progresso: '100%', alerta: false },
];

export default function MonitoramentoPage() {
  return (
    <div className="h-full w-full bg-slate-100 flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* LADO ESQUERDO: MAPA (Simulado) */}
        <ResizablePanel defaultSize={70}>
          <div className="h-full w-full bg-slate-200 relative flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i1308!3i2295!2m3!1e0!2sm!3i633140546!3m8!2spt-BR!3sUS!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!5f2!23i1301875")' }} />
             <div className="z-10 text-slate-400 font-bold flex flex-col items-center gap-4">
                <Navigation size={48} className="animate-bounce" />
                <p className="uppercase tracking-widest text-xs">Mapa Tático de Municipio Teste-MS (Simulado)</p>
             </div>

             {/* Indicadores Flutuantes no Mapa */}
             <div className="absolute top-6 left-6 p-4 bg-white/90 backdrop-blur rounded-xl border shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="w-10 h-10 bg-[#1E3A8A] text-white rounded-lg flex items-center justify-center"><Truck size={20}/></div>
                <div><p className="text-[10px] font-black text-slate-500 uppercase">Veículos Ativos</p><h3 className="text-xl font-black">12/15</h3></div>
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
                    {MOCK_MOTORES.map((motor) => (
                      <div key={motor.id} className={`p-4 rounded-xl border transition-all cursor-pointer ${motor.alerta ? 'border-red-200 bg-red-50/50 shadow-sm' : 'hover:bg-slate-50'}`}>
                         <div className="flex justify-between items-start mb-3">
                            <div>
                               <h4 className="font-bold text-slate-900 text-sm">{motor.nome}</h4>
                               <p className="text-[10px] font-mono text-slate-500 uppercase">{motor.id}</p>
                            </div>
                            <Badge variant={motor.alerta ? 'destructive' : 'outline'}>{motor.status}</Badge>
                         </div>

                         <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-white p-2 rounded-lg border flex items-center gap-2">
                               <Thermometer size={14} className={motor.alerta ? 'text-red-500 animate-pulse' : 'text-blue-500'} />
                               <span className="text-xs font-black">{motor.temp}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border flex items-center gap-2">
                               <Clock size={14} className="text-slate-400" />
                               <span className="text-xs font-black">{motor.progresso}</span>
                            </div>
                         </div>

                         {motor.alerta ? (
                           <div className="bg-red-600 text-white p-2 rounded-lg text-[10px] font-black flex items-center gap-2 animate-pulse-red">
                              <AlertTriangle size={14}/> AGUARDANDO INTERCEPTAÇÃO RECALL
                           </div>
                         ) : (
                           <Button size="sm" variant="outline" className="w-full text-[10px] h-8 font-bold gap-2">
                              <MapPin size={12}/> Ver Trajeto
                           </Button>
                         )}
                      </div>
                    ))}
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
