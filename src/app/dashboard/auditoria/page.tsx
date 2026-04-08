'use client';

import { useState } from 'react';
import { ShieldCheck, Search, Filter, AlertTriangle, ShieldAlert, KeyRound, UserCog, History } from 'lucide-react';
import { format } from 'date-fns';

type LogAuditoria = {
  id: string;
  timestamp: string;
  ator: string;
  perfil: 'Master' | 'Farmacêutico' | 'Motorista' | 'Sistema';
  acao: string;
  recurso: string;
  severidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  metadados: string;
};

const MOCK_LOGS: LogAuditoria[] = [
  { id: 'log_99182', timestamp: '2023-11-01T14:32:05Z', ator: 'Sistema (Geofence)', perfil: 'Sistema', acao: 'INSERT_ALERTA_CRITICO', recurso: 'logs_auditoria.desvio_rota', severidade: 'Crítica', metadados: 'Distância: 1.4km | Lat/Lon: -22.2, -54.7' },
  { id: 'log_99181', timestamp: '2023-11-01T10:15:00Z', ator: 'Carlos Santana (CRM-MS)', perfil: 'Master', acao: 'UPDATE_PRECO_CMED', recurso: 'medicamentos.sinvastatina', severidade: 'Média', metadados: 'Preço CMED alterado de R$1.50 para R$1.65' },
  { id: 'log_99180', timestamp: '2023-11-01T08:00:22Z', ator: 'Ana P.', perfil: 'Farmacêutico', acao: 'DISPENSACAO_CONCLUIDA', recurso: 'ordens_dispensacao.DSP-119', severidade: 'Baixa', metadados: 'Lote selecionado (FEFO): LT-2023-B15' },
  { id: 'log_99179', timestamp: '2023-10-31T20:44:11Z', ator: 'Sistema (Auth)', perfil: 'Sistema', acao: 'LOGIN_FALHO', recurso: 'auth.users', severidade: 'Alta', metadados: 'IP: 192.168.1.15 | Conta bloqueada temporariamente (3 tentativas)' },
];

export default function PainelAuditoriaMaster() {
  const [logs] = useState<LogAuditoria[]>(MOCK_LOGS);

  const getSeveridadeStyle = (sev: LogAuditoria['severidade']) => {
    switch(sev) {
      case 'Crítica': return 'bg-red-100 text-red-700 border-red-200';
      case 'Alta': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Média': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-[#1E3A8A]" size={28} />
            Painel Master e Auditoria
          </h1>
          <p className="text-sm text-slate-500 mt-1">Role-Based Access Control (RBAC) e Registro Imutável de Transações</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm shadow-sm transition-colors">
            <UserCog size={16}/> Gerir Permissões
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] border border-[#1E3A8A] text-white rounded-lg hover:bg-blue-900 font-medium text-sm shadow-sm transition-colors">
            <KeyRound size={16}/> Políticas de Segurança
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
         {/* SIDEBAR DE STATUS E INFRAESTRUTURA */}
         <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[0.625rem] shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                 <ShieldAlert size={16} className="text-[#DC2626] animate-pulse-red" />
                 Status do Sistema
               </h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                   <p className="text-xs text-slate-500 font-medium">Bancodedados (Supabase)</p>
                   <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 flex shrink-0" /> Operacional</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                   <p className="text-xs text-slate-500 font-medium">Motor FEFO</p>
                   <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 flex shrink-0" /> Ativo</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <p className="text-xs text-slate-500 font-medium">Serviço de Assinaturas (ICP)</p>
                   <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 flex shrink-0" /> Ativo</span>
                 </div>
               </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-[0.625rem] shadow-lg border border-slate-700 text-white">
               <h3 className="font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                 Garantia Imutável (WORM)
               </h3>
               <p className="text-xs text-slate-300 leading-relaxed font-medium">
                 Todos os eventos registrados na tabela <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-300">logs_auditoria</code> não podem ser apagados ou modificados, nem mesmo por contas Master, assegurando a transparência e conformidade com diretrizes estaduais e federais.
               </p>
            </div>
         </div>

         {/* LOGS DE AUDITORIA (TABELA PRINCIPAL) */}
         <div className="xl:col-span-3 bg-white rounded-[0.625rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <History size={18} className="text-[#1E3A8A]" /> Trilha de Auditoria (Audit Trail)
              </h3>
              <div className="flex gap-2">
                 <div className="relative">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" placeholder="Buscar ID de Transação..." className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none w-64" />
                 </div>
                 <button className="p-1.5 bg-white border border-slate-200 rounded text-slate-500 hover:bg-slate-50"><Filter size={16} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-[#1E3A8A]/5 border-b border-slate-100 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-slate-700">Timestamp / ID</th>
                    <th className="px-5 py-3 font-semibold text-slate-700">Ator / Perfil</th>
                    <th className="px-5 py-3 font-semibold text-slate-700">Ação e Recurso (Tabela)</th>
                    <th className="px-5 py-3 font-semibold text-slate-700 text-center">Severidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800 text-[13px]">{format(new Date(log.timestamp), 'dd/MM/yyyy • HH:mm:ss')}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.id}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700 text-xs">{log.ator}</p>
                        <p className="text-[10px] bg-slate-100 text-slate-500 inline-flex px-1.5 py-0.5 rounded mt-1 font-semibold">{log.perfil}</p>
                      </td>
                      <td className="px-5 py-4 max-w-sm">
                        <p className="font-bold text-slate-800 text-xs">{log.acao}</p>
                        <p className="text-[10px] font-mono text-blue-600 mb-1">{log.recurso}</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight">{log.metadados}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getSeveridadeStyle(log.severidade)}`}>
                          {log.severidade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 font-medium flex justify-between items-center">
              <span>Mostrando 4 de 1.402 registros encriptados.</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Ant</button>
                <button className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50">Próx</button>
              </div>
            </div>
         </div>
      </div>

    </div>
  );
}
