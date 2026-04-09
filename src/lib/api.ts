import { supabase } from './supabase';
import { MockServer } from './mock-server';

/**
 * api.ts - Camada de Acesso a Dados Híbrida (Supabase <-> MockServer)
 * O sistema tentará acessar o Supabase. Em caso de falha de rede ou configuração,
 * consumirá silenciosamente o mock-server.ts (Fallback Automático).
 */

// ============================================================================
// TIPOS
// ============================================================================

export type Medicamento = {
  id: string;
  nome: string;
  dosagem: string | null;
  estoque_minimo: number;
  preco_teto_cmed: number;
  created_at: string;
  lotes?: Lote[];
};

export type Lote = {
  id: string;
  codigo_lote_fabricante: string;
  medicamento_id: string;
  data_validade: string;
  quantidade_disponivel: number;
  quantidade_reservada: number;
  custo_unitario_compra: number;
  status: 'ATIVO' | 'RECALL' | 'BLOQUEADO' | 'VENCIDO';
  created_at: string;
  medicamentos?: Medicamento;
};

export type Paciente = {
  id: string;
  cpf: string;
  nome_completo: string;
  endereco_completo: string;
  geolocalizacao: any;
  janela_entrega: string | null;
  telefone: string | null;
  created_at: string;
};

export type Fornecedor = {
  id: string;
  cnpj: string;
  razao_social: string;
  pontualidade_percentual: number;
  lead_time_medio: number;
  valor_total_contratado: number;
  created_at: string;
};

export type EntregaLogistica = {
  id: string;
  dispense_id: string;
  paciente_id: string;
  motorista_id: string | null;
  status_entrega: 'ENTREGUE' | 'EM_ROTA' | 'FALHA' | 'PENDENTE';
  foto_comprovante_url: string | null;
  assinatura_digital_url: string | null;
  lat_entrega: number | null;
  lng_entrega: number | null;
  created_at: string;
  pacientes?: Paciente;
  motoristas?: { id: string; nome: string; placa_veiculo: string };
};

export type KpisDashboard = {
  estoqueCritico: number;
  leadTimeMedio: number;
  totalPacientes: number;
  entregasAtivas: number;
  entregasConcluidas: number;
  lotesVencimentoProximo: number;
};

// ============================================================================
// API PRINCIPAL
// ============================================================================

export const api = {

  // --------------------------------------------------------------------------
  // MEDICAMENTOS & LOTES
  // --------------------------------------------------------------------------

  async getEstoqueBase(): Promise<Medicamento[]> {
    try {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*, lotes(*)')
        .order('nome');
      if (error || !data || data.length === 0) throw new Error('Supabase retornou vazio / Erro na Query');
      return data as Medicamento[];
    } catch (err) {
      console.info('🔌 [Fallback]: Utilizando MockServer para getEstoqueBase()');
      return MockServer.getMedicamentos() as any;
    }
  },

  async getLotes(): Promise<Lote[]> {
    try {
      const { data, error } = await supabase
        .from('lotes')
        .select('*, medicamentos(id, nome, dosagem, preco_teto_cmed)')
        .eq('status', 'ATIVO')
        .order('data_validade', { ascending: true });
      if (error || !data) throw error;
      return data as Lote[];
    } catch (err) {
      console.info('🔌 [Fallback]: getLotes() sem dados no Supabase');
      return [];
    }
  },

  async getLotesByMedicamento(medicamentoId: string): Promise<Lote[]> {
    try {
      const { data, error } = await supabase
        .from('lotes')
        .select('*')
        .eq('medicamento_id', medicamentoId)
        .in('status', ['ATIVO', 'BLOQUEADO'])
        .order('data_validade', { ascending: true });
      if (error || !data) throw error;
      return data as Lote[];
    } catch (err) {
      console.info('🔌 [Fallback]: getLotesByMedicamento() sem dados');
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // PACIENTES
  // --------------------------------------------------------------------------

  async getPacientes(): Promise<Paciente[]> {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('nome_completo');
      if (error || !data) throw error;
      return data as Paciente[];
    } catch (err) {
      console.info('🔌 [Fallback]: getPacientes() sem dados no Supabase');
      return [];
    }
  },

  async createPaciente(paciente: {
    cpf: string;
    nome_completo: string;
    endereco_completo: string;
    janela_entrega: string;
    telefone?: string;
  }): Promise<{ success: boolean; data?: Paciente; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert([paciente])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as Paciente };
    } catch (err: any) {
      console.error('Erro ao criar paciente:', err);
      return { success: false, error: err?.message || 'Erro desconhecido' };
    }
  },

  async getPacienteById(id: string): Promise<Paciente | null> {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) throw error;
      return data as Paciente;
    } catch (err) {
      console.info('🔌 [Fallback]: getPacienteById() sem dados');
      return null;
    }
  },

  // --------------------------------------------------------------------------
  // FORNECEDORES
  // --------------------------------------------------------------------------

  async getFornecedores(): Promise<Fornecedor[]> {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('pontualidade_percentual', { ascending: false });
      if (error || !data) throw error;
      return data as Fornecedor[];
    } catch (err) {
      console.info('🔌 [Fallback]: getFornecedores() sem dados no Supabase');
      return [];
    }
  },

  async createFornecedor(fornecedor: {
    cnpj: string;
    razao_social: string;
    pontualidade_percentual?: number;
    lead_time_medio?: number;
  }): Promise<{ success: boolean; data?: Fornecedor; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert([fornecedor])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as Fornecedor };
    } catch (err: any) {
      console.error('Erro ao criar fornecedor:', err);
      return { success: false, error: err?.message || 'Erro desconhecido' };
    }
  },

  // --------------------------------------------------------------------------
  // ENTREGAS E LOGÍSTICA
  // --------------------------------------------------------------------------

  async getEntregasLogistica(): Promise<EntregaLogistica[]> {
    try {
      const { data, error } = await supabase
        .from('entregas_logistica')
        .select('*, pacientes(id, nome_completo, endereco_completo, telefone), motoristas(id, nome, placa_veiculo)')
        .order('created_at', { ascending: false });
      if (error || !data) throw error;
      return data as EntregaLogistica[];
    } catch (err) {
      console.info('🔌 [Fallback]: getEntregasLogistica() sem dados');
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // KPIs DO DASHBOARD EXECUTIVO
  // --------------------------------------------------------------------------

  async getKpisDashboard(): Promise<KpisDashboard> {
    try {
      // 1. Estoque Crítico: Medicamentos com estoque total de lotes < estoque_minimo
      const { data: meds, error: medsErr } = await supabase
        .from('medicamentos')
        .select('id, estoque_minimo, lotes(quantidade_disponivel)');
      
      let estoqueCritico = 0;
      if (!medsErr && meds) {
        estoqueCritico = meds.filter((m: any) => {
          const totalDisp = (m.lotes || []).reduce((s: number, l: any) => s + (l.quantidade_disponivel || 0), 0);
          return totalDisp < m.estoque_minimo;
        }).length;
      }

      // 2. Lead Time Médio dos fornecedores
      const { data: forns, error: fornsErr } = await supabase
        .from('fornecedores')
        .select('lead_time_medio');
      
      let leadTimeMedio = 0;
      if (!fornsErr && forns && forns.length > 0) {
        leadTimeMedio = Math.round(
          (forns.reduce((s: number, f: any) => s + (f.lead_time_medio || 0), 0) / forns.length) * 10
        ) / 10;
      }

      // 3. Total de pacientes
      const { count: totalPacientes } = await supabase
        .from('pacientes')
        .select('id', { count: 'exact', head: true });

      // 4. Entregas ativas (EM_ROTA + PENDENTE)
      const { count: entregasAtivas } = await supabase
        .from('entregas_logistica')
        .select('id', { count: 'exact', head: true })
        .in('status_entrega', ['EM_ROTA', 'PENDENTE']);

      // 5. Entregas concluídas
      const { count: entregasConcluidas } = await supabase
        .from('entregas_logistica')
        .select('id', { count: 'exact', head: true })
        .eq('status_entrega', 'ENTREGUE');

      // 6. Lotes com vencimento próximo (< 90 dias)
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 90);
      const { count: lotesVencimentoProximo } = await supabase
        .from('lotes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ATIVO')
        .lt('data_validade', limitDate.toISOString().split('T')[0]);

      return {
        estoqueCritico,
        leadTimeMedio,
        totalPacientes: totalPacientes || 0,
        entregasAtivas: entregasAtivas || 0,
        entregasConcluidas: entregasConcluidas || 0,
        lotesVencimentoProximo: lotesVencimentoProximo || 0,
      };
    } catch (err) {
      console.info('🔌 [Fallback]: getKpisDashboard() usando valores default');
      return {
        estoqueCritico: 0,
        leadTimeMedio: 0,
        totalPacientes: 0,
        entregasAtivas: 0,
        entregasConcluidas: 0,
        lotesVencimentoProximo: 0,
      };
    }
  },

  // --------------------------------------------------------------------------
  // DADOS DE GRÁFICOS (Dashboard)
  // --------------------------------------------------------------------------

  async getConsumoMensal(): Promise<{ month: string; entrada: number; consumo: number }[]> {
    // Por enquanto retorna dados calculados do banco quando disponíveis
    // Futuramente, uma view materializada pode ser criada para isso
    try {
      const { data: lotes, error } = await supabase
        .from('lotes')
        .select('created_at, quantidade_disponivel, custo_unitario_compra');
      
      if (error || !lotes || lotes.length === 0) throw error;

      // Agregar por mês
      const meses: Record<string, { entrada: number; consumo: number }> = {};
      const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      lotes.forEach((l: any) => {
        const d = new Date(l.created_at);
        const key = nomesMeses[d.getMonth()];
        if (!meses[key]) meses[key] = { entrada: 0, consumo: 0 };
        meses[key].entrada += l.quantidade_disponivel || 0;
      });

      return Object.entries(meses).map(([month, vals]) => ({
        month,
        entrada: vals.entrada,
        consumo: Math.round(vals.entrada * 0.7), // estimativa: 70% de consumo
      }));
    } catch (err) {
      console.info('🔌 [Fallback]: getConsumoMensal() sem dados');
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // VALIDAÇÃO CMED
  // --------------------------------------------------------------------------

  async validarPrecoCmed(medicamentoId: string, valorUnitario: number) {
    try {
      const { data } = await supabase.from('medicamentos').select('preco_teto_cmed').eq('id', medicamentoId).single();
      if (!data) throw new Error('Item não encontrado na base');
      
      const isExcedido = valorUnitario > data.preco_teto_cmed;
      const percentual = isExcedido ? ((valorUnitario / data.preco_teto_cmed) - 1) * 100 : 0;
      
      return { valido: !isExcedido, teto: data.preco_teto_cmed, percentualExcedido: percentual };
    } catch (err) {
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
         tabela_afetada: entidade,
         ator: user,
         metadados: JSON.stringify(metadados),
         severidade: acao === 'ALERTA_SEGURANCA' ? 'Crítica' : 'Alta'
       }]);

       if (error) throw error;
    } catch(err) {
       await MockServer.logAuditoria({ acao, entidade, metadados });
    }
  },

  async createLog(params: { acao: string, usuario: string, modulo: string, descricao: string, gravidade: string }) {
    try {
       const { error } = await supabase.from('logs_auditoria').insert([{
         acao: params.acao,
         tabela_afetada: params.modulo,
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
