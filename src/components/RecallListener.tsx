'use client';

import { useEffect } from 'react';
import { recallAPI } from '@/lib/api';
import { toast } from 'sonner';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RecallListener() {
  const router = useRouter();

  useEffect(() => {
    console.log('📡 Iniciando Monitor de Recall em Tempo Real...');
    
    const subscription = recallAPI.subscribeToRecall((payload) => {
      const lote = payload.new;
      
      // Notificação Sonora/Visual Crítica
      toast.error(`BLOQUEIO DE RECALL: Lote ${lote.codigo_lote_fabricante}`, {
        duration: Infinity,
        position: 'top-center',
        description: 'Um lote foi marcado para recall. Operações de WMS e saída de estoque foram bloqueadas automaticamente no banco de dados.',
        action: {
          label: 'Ver Relatório',
          onClick: () => router.push(`/dashboard/recall?q=${lote.codigo_lote_fabricante}`)
        },
        icon: <ShieldAlert className="text-red-600 animate-pulse" />
      });

      // Se estiver na página de estoque, podemos forçar um refresh ou mostrar um overlay
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('recall-detected', { detail: lote });
        window.dispatchEvent(event);
      }
    });

    return () => {
      console.log('🔌 Desconectando Monitor de Recall.');
      subscription.unsubscribe();
    };
  }, [router]);

  return null; // Este componente não renderiza nada visualmente, apenas gerencia o estado/realtime
}
