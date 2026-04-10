'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  ShoppingCart, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  X,
  AlertCircle,
  MessageSquare,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Notification = {
  id: string;
  type: 'COMPRA' | 'RECALL' | 'VENCIMENTO' | 'SISTEMA';
  title: string;
  description: string;
  time: string;
  href: string;
  critical: boolean;
};

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carregar contagem inicial mesmo fechado
    loadNotifications(false);
    
    // Polling de notificações a cada 30s
    const interval = setInterval(() => loadNotifications(false), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications(true);
    }
  }, [isOpen]);

  const loadNotifications = async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const alerts: Notification[] = [];
      
      const [compras, lotes, fila] = await Promise.all([
        api.getComprasAtivas(),
        api.getLotes(),
        api.getFilaNotificacoes()
      ]);

      // 1. Sugestões de Compra
      compras.filter(c => c.status === 'SUGERIDO').slice(0, 2).forEach(c => {
        alerts.push({
          id: `compra-${c.id}`,
          type: 'COMPRA',
          title: 'Reposição Necessária',
          description: `Ruptura detectada: ${c.medicamento?.nome || 'Medicamento'}. Qtd: ${c.quantidade}`,
          time: 'Prioridade Alta',
          href: '/dashboard/compras',
          critical: true
        });
      });

      // 2. Lotes Vencendo (< 90 dias)
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 90);
      lotes.filter(l => new Date(l.data_validade) < limitDate).slice(0, 3).forEach(l => {
        alerts.push({
          id: `venc-${l.id}`,
          type: 'VENCIMENTO',
          title: 'FEFO: Expiração Próxima',
          description: `Lote ${l.codigo_lote_fabricante} de ${l.medicamentos?.nome} vence em breve.`,
          time: 'Ação Exigida',
          href: '/dashboard/estoque',
          critical: false
        });
      });

      // 3. Fila de Notificações (Alertas de Paciente)
      fila.filter(f => f.status === 'PENDENTE').slice(0, 3).forEach(f => {
        alerts.push({
          id: `msg-${f.id}`,
          type: 'SISTEMA',
          title: 'Notificação de Paciente',
          description: `${f.pacientes?.nome_completo}: ${f.mensagem}`,
          time: 'Fila de Saída',
          href: '/dashboard/pacientes',
          critical: false
        });
      });

      // 4. Lotes em RECALL (Crítico)
      const allLotes = await api.getLotes(); // Recarregar para garantir status
      allLotes.filter(l => l.status === 'RECALL').forEach(l => {
         alerts.push({
           id: `recall-${l.id}`,
           type: 'RECALL',
           title: '🚨 RECALL ATIVO',
           description: `BLOQUEIO IMEDIATO: Lote ${l.codigo_lote_fabricante} (${l.medicamentos?.nome})`,
           time: 'INTERVENÇÃO',
           href: '/dashboard/recall',
           critical: true
         });
      });

      setNotifications(alerts);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
      >
        <Bell size={22} className={cn(isOpen && "text-[#1E3A8A]")} />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center animate-pulse">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-[360px] bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-2">
            <div className="p-5 bg-[#1E3A8A] border-b border-blue-900 flex items-center justify-between text-white">
              <h3 className="font-black text-sm flex items-center gap-2 uppercase tracking-widest">
                <AlertTriangle size={16} className="text-amber-400" /> Cockpit de Alertas
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[480px] overflow-y-auto">
              {loading ? (
                <div className="p-16 text-center">
                  <Loader2 className="animate-spin text-blue-500 mx-auto" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Sincronizando Base...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                    <Bell size={32} className="text-slate-200" />
                  </div>
                  <p className="text-sm font-black text-slate-900 leading-none">Status Nominal</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Sem anomalias detectadas no vigia.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <Link 
                      key={n.id} 
                      href={n.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex gap-4 p-5 hover:bg-slate-50 transition-colors group relative border-l-4",
                        n.critical ? "border-l-red-500 bg-red-50/10" : "border-l-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        n.type === 'COMPRA' ? "bg-amber-100 text-amber-600" :
                        n.type === 'RECALL' ? "bg-red-100 text-red-600" :
                        n.type === 'VENCIMENTO' ? "bg-blue-100 text-blue-600" :
                        "bg-emerald-100 text-emerald-600"
                      )}>
                        {n.type === 'COMPRA' ? <ShoppingCart size={20} /> :
                         n.type === 'RECALL' ? <ShieldAlert size={20} /> :
                         n.type === 'VENCIMENTO' ? <Clock size={20} /> :
                         <MessageSquare size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className={`text-[11px] font-black uppercase tracking-tight ${n.critical ? 'text-red-600' : 'text-slate-900'}`}>{n.title}</p>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{n.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                          {n.description}
                        </p>
                      </div>
                      <ChevronRight size={14} className="self-center text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <Link 
                href="/dashboard/auditoria" 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest hover:underline flex items-center justify-center gap-2"
              >
                Auditar Todos os Fluxos <ChevronRight size={12}/>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
