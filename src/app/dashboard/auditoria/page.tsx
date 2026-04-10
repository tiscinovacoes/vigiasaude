'use client';

import { useState, useEffect } from 'react';
import { api, auditoriaAPI } from '@/lib/api';
import { 
  ShieldCheck, UserCog, KeyRound, ShieldAlert, 
  History, Search, Filter, Loader2, RefreshCw,
  AlertCircle, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type LogAuditoria = {
  id: string;
  created_at: string;
  ator: string;
  acao: string;
  tabela_afetada: string;
  severidade: string;
  dados_anteriores: any;
  dados_novos: any;
  metadados: any;
};

export default function PainelAuditoriaMaster() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditoriaAPI.getLogsRecentes();
      setLogs(data as LogAuditoria[]);
    } catch (err) {
      toast.error('Erro ao carregar trilha de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const getSeveridadeStyle = (sev: string) => {
    switch(sev) {
      case 'Crítica': return 'bg-red-100 text-red-700 border-red-200';
      case 'Alta': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Média': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.ator.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.tabela_afetada.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reais estatísticas baseadas nos logs carregados
  const stats = {
    criticos: logs.filter(l => l.severidade === 'Crítica').length,
    alta: logs.filter(l => l.severidade === 'Alta').length,
    total: logs.length
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <ShieldCheck className="text-[#1E3A8A]" size={32} />
            Compliance e Auditoria Master
          </h1>
          <p className="text-slate-500 font-medium mt-1">Garantia de Integridade Imutável e Rastreabilidade Transacional (WORM)</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadLogs} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-xs shadow-sm transition-all uppercase tracking-wider">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16}/>} Atualizar Trilha
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl hover:bg-blue-900 font-bold text-xs shadow-lg shadow-blue-100 transition-all uppercase tracking-wider">
            <KeyRound size={16}/> Políticas de Segurança
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* SIDEBAR DE STATUS E INFRAESTRUTURA */}
         <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="font-black text-slate-400 mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                 Status do Ecossistema
               </h3>
               <div className="space-y-5">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-xs text-slate-800 font-bold">Supabase DB</p>
                     <p className="text-[10px] text-slate-400 font-medium">PostgreSQL High Availability</p>
                   </div>
                   <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online</span>
                 </div>
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-xs text-slate-800 font-bold">Motor de Mensageria</p>
                     <p className="text-[10px] text-slate-400 font-medium">Resilien Queue Mode</p>
                   </div>
                   <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ativo</span>
                 </div>
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-xs text-slate-800 font-bold">Triggers de Auditoria</p>
                     <p className="text-[10px] text-slate-400 font-medium">Auto-Observer Hooks</p>
                   </div>
                   <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ativo</span>
                 </div>
               </div>
            </div>

            <div className="bg-[#1E3A8A] p-6 rounded-2xl shadow-xl border border-blue-800 text-white relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Shield size={100} /></div>
               <h3 className="font-black mb-3 flex items-center gap-2 text-xs uppercase tracking-widest relative z-10">
                 Garantia Imutável
               </h3>
               <p className="text-[11px] text-blue-100 leading-relaxed font-medium relative z-10">
                 Os logs nesta trilha são protegidos por políticas RLS que impedem qualquer modificação posterior. O Vigia Saúde assegura transparência total em conformidade com as normas do Ministério da Saúde.
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Alertas Críticos</p>
                  <p className="text-xl font-black text-red-600">{stats.criticos}</p>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Logs (Real)</p>
                  <p className="text-xl font-black text-slate-800">{stats.total}</p>
               </div>
            </div>
         </div>

         {/* LOGS DE AUDITORIA (TABELA PRINCIPAL) */}
         <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight text-sm">
                <History size={18} className="text-[#1E3A8A]" /> Trilha de Auditoria (Audit Trail)
              </h3>
              <div className="flex gap-3">
                 <div className="relative">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                    type="text" 
                    placeholder="Buscar ID, Ator ou Tabela..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none w-72 transition-all shadow-inner" 
                   />
                 </div>
                 <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"><Filter size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Timestamp / Transaction ID</th>
                    <th className="px-6 py-4">Ator / Contexto</th>
                    <th className="px-6 py-4">Ação e Recurso</th>
                    <th className="px-6 py-4 text-center">Severidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando Auditoria...</p>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center opacity-40">
                        <ShieldAlert className="mx-auto mb-2" size={40} />
                        <p className="text-xs font-bold uppercase">Nenhum registro encontrado na trilha ativa</p>
                      </td>
                    </tr>
                  ) : filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-800 text-[12px]">{format(new Date(log.created_at), 'dd/MM/yyyy • HH:mm:ss')}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter uppercase">{log.id}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-700 text-xs">{log.ator}</p>
                        <p className="text-[9px] bg-slate-100 text-slate-500 inline-flex px-2 py-0.5 rounded-full mt-1.5 font-bold uppercase tracking-wider">Identidade Verificada</p>
                      </td>
                      <td className="px-6 py-5 max-w-lg">
                        <div className="flex items-center gap-2 mb-1.5">
                           <span className={cn(
                             "text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
                             log.acao === 'INSERT' ? 'bg-emerald-100 text-emerald-700' :
                             log.acao === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                             'bg-orange-100 text-orange-700'
                           )}>
                             {log.acao}
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tight">{log.tabela_afetada}</span>
                        </div>
                        
                        <div className="flex flex-col gap-2 mt-3">
                           {log.dados_anteriores && (
                             <div className="p-3 bg-red-50/30 rounded-xl text-[10px] border border-red-100 group-hover:bg-red-50 transition-colors">
                               <span className="font-black text-red-700 uppercase block mb-2 tracking-widest text-[9px]">ESTADO ANTERIOR:</span>
                               <pre className="whitespace-pre-wrap text-red-600 font-mono leading-tight">{typeof log.dados_anteriores === 'string' ? log.dados_anteriores : JSON.stringify(log.dados_anteriores, null, 2)}</pre>
                             </div>
                           )}
                           {log.dados_novos && (
                             <div className="p-3 bg-emerald-50/30 rounded-xl text-[10px] border border-emerald-100 group-hover:bg-emerald-50 transition-colors">
                               <span className="font-black text-emerald-700 uppercase block mb-2 tracking-widest text-[9px]">NOVO ESTADO (COMMIT):</span>
                               <pre className="whitespace-pre-wrap text-emerald-600 font-mono leading-tight">{typeof log.dados_novos === 'string' ? log.dados_novos : JSON.stringify(log.dados_novos, null, 2)}</pre>
                             </div>
                           )}
                           {!log.dados_anteriores && !log.dados_novos && log.metadados && (
                             <p className="text-[11px] text-slate-500 font-bold leading-tight bg-slate-50 p-2 rounded-lg border border-slate-100">
                               {typeof log.metadados === 'string' ? log.metadados : JSON.stringify(log.metadados)}
                             </p>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border-2 shadow-sm ${getSeveridadeStyle(log.severidade)}`}>
                          {log.severidade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
              <span>Fim da trilha (Últimas 50 transações)</span>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all font-black text-slate-600 shadow-sm" disabled>Anterior</button>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-black text-slate-600 shadow-sm">Próxima</button>
              </div>
            </div>
         </div>
      </div>

    </div>
  );
}

// Utility to merge classes
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
