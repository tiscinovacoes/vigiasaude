'use client';

import { useParams, useRouter } from 'next/navigation';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTCooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, Target, Clock, RotateCcw, Activity, AlertTriangle, 
  Thermometer, FileCheck, CheckCircle2, ShieldAlert, Truck
} from 'lucide-react';

const MOCK_MOT = { id: 'm001', nome: 'Carlos dos Santos' };

const LINE_DATA = [
  { month: 'Set', pontualidade: 88, efetividade: 90 },
  { month: 'Out', pontualidade: 92, efetividade: 94 },
  { month: 'Nov', pontualidade: 95, efetividade: 96 },
  { month: 'Dez', pontualidade: 96, efetividade: 98 },
  { month: 'Jan', pontualidade: 91, efetividade: 94 },
  { month: 'Fev', pontualidade: 98, efetividade: 99 },
];

const BAR_VOL = [
  { name: 'S', items: 120 }, { name: 'T', items: 145 }, { name: 'Q', items: 130 },
  { name: 'Q', items: 160 }, { name: 'S', items: 155 }, { name: 'S', items: 80 }
];

const DEVOLUCOES = [
  { motivo: 'Paciente Ausente', qtde: 12 },
  { motivo: 'Endereço Incorreto', qtde: 5 },
  { motivo: 'Recusa (Obitou/Alergia)', qtde: 2 }
];

const INVENTARIO = [
  { sn: 'SN-A101', lote: 'LT-23A', remetente: 'Farmácia Central', paciente: 'Ana Beatriz', temp: 4.2 },
  { sn: 'SN-B201', lote: 'LT-99Z', remetente: 'Farmácia Central', paciente: 'João Alves', temp: 4.3 },
  { sn: 'SN-B202', lote: 'LT-99Z', remetente: 'Farmácia Central', paciente: 'Silva Mendes', temp: 4.2 },
];

export default function DashboardMotorista() {
  const router = useRouter();
  const params = useParams();

  return (
    <div className="p-8 space-y-6 bg-slate-50/50 min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 shadow-sm">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{MOCK_MOT.nome}</h1>
            <p className="text-sm text-slate-500 mt-1">Dashboard de Performance Operacional (ID: {params.motorista_id})</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg text-sm shadow-md">
           Baixar Relatório (PDF)
        </div>
      </div>

      {/* KPIs DE EFICIÊNCIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><Target size={24}/></div>
           <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efetividade Média</p><h3 className="text-3xl font-black text-slate-800">98.2%</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><Clock size={24}/></div>
           <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Médio/Parada</p><h3 className="text-3xl font-black text-slate-800">4m 12s</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
           <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0"><RotateCcw size={24}/></div>
           <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxa de Devolução</p><h3 className="text-3xl font-black text-slate-800">1.8%</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
           <div className="w-12 h-12 bg-[#1A2B6D]/10 text-[#1A2B6D] rounded-2xl flex items-center justify-center shrink-0"><Activity size={24}/></div>
           <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conclusão de Rota (Hj)</p><h3 className="text-3xl font-black text-slate-800">100%</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Linha do Tempo de Performance */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">Histórico de Performance (%)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={LINE_DATA} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis domain={['dataMin - 5', 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <RTCooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="pontualidade" name="Pontualidade" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="efetividade" name="Efetividade" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Análise de Devoluções */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">Motivos Críticos de Retorno (Mês)</h3>
          <div className="flex-1 w-full flex flex-col justify-center space-y-4">
             {DEVOLUCOES.map(dev => (
               <div key={dev.motivo}>
                 <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                   <span>{dev.motivo}</span>
                   <span>{dev.qtde} Casos</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(dev.qtde/20)*100}%` }} />
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* INVENTÁRIO DE BORDO (Unidades Serializadas) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-5 border-b border-slate-100 bg-slate-50/50">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Truck size={18} className="text-[#1A2B6D]" /> Inventário de Bordo (Tempo Real)
             </h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50/80 border-b border-slate-100 text-xs">
                 <tr>
                   <th className="px-5 py-3 font-semibold text-slate-700">Serial Number</th>
                   <th className="px-5 py-3 font-semibold text-slate-700">Lote (Batch)</th>
                   <th className="px-5 py-3 font-semibold text-slate-700">Destino Func.</th>
                   <th className="px-5 py-3 font-semibold text-slate-700 text-center">Temp.</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {INVENTARIO.map(inv => (
                   <tr key={inv.sn} className="hover:bg-slate-50 transition-colors">
                     <td className="px-5 py-4 font-mono font-bold text-slate-800">{inv.sn}</td>
                     <td className="px-5 py-4 text-xs font-semibold">{inv.lote}</td>
                     <td className="px-5 py-4 text-xs">{inv.paciente}</td>
                     <td className="px-5 py-4 text-center">
                       <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">
                         <Thermometer size={12}/> {inv.temp}ºC
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* ALERTA DE ANOMALIAS (RESOLVIDAS) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
             <ShieldAlert size={18} className="text-red-500" /> Auditoria de Anomalias (Logs)
           </h3>
           <div className="space-y-4">
             <div className="flex justify-between items-start p-4 rounded-xl border border-red-200 bg-red-50">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <AlertTriangle size={16} className="text-red-600" />
                   <h4 className="font-bold text-red-900 text-sm">Desvio de Rota (&gt;1km)</h4>
                 </div>
                 <p className="text-xs text-red-700">Desvio não justificado em Municipio Teste-MS.</p>
                 <p className="text-[10px] text-red-600/60 font-medium mt-1">14/10/2023 - 14:32:05</p>
               </div>
               <button className="px-3 py-1.5 bg-white border border-red-300 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors shadow-sm">
                 Marcar Resolvido
               </button>
             </div>

             <div className="flex justify-between items-start p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-70">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <Clock size={16} className="text-slate-500" />
                   <h4 className="font-bold text-slate-700 text-sm line-through decoration-slate-400 decoration-2">Parada Excessiva</h4>
                 </div>
                 <p className="text-xs text-slate-500 line-through decoration-slate-400">Motorista almoçando.</p>
                 <p className="text-[10px] text-slate-400 font-medium mt-1">Ontem - 12:15:00</p>
               </div>
               <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1.5 rounded-lg">
                 <CheckCircle2 size={14} /> Resolvido
               </span>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
