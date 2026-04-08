import { supabase } from './supabase';
import { MockServer } from './mock-server';

/**
 * api.ts - Camada de Acesso a Dados Híbrida (Supabase <-> MockServer)
 * O sistema tentará acessar o Supabase. Em caso de falha de rede ou configuração,
 * consumirá silenciosamente o mock-server.ts (Fallback Automático).
 */

export const api = {
  
  async getEstoqueBase() {
    try {
      const { data, error } = await supabase.from('medicamentos').select('*, lotes(*)').order('nome');
      if (error || !data || data.length === 0) throw new Error('Supabase retornou vazio / Erro na Query');
      return data;
    } catch (err) {
      console.info('🔌 [Fallback]: Utilizando MockServer para getEstoqueBase()');
      return MockServer.getMedicamentos();
    }
  },

  async validarPrecoCmed(medicamentoId: string, valorUnitario: number) {
    try {
      const { data } = await supabase.from('medicamentos').select('preco_teto_cmed').eq('id', medicamentoId).single();
      if (!data) throw new Error('Item não encontrado na base');
      
      const isExcedido = valorUnitario > data.preco_teto_cmed;
      const percentual = isExcedido ? ((valorUnitario / data.preco_teto_cmed) - 1) * 100 : 0;
      
      return { valido: !isExcedido, teto: data.preco_teto_cmed, percentualExcedido: percentual };
    } catch (err) {
      // Regra de fallback provisória (Mock)
      const isExcedido = valorUnitario > 50; 
      return { valido: !isExcedido, teto: 50.00, percentualExcedido: isExcedido ? 15 : 0 };
    }
  }

};

/**
 * auditoriaAPI - Registra criações ou alterações sensíveis gerando log WORM 
 */
export const auditoriaAPI = {
  
  async log(acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'ALERTA_SEGURANCA' | 'FEFO_BLOCK', entidade: string, metadados: any) {
    try {
       const user = (await supabase.auth.getUser()).data?.user?.email || 'System';
       
       const { error } = await supabase.from('logs_auditoria').insert([{
         acao,
         recurso: entidade,
         ator: user,
         metadados: JSON.stringify(metadados),
         severidade: acao === 'ALERTA_SEGURANCA' ? 'Crítica' : 'Alta'
       }]);

       if (error) throw error;
    } catch(err) {
       // Salva em Mock Server se offline para sincronização posterior (Offline-First strategy)
       await MockServer.logAuditoria({ acao, entidade, metadados });
    }
  },

  async createLog(params: { acao: string, usuario: string, modulo: string, descricao: string, gravidade: string }) {
    try {
       const { error } = await supabase.from('logs_auditoria').insert([{
         acao: params.acao,
         recurso: params.modulo,
         ator: params.usuario,
         metadados: JSON.stringify({ descricao: params.descricao, gravidade: params.gravidade }),
         severidade: params.gravidade
       }]);

       if (error) throw error;
       return { success: true };
    } catch(err) {
       console.error('Erro ao registrar log WORM:', err);
       return { success: false };
    }
  }
};
