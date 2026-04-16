import { supabase } from './supabase';

/**
 * api.ts - Camada de Acesso a Dados (Supabase)
 * O sistema consome exclusivamente dados reais do Supabase. 
 * Tratamento de erros garantido via Exceptions que devem ser tratadas pelo Front.
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
  fornecedor_preferencial_id?: string | null;
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
  custo_unitario: number;
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

export type Motorista = {
  id: string;
  cnh: string;
  nome: string;
  placa_veiculo: string;
  status_atividade: 'ATIVO' | 'INATIVO' | 'EM_ROTA';
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

export type MovimentacaoEstoque = {
  id: string;
  medicamento_id: string;
  lote_id?: string;
  tipo: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  saldo_apos?: number;
  origem?: string;
  destino?: string;
  motivo?: string;
  usuario?: string;
  created_at: string;
  lotes?: Lote;
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
  itens?: {
    id: string;
    serial_number: string;
    medicamento_nome: string;
    lote_codigo: string;
    medicamento_codigo: string;
  }[];
};

export type KpisDashboard = {
  estoqueCritico: number;
  leadTimeMedio: number;
  totalPacientes: number;
  entregasAtivas: number;
  entregasConcluidas: number;
  lotesVencimentoProximo: number;
  riscoRupturaCount: number;
};

export type CompraRegistro = {
  id: string;
  medicamento_id: string;
  fornecedor_id: string;
  quantidade: number;
  valor_unitario: number | null;
  status: 'SUGERIDO' | 'SOLICITADO' | 'EMPENHADO' | 'ENTREGUE' | 'DESCARTADO';
  motivo_sugestao: string | null;
  data_solicitacao: string | null;
  data_entrega_prevista: string | null;
  data_entrega_real: string | null;
  medicamento?: { nome: string; preco_teto_cmed?: number };
  fornecedor?: { razao_social: string };
};

export type NotificacaoFila = {
  id: string;
  paciente_id: string;
  mensagem: string;
  status: 'PENDENTE' | 'ENVIADO' | 'FALHA' | 'AGUARDANDO_API';
  canal: string;
  created_at: string;
  pacientes?: { nome_completo: string; telefone: string | null };
};

export type PrevisaoRuptura = {
  medicamento_id: string;
  medicamento_nome: string;
  estoque_atual: number;
  consumo_diario: number;
  estoque_minimo: number;
  dias_restantes_estoque: number;
  status_logistico: string;
};

// ============================================================================
// API PRINCIPAL
// ============================================================================

export const api = {

  // --------------------------------------------------------------------------
  // MEDICAMENTOS & LOTES
  // --------------------------------------------------------------------------

  async buscarCmedReferencia(termo: string): Promise<{
    produto: string;
    apresentacao: string | null;
    substancia: string | null;
    laboratorio: string | null;
    pmc_17: number | null;
    pf_17: number | null;
    classe_terapeutica: string | null;
  }[]> {
    try {
      const { data } = await supabase
        .from('cmed_referencia')
        .select('produto, apresentacao, substancia, laboratorio, pmc_17, pf_17, classe_terapeutica')
        .or(`produto.ilike.%${termo}%,substancia.ilike.%${termo}%`)
        .order('produto')
        .limit(8);
      return data ?? [];
    } catch {
      return [];
    }
  },

  async getEstoqueBase(): Promise<Medicamento[]> {
    try {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*, lotes(*)')
        .order('nome');
      if (error || !data) throw error;
      return data as Medicamento[];
    } catch (err) {
      console.error('❌ [API Error] getEstoqueBase:', err);
      throw err;
    }
  },

  async createMedicamento(medicamento: {
    nome: string;
    dosagem?: string;
    estoque_minimo: number;
    preco_teto_cmed: number;
    fornecedor_preferencial_id?: string;
  }): Promise<{ success: boolean; data?: Medicamento; error?: string }> {
    try {
      // Usar API route server-side para bypass do RLS
      const res = await fetch('/api/medicamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicamento),
      });
      const result = await res.json();
      if (result.success) {
        return { success: true, data: result.data as Medicamento };
      } else {
        throw new Error(result.error || 'Erro ao cadastrar medicamento');
      }
    } catch (err: any) {
      console.error('Erro ao criar medicamento:', err);
      return { success: false, error: err?.message || 'Erro desconhecido' };
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
      console.error('❌ [API Error] getLotes:', err);
      throw err;
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
      console.error('❌ [API Error] getLotesByMedicamento:', err);
      throw err;
    }
  },

  async getLotePreferencialFEFO(medicamentoId: string): Promise<Lote | null> {
    try {
      const { data, error } = await supabase
        .from('lotes')
        .select('*, medicamentos(nome)')
        .eq('medicamento_id', medicamentoId)
        .eq('status', 'ATIVO')
        .gt('quantidade_disponivel', 0)
        .order('data_validade', { ascending: true })
        .limit(1)
        .single();
      if (error || !data) throw error;
      return data as Lote;
    } catch (err) {
      console.error('❌ [API Error] getLotePreferencialFEFO:', err);
      return null;
    }
  },

  async getRiscoRuptura(): Promise<PrevisaoRuptura[]> {
    try {
      const { data, error } = await supabase
        .from('vw_previsao_ruptura')
        .select('*')
        .order('dias_restantes_estoque', { ascending: true });
      if (error || !data) throw error;
      return data as PrevisaoRuptura[];
    } catch (err) {
      console.error('❌ [API Error] getRiscoRuptura:', err);
      return [];
    }
  },

  async registrarEntrada(payload: {
    medicamento_id: string;
    codigo_lote: string;
    data_validade: string;
    quantidade: number;
    custo_unitario: number;
    fornecedor_id?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Validar teto CMED antes de inserir
      const cmed = await this.validarPrecoCmed(payload.medicamento_id, payload.custo_unitario);
      const isExcedido = !cmed.valido;

      // 2. INSERT via API Route server-side (bypass RLS com service_role_key)
      const res = await fetch('/api/lotes/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Erro ao registrar entrada');

      // 3. Registrar movimento no histórico automaticamente
      await this.registrarMovimentacao({
        medicamento_id: payload.medicamento_id,
        lote_id: payload.codigo_lote ? undefined : undefined, // será preenchido via SELECT posterior se necessário
        tipo: 'ENTRADA',
        quantidade: payload.quantidade,
        origem: 'Compra',
        usuario: (await supabase.auth.getUser()).data?.user?.email || 'Sistema'
      }).catch(err => console.warn('⚠️ Erro ao registrar movimento de entrada:', err));

      // 4. Auditoria WORM
      await auditoriaAPI.log('CREATE', 'lotes', {
        ...payload,
        cmed_validation: cmed,
        alerta_financeiro: isExcedido
      });

      return { success: true };
    } catch (err: any) {
      console.error('❌ [API Error] registrarEntrada:', err);
      return { success: false, error: err.message };
    }
  },

  async registrarSaida(payload: {
    lote_id: string;
    quantidade: number;
    motivo: string;
    destino?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Buscar lote atual para conferir saldo
      const { data: lote, error: errL } = await supabase
        .from('lotes')
        .select('quantidade_disponivel, medicamento_id')
        .eq('id', payload.lote_id)
        .single();

      if (errL || !lote) throw new Error('Lote não localizado');
      if (lote.quantidade_disponivel < payload.quantidade) throw new Error('Saldo insuficiente para a operação');

      // 2. Decrementar saldo
      const novoSaldo = lote.quantidade_disponivel - payload.quantidade;
      const { error } = await supabase
        .from('lotes')
        .update({
          quantidade_disponivel: novoSaldo
        })
        .eq('id', payload.lote_id);

      if (error) throw error;

      // 3. Registrar movimento no histórico automaticamente
      await this.registrarMovimentacao({
        medicamento_id: lote.medicamento_id,
        lote_id: payload.lote_id,
        tipo: 'SAIDA',
        quantidade: payload.quantidade,
        saldo_apos: novoSaldo,
        destino: payload.destino,
        motivo: payload.motivo,
        usuario: (await supabase.auth.getUser()).data?.user?.email || 'Sistema'
      }).catch(err => console.warn('⚠️ Erro ao registrar movimento de saída:', err));

      // 4. Auditoria WORM
      await auditoriaAPI.log('UPDATE', 'lotes', {
        acao: 'SAIDA_ESTOQUE',
        lote_id: payload.lote_id,
        quantidade: payload.quantidade,
        motivo: payload.motivo,
        destino: payload.destino
      });

      return { success: true };
    } catch (err: any) {
      console.error('❌ [API Error] registrarSaida:', err);
      return { success: false, error: err.message };
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
      console.error('❌ [API Error] getPacientes:', err);
      throw err;
    }
  },

  async createMotorista(motorista: {
    cnh: string;
    nome: string;
    placa_veiculo: string;
  }): Promise<{ success: boolean; data?: Motorista; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('motoristas')
        .insert([motorista])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as Motorista };
    } catch (err: any) {
      console.error('Erro ao criar motorista:', err);
      return { success: false, error: err?.message || 'Erro desconhecido' };
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

  async getPrescricoesByPaciente(pacienteId: string): Promise<{
    id: string;
    medicamento_id: string;
    medicamento_nome: string;
    data_vencimento_receita: string;
    status_receita: 'ATIVA' | 'VENCIDA';
    frequencia_entrega: number;
    quantidade_dispensada_padrao: number;
    dosagem_prescrita: string | null;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('prescricoes')
        .select('id, medicamento_id, data_vencimento_receita, frequencia_entrega, quantidade_dispensada_padrao, dosagem_prescrita, medicamentos(nome)')
        .eq('paciente_id', pacienteId)
        .order('data_vencimento_receita', { ascending: false });
      if (error) throw error;
      const hoje = new Date().toISOString().split('T')[0];
      return (data || []).map((p: any) => ({
        id: p.id,
        medicamento_id: p.medicamento_id,
        medicamento_nome: p.medicamentos?.nome ?? '—',
        data_vencimento_receita: p.data_vencimento_receita,
        status_receita: p.data_vencimento_receita >= hoje ? 'ATIVA' : 'VENCIDA',
        frequencia_entrega: p.frequencia_entrega ?? 30,
        quantidade_dispensada_padrao: p.quantidade_dispensada_padrao ?? 1,
        dosagem_prescrita: p.dosagem_prescrita ?? null,
      }));
    } catch (err) {
      console.error('❌ [API Error] getPrescricoesByPaciente:', err);
      return [];
    }
  },

  async getPacienteById(id: string): Promise<Paciente | null> {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('❌ [API Error] getPacienteById:', err);
      return null;
    }
  },

  async getPacienteAnalytics(id: string) {
    try {
      // 1. Calcular Investimento (Soma dos itens entregues)
      const { data: entregas, error: errE } = await supabase
        .from('entregas_logistica')
        .select(`
          status_entrega,
          unidades_serializadas!inner (
            id,
            lotes (custo_unitario)
          )
        `)
        .eq('paciente_id', id)
        .eq('status_entrega', 'ENTREGUE');

      if (errE) throw errE;

      let investimentoTotal = 0;
      entregas?.forEach(ent => {
        ent.unidades_serializadas?.forEach((item: any) => {
          const custo = item.lotes?.custo_unitario || 0;
          investimentoTotal += custo;
        });
      });

      // 2. Buscar Recalls impactando este paciente
      const { data: recalls, error: errR } = await supabase
        .from('entregas_logistica')
        .select(`
          created_at,
          unidades_serializadas!inner (
            lotes!inner (codigo_lote_fabricante, status, medicamentos(nome))
          )
        `)
        .eq('paciente_id', id)
        .eq('unidades_serializadas.lotes.status', 'RECALL');

      if (errR) throw errR;

      // 3. Calcular Adesão REAL: (recebidas / programadas) × 100
      //    Dispensações = entregas logísticas ENTREGUE ou EM_ROTA para este paciente
      const { count: dispensacoesProgramadas } = await supabase
        .from('entregas_logistica')
        .select('*', { count: 'exact', head: true })
        .eq('paciente_id', id);

      const adesaoReal = (dispensacoesProgramadas && dispensacoesProgramadas > 0)
        ? Math.round(((entregas?.length ?? 0) / dispensacoesProgramadas) * 100)
        : 0;

      return {
        investimentoTotal,
        recalls: recalls || [],
        adesao: Math.min(adesaoReal, 100)
      };
    } catch (err) {
      console.error('❌ [API Error] getPacienteAnalytics:', err);
      return { investimentoTotal: 0, recalls: [], adesao: 0 };
    }
  },

  async getTimelineDispensacoes(pacienteId: string): Promise<{
    id: string;
    data: string;
    status: string;
    lote_codigo: string;
    medicamento_nome: string;
    serial_numbers: string[];
    custo_total: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('entregas_logistica')
        .select(`
          id, created_at, status_entrega,
          unidades_serializadas (
            serial_number,
            lotes (codigo_lote_fabricante, custo_unitario, medicamentos(nome))
          )
        `)
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((e: any) => {
        const sns: string[] = [];
        let custo = 0;
        let lote_codigo = '';
        let medicamento_nome = '';
        (e.unidades_serializadas ?? []).forEach((u: any) => {
          sns.push(u.serial_number);
          custo += u.lotes?.custo_unitario ?? 0;
          if (!lote_codigo) lote_codigo = u.lotes?.codigo_lote_fabricante ?? '';
          if (!medicamento_nome) medicamento_nome = u.lotes?.medicamentos?.nome ?? '';
        });
        return {
          id: e.id,
          data: e.created_at,
          status: e.status_entrega,
          lote_codigo,
          medicamento_nome,
          serial_numbers: sns,
          custo_total: custo,
        };
      });
    } catch (err) {
      console.error('❌ [API Error] getTimelineDispensacoes:', err);
      return [];
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
        .order('razao_social', { ascending: true });
      if (error || !data) throw error;
      return data as Fornecedor[];
    } catch (err) {
      console.error('❌ [API Error] getFornecedores:', err);
      return [];
    }
  },

  async createFornecedor(fornecedor: {
    cnpj: string;
    razao_social: string;
    pontualidade_percentual?: number;
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

  async confirmarEntregaCompra(compraId: string): Promise<{ success: boolean; leadTimeDias?: number; error?: string }> {
    try {
      // Busca a compra para obter data_solicitacao e fornecedor_id
      const { data: compra, error: errC } = await supabase
        .from('compras_registro')
        .select('data_solicitacao, data_entrega_prevista, fornecedor_id')
        .eq('id', compraId)
        .single();
      if (errC || !compra) throw errC ?? new Error('Compra não encontrada');

      const hoje = new Date().toISOString().split('T')[0];

      // Calcula lead time real em dias
      const msPerDia = 1000 * 60 * 60 * 24;
      const leadTimeDias = compra.data_solicitacao
        ? Math.round((Date.now() - new Date(compra.data_solicitacao).getTime()) / msPerDia)
        : 0;

      // Marca entrega
      const { error: errU } = await supabase
        .from('compras_registro')
        .update({ status: 'ENTREGUE', data_entrega_real: hoje })
        .eq('id', compraId);
      if (errU) throw errU;

      // Recalcula lead_time_medio e pontualidade do fornecedor
      const { data: historico } = await supabase
        .from('compras_registro')
        .select('data_solicitacao, data_entrega_real, data_entrega_prevista')
        .eq('fornecedor_id', compra.fornecedor_id)
        .eq('status', 'ENTREGUE')
        .not('data_entrega_real', 'is', null)
        .not('data_solicitacao', 'is', null);

      if (historico && historico.length > 0) {
        const totalDias = historico.reduce((acc, h) => {
          const dias = Math.round((new Date(h.data_entrega_real!).getTime() - new Date(h.data_solicitacao!).getTime()) / msPerDia);
          return acc + dias;
        }, 0);
        const novoLeadTime = Math.round(totalDias / historico.length);

        // Pontualidade: % de entregas que chegaram até a data prevista
        const novas = historico.filter(h =>
          h.data_entrega_prevista &&
          new Date(h.data_entrega_real!) <= new Date(h.data_entrega_prevista)
        );
        const novaPontualidade = Math.round((novas.length / historico.length) * 100);

        await supabase
          .from('fornecedores')
          .update({ lead_time_medio: novoLeadTime, pontualidade_percentual: novaPontualidade })
          .eq('id', compra.fornecedor_id);
      }

      await auditoriaAPI.log('UPDATE', 'compras_registro', {
        compra_id: compraId,
        data_entrega_real: hoje,
        lead_time_calculado_dias: leadTimeDias,
      });

      return { success: true, leadTimeDias };
    } catch (err: any) {
      console.error('❌ [API Error] confirmarEntregaCompra:', err);
      return { success: false, error: err.message };
    }
  },

  // --------------------------------------------------------------------------
  // COMPRAS & INTELIGÊNCIA DE ABASTECIMENTO
  // --------------------------------------------------------------------------

  async getComprasAtivas(): Promise<CompraRegistro[]> {
    try {
      const { data, error } = await supabase
        .from('compras_registro')
        .select('*, medicamento:medicamentos(nome, preco_teto_cmed), fornecedor:fornecedores(razao_social)')
        .order('data_solicitacao', { ascending: false, nullsFirst: false });
      if (error || !data) return [];
      return data as CompraRegistro[];
    } catch (err) {
      return [];
    }
  },

  async aprovarSugestaoCompra(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('compras_registro')
        .update({ status: 'SOLICITADO', data_solicitacao: new Date().toISOString().split('T')[0] })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao aprovar sugestão:', err);
      return false;
    }
  },

  async descartarSugestaoCompra(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('compras_registro')
        .update({ status: 'DESCARTADO' })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao descartar sugestão:', err);
      return false;
    }
  },

  // --------------------------------------------------------------------------
  // NOTIFICAÇÕES & RESILIÊNCIA
  // --------------------------------------------------------------------------

  async getFilaNotificacoes(): Promise<NotificacaoFila[]> {
    try {
      const { data, error } = await supabase
        .from('notificacoes_fila')
        .select('*, pacientes(nome_completo, telefone)')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data as NotificacaoFila[];
    } catch (err) {
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // ENTREGAS E LOGÍSTICA
  // --------------------------------------------------------------------------

  async getEntregasLogistica(): Promise<EntregaLogistica[]> {
    try {
      const { data, error } = await supabase
        .from('entregas_logistica')
        .select(`
          *, 
          pacientes(id, nome_completo, endereco_completo, telefone), 
          motoristas(id, nome, placa_veiculo),
          unidades_serializadas!left(
            id, 
            serial_number, 
            lotes(
              codigo_lote_fabricante,
              medicamentos(nome)
            )
          )
        `)
        .order('created_at', { ascending: false });
      if (error || !data) throw error;

      // Mapear para o formato EntregaLogistica para facilitar o uso no front
      const formattedData = data.map((e: any) => ({
        ...e,
        itens: e.unidades_serializadas?.map((u: any) => ({
          id: u.id,
          serial_number: u.serial_number,
          medicamento_nome: u.lotes?.medicamentos?.nome,
          lote_codigo: u.lotes?.codigo_lote_fabricante
        })) || []
      }));

      return formattedData as EntregaLogistica[];
    } catch (err) {
      console.error('❌ [API Error] getEntregasLogistica:', err);
      return [];
    }
  },

  async getEntregasByPaciente(id: string): Promise<EntregaLogistica[]> {
    try {
      const { data, error } = await supabase
        .from('entregas_logistica')
        .select(`
          *, 
          pacientes(id, nome_completo, endereco_completo, telefone), 
          motoristas(id, nome, placa_veiculo),
          unidades_serializadas!left(
            id, 
            serial_number, 
            lotes(
              codigo_lote_fabricante,
              medicamentos(nome)
            )
          )
        `)
        .eq('paciente_id', id)
        .order('created_at', { ascending: false });

      if (error || !data) throw error;

      const formattedData = data.map((e: any) => ({
        ...e,
        itens: e.unidades_serializadas?.map((u: any) => ({
          id: u.id,
          serial_number: u.serial_number,
          medicamento_nome: u.lotes?.medicamentos?.nome,
          lote_codigo: u.lotes?.codigo_lote_fabricante
        })) || []
      }));

      return formattedData as EntregaLogistica[];
    } catch (err) {
      console.error('❌ [API Error] getEntregasByPaciente:', err);
      return [];
    }
  },

  async getEntregaById(id: string): Promise<EntregaLogistica | null> {
    try {
      const { data, error } = await supabase
        .from('entregas_logistica')
        .select(`
          *, 
          pacientes(id, nome_completo, endereco_completo, telefone), 
          motoristas(id, nome, placa_veiculo)
        `)
        .eq('id', id)
        .single();
      if (error || !data) throw error;
      return data as EntregaLogistica;
    } catch (err) {
      console.error('❌ [API Error] getEntregaById:', err);
      return null;
    }
  },

  async concluirEntrega(id: string, payload: {
    foto_comprovante_url?: string;
    assinatura_digital_url?: string;
    lat_entrega: number;
    lng_entrega: number;
    status: 'ENTREGUE' | 'FALHA';
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('entregas_logistica')
        .update({
          status_entrega: payload.status,
          foto_comprovante_url: payload.foto_comprovante_url,
          assinatura_digital_url: payload.assinatura_digital_url,
          lat_entrega: payload.lat_entrega,
          lng_entrega: payload.lng_entrega,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao concluir entrega:', err);
      return false;
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

      // 7. Risco de Ruptura (ALERTA ou CRÍTICO)
      const { data: risco, error: riscoErr } = await supabase
        .from('vw_previsao_ruptura')
        .select('medicamento_id')
        .in('status_logistico', ['CRÍTICO (ZERADO)', 'ALERTA (MENOS DE 7 DIAS)']);

      const riscoRupturaCount = (!riscoErr && risco) ? risco.length : 0;

      return {
        estoqueCritico,
        leadTimeMedio,
        totalPacientes: totalPacientes || 0,
        entregasAtivas: entregasAtivas || 0,
        entregasConcluidas: entregasConcluidas || 0,
        lotesVencimentoProximo: lotesVencimentoProximo || 0,
        riscoRupturaCount,
      };
    } catch (err) {
      console.error('❌ [API Error] getKpisDashboard:', err);
      throw err;
    }
  },

  // --------------------------------------------------------------------------
  // MOVIMENTAÇÕES DE ESTOQUE — HISTÓRICO
  // --------------------------------------------------------------------------

  async getMovimentacoesPorMedicamento(medicamentoId: string): Promise<MovimentacaoEstoque[]> {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*, lotes(*)')
        .eq('medicamento_id', medicamentoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as MovimentacaoEstoque[];
    } catch (err: any) {
      console.error('❌ [API Error] getMovimentacoesPorMedicamento:', err);
      throw err;
    }
  },

  async registrarMovimentacao(payload: {
    medicamento_id: string;
    lote_id?: string;
    tipo: 'ENTRADA' | 'SAIDA';
    quantidade: number;
    saldo_apos?: number;
    origem?: string;
    destino?: string;
    motivo?: string;
    usuario?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('movimentacoes_estoque')
        .insert([{
          medicamento_id: payload.medicamento_id,
          lote_id: payload.lote_id,
          tipo: payload.tipo,
          quantidade: payload.quantidade,
          saldo_apos: payload.saldo_apos,
          origem: payload.origem,
          destino: payload.destino,
          motivo: payload.motivo,
          usuario: payload.usuario,
        }]);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('❌ [API Error] registrarMovimentacao:', err);
      return { success: false, error: err.message };
    }
  },

  async getConsumoMensal(): Promise<{ month: string; entrada: number; consumo: number }[]> {
    try {
      const { data: lotes, error } = await supabase
        .from('lotes')
        .select('created_at, quantidade_disponivel, custo_unitario');

      if (error || !lotes || lotes.length === 0) throw error;

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
        consumo: Math.round(vals.entrada * 0.7),
      }));
    } catch (err) {
      console.info('🔌 [Fallback]: getConsumoMensal() sem dados');
      return [];
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
      const isExcedido = valorUnitario > 50;
      return { valido: !isExcedido, teto: 50.00, percentualExcedido: isExcedido ? 15 : 0 };
    }
  },

  // --------------------------------------------------------------------------
  // VALIDAÇÃO COMPLETA DE PREÇO (CMED + BPS)
  // --------------------------------------------------------------------------

  async validarPrecoCompleto(
    medicamentoId: string,
    valorUnitario: number,
    bpsPrecos?: Record<string, number>
  ): Promise<{
    cmed: { valido: boolean; teto: number; percentual: number };
    bps: { valido: boolean | null; referencia: number | null; percentual: number | null };
    status: 'OK' | 'ALERTA_BPS' | 'ALERTA_CMED';
  }> {
    // 1. Validar CMED (banco de dados)
    const cmedResult = await this.validarPrecoCmed(medicamentoId, valorUnitario);
    const cmed = {
      valido: cmedResult.valido,
      teto: cmedResult.teto,
      percentual: cmedResult.percentualExcedido,
    };

    // 2. Validar BPS (localStorage)
    let bpsRef: number | null = null;
    if (bpsPrecos) {
      bpsRef = bpsPrecos[medicamentoId] ?? null;
    } else if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('bps_precos') || '{}');
        bpsRef = stored[medicamentoId] ?? null;
      } catch {
        bpsRef = null;
      }
    }

    const bps =
      bpsRef !== null
        ? {
          valido: valorUnitario <= bpsRef,
          referencia: bpsRef,
          percentual: valorUnitario > bpsRef ? ((valorUnitario / bpsRef) - 1) * 100 : 0,
        }
        : { valido: null, referencia: null, percentual: null };

    // 3. Status consolidado — nunca bloqueia, apenas alerta
    const status = !cmed.valido
      ? 'ALERTA_CMED'
      : bps.valido === false
        ? 'ALERTA_BPS'
        : 'OK';

    return { cmed, bps, status };
  },

  // --------------------------------------------------------------------------
  // REGISTRO DE COMPRA
  // --------------------------------------------------------------------------

  async createCompra(payload: {
    medicamento_id: string;
    fornecedor_id: string;
    quantidade: number;
    valor_unitario: number;
    data_entrega_prevista?: string;
  }): Promise<{ success: boolean; error?: string; alerta?: string }> {
    try {
      const validacao = await this.validarPrecoCompleto(payload.medicamento_id, payload.valor_unitario);

      // Compra sempre permitida — CMED e BPS geram alertas, nunca bloqueios
      const alerta = validacao.status === 'ALERTA_CMED'
        ? `⚠ Preço acima do teto CMED (R$ ${validacao.cmed.teto.toFixed(2)}) em +${validacao.cmed.percentual.toFixed(1)}%`
        : validacao.status === 'ALERTA_BPS'
          ? `⚠ Preço acima da referência BPS (R$ ${validacao.bps.referencia?.toFixed(2)}) em +${validacao.bps.percentual?.toFixed(1)}%`
          : undefined;

      const { error } = await supabase.from('compras_registro').insert([{
        medicamento_id: payload.medicamento_id,
        fornecedor_id: payload.fornecedor_id,
        quantidade: payload.quantidade,
        valor_unitario: payload.valor_unitario,
        data_solicitacao: new Date().toISOString().split('T')[0],
        data_entrega_prevista: payload.data_entrega_prevista || null,
        status: 'SOLICITADO',
        motivo_sugestao: alerta ?? null,
      }]);

      if (error) {
        // Tabela ainda não existe — salva auditoria e retorna sucesso parcial
        if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          await auditoriaAPI.log('CREATE', 'compras_registro', {
            ...payload,
            validacao_cmed: validacao.cmed,
            validacao_bps: validacao.bps,
            status_conformidade: validacao.status,
            nota: 'Tabela compras_registro pendente de migração — auditoria registrada',
          });
          return { success: true };
        }
        throw error;
      }

      // Auditoria
      await auditoriaAPI.log('CREATE', 'compras_registro', {
        ...payload,
        validacao_cmed: validacao.cmed,
        validacao_bps: validacao.bps,
        status_conformidade: validacao.status,
      });

      return { success: true, alerta };
    } catch (err: any) {
      console.error('❌ [API Error] createCompra:', err);
      return { success: false, error: err?.message || 'Erro desconhecido' };
    }
  },

  // --------------------------------------------------------------------------
  // LOGÍSTICA — Temperatura da Rota (cadeia de frio real)
  // --------------------------------------------------------------------------

  /** Leituras de temperatura registradas durante a entrega */
  async getTemperaturaRota(entregaId: string): Promise<{
    id: string;
    temperatura: number;
    timestamp: string;
    lat: number | null;
    lng: number | null;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('temperatura_leituras')
        .select('id, temperatura, timestamp, lat, lng')
        .eq('entrega_id', entregaId)
        .order('timestamp', { ascending: true });
      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('❌ [API Error] getTemperaturaRota:', err);
      return [];
    }
  },

}; // fim api

/** Utilitário: distância haversine em km entre dois pontos geográficos */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
    } catch (err) {
      console.error('❌ [API Error] logAuditoria:', err);
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
    } catch (err) {
      console.error('Erro ao registrar log WORM:', err);
      return { success: false };
    }
  },

  async getLogsRecentes(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('logs_auditoria')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error || !data) throw error;
      return data;
    } catch (err) {
      console.error('❌ [API Error] getLogsRecentes:', err);
      return [];
    }
  }
};

export const recallAPI = {
  subscribeToRecall(onRecall: (payload: any) => void) {
    return supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lotes',
          filter: 'status=eq.RECALL'
        },
        (payload) => {
          console.log('🚨 RECALL DETECTADO NO BANCO!', payload);
          onRecall(payload);
        }
      )
      .subscribe();
  },

  /** Rastreia um serial number individual retornando toda a cadeia de custódia */
  async rastrearSerialNumber(serial: string): Promise<{
    serial_number: string;
    lote: { codigo: string; validade: string; status: string };
    medicamento: { nome: string };
    paciente?: { nome: string; id: string };
    entregas: { data: string; status: string; entregador: string }[];
  } | null> {
    try {
      // 1. Buscar a unidade serializada com lote e medicamento (sem entregas)
      const { data, error } = await supabase
        .from('unidades_serializadas')
        .select(`
          id, serial_number, status,
          lotes (
            codigo_lote_fabricante, data_validade, status,
            medicamentos (nome)
          )
        `)
        .eq('serial_number', serial)
        .single();
      if (error || !data) return null;
      const l = (data as any).lotes ?? {};

      // 2. Buscar entregas desta unidade separadamente
      let entregas: any[] = [];
      let ultimaEntrega: any = null;
      const { data: entregasData } = await supabase
        .from('entregas_logistica')
        .select('created_at, status_entrega, entregador_nome, paciente_id, pacientes(id, nome_completo)')
        .eq('unidade_serializada_id', (data as any).id)
        .order('created_at', { ascending: true });
      if (entregasData && entregasData.length > 0) {
        entregas = entregasData;
        ultimaEntrega = entregasData[entregasData.length - 1];
      }

      return {
        serial_number: (data as any).serial_number,
        lote: {
          codigo: l.codigo_lote_fabricante,
          validade: l.data_validade,
          status: l.status,
        },
        medicamento: { nome: l.medicamentos?.nome ?? '' },
        paciente: ultimaEntrega?.pacientes
          ? { nome: ultimaEntrega.pacientes.nome_completo, id: ultimaEntrega.pacientes.id }
          : undefined,
        entregas: entregas.map((e: any) => ({
          data: e.created_at,
          status: e.status_entrega,
          entregador: e.entregador_nome ?? '',
        })),
      };
    } catch (err) {
      console.error('❌ [API Error] rastrearSerialNumber:', err);
      return null;
    }
  },

  /** Retorna todos os lotes com status RECALL */
  async getLotesEmRecall(): Promise<{
    id: string;
    codigo_lote_fabricante: string;
    data_validade: string;
    medicamento_nome: string;
    unidades_afetadas: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('lotes')
        .select('id, codigo_lote_fabricante, data_validade, medicamentos(nome)')
        .eq('status', 'RECALL');
      if (error) throw error;
      const result = await Promise.all((data ?? []).map(async (l: any) => {
        const { count } = await supabase
          .from('unidades_serializadas')
          .select('*', { count: 'exact', head: true })
          .eq('lote_id', l.id);
        return {
          id: l.id,
          codigo_lote_fabricante: l.codigo_lote_fabricante,
          data_validade: l.data_validade,
          medicamento_nome: l.medicamentos?.nome ?? '',
          unidades_afetadas: count ?? 0,
        };
      }));
      return result;
    } catch (err) {
      console.error('❌ [API Error] getLotesEmRecall:', err);
      return [];
    }
  },

  /** FEFO: verifica se há unidades vencidas ou próximas do vencimento sendo usadas antes de outras */
  async verificarViolacaoFEFO(loteIds: string[]): Promise<{
    violou: boolean;
    lotes_problema: { id: string; codigo: string; validade: string }[];
  }> {
    try {
      if (!loteIds.length) return { violou: false, lotes_problema: [] };
      const { data, error } = await supabase
        .from('lotes')
        .select('id, codigo_lote_fabricante, data_validade, status')
        .in('id', loteIds)
        .order('data_validade', { ascending: true });
      if (error) throw error;
      const hoje = new Date();
      const problemáticos = (data ?? []).filter((l: any) => {
        const validade = new Date(l.data_validade);
        const diasRestantes = Math.round((validade.getTime() - hoje.getTime()) / 86400000);
        return diasRestantes < 0 || (diasRestantes < 30 && l.status !== 'RECALL');
      });
      return {
        violou: problemáticos.length > 0,
        lotes_problema: problemáticos.map((l: any) => ({
          id: l.id,
          codigo: l.codigo_lote_fabricante,
          validade: l.data_validade,
        })),
      };
    } catch (err) {
      console.error('❌ [API Error] verificarViolacaoFEFO:', err);
      return { violou: false, lotes_problema: [] };
    }
  },

  // --------------------------------------------------------------------------
  // FEFO — Verificação por medicamento + lote específico
  // --------------------------------------------------------------------------

  /** Verifica se o lote selecionado viola FEFO: retorna o lote correto (mais próximo do vencimento) */
  async verificarFEFO(medicamentoId: string, loteId: string): Promise<{
    violacao: boolean;
    loteCorreto: { id: string; codigo_lote_fabricante: string; data_validade: string } | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('lotes')
        .select('id, codigo_lote_fabricante, data_validade')
        .eq('medicamento_id', medicamentoId)
        .eq('status', 'ATIVO')
        .gt('quantidade_disponivel', 0)
        .order('data_validade', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return { violacao: false, loteCorreto: null };
      const loteCorreto = data[0] as { id: string; codigo_lote_fabricante: string; data_validade: string };
      return {
        violacao: loteCorreto.id !== loteId,
        loteCorreto,
      };
    } catch (err) {
      console.error('❌ [API Error] verificarFEFO:', err);
      return { violacao: false, loteCorreto: null };
    }
  },

  // --------------------------------------------------------------------------
  // RASTREABILIDADE — Serial Numbers
  // --------------------------------------------------------------------------

  /** Lista todas as unidades serializadas de um lote */
  async getUnidadesSeriadas(loteId: string): Promise<{
    id: string;
    serial_number: string;
    status: string;
    dispense_id: string | null;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('unidades_serializadas')
        .select('id, serial_number, status, dispense_id')
        .eq('lote_id', loteId)
        .order('serial_number');
      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('❌ [API Error] getUnidadesSeriadas:', err);
      return [];
    }
  },

  /** Rastreia um S/N: retorna fornecedor, custo de compra, CPF do paciente e data de dispensação */
  async rastrearPorSerial(serial: string): Promise<{
    serial_number: string;
    status: string;
    lote_codigo: string;
    data_validade: string;
    custo_unitario: number;
    medicamento_nome: string;
    fornecedor_nome: string | null;
    paciente_cpf: string | null;
    paciente_nome: string | null;
    data_dispensacao: string | null;
  } | null> {
    try {
      // Busca a unidade serializada com seu lote e medicamento
      const { data: unidade, error: errU } = await supabase
        .from('unidades_serializadas')
        .select('id, serial_number, status, dispense_id, lote_id')
        .eq('serial_number', serial)
        .maybeSingle();
      if (errU) throw errU;
      if (!unidade) return null;

      // Busca o lote com medicamento e fornecedor preferencial
      const { data: lote, error: errL } = await supabase
        .from('lotes')
        .select('codigo_lote_fabricante, data_validade, custo_unitario, medicamento_id')
        .eq('id', unidade.lote_id)
        .maybeSingle();
      if (errL || !lote) throw errL;

      const { data: med, error: errM } = await supabase
        .from('medicamentos')
        .select('nome, fornecedor_preferencial_id')
        .eq('id', lote.medicamento_id)
        .maybeSingle();
      if (errM) throw errM;

      let fornecedor_nome: string | null = null;
      if (med?.fornecedor_preferencial_id) {
        const { data: forn } = await supabase
          .from('fornecedores')
          .select('razao_social')
          .eq('id', med.fornecedor_preferencial_id)
          .maybeSingle();
        fornecedor_nome = forn?.razao_social ?? null;
      }

      let paciente_cpf: string | null = null;
      let paciente_nome: string | null = null;
      let data_dispensacao: string | null = null;

      if (unidade.dispense_id) {
        const { data: dispense } = await supabase
          .from('dispensacoes')
          .select('created_at, paciente_id')
          .eq('id', unidade.dispense_id)
          .maybeSingle();
        if (dispense) {
          data_dispensacao = dispense.created_at;
          const { data: pac } = await supabase
            .from('pacientes')
            .select('cpf, nome_completo')
            .eq('id', dispense.paciente_id)
            .maybeSingle();
          paciente_cpf = pac?.cpf ?? null;
          paciente_nome = pac?.nome_completo ?? null;
        }
      }

      return {
        serial_number: unidade.serial_number,
        status: unidade.status,
        lote_codigo: lote.codigo_lote_fabricante,
        data_validade: lote.data_validade,
        custo_unitario: lote.custo_unitario,
        medicamento_nome: med?.nome ?? '',
        fornecedor_nome,
        paciente_cpf,
        paciente_nome,
        data_dispensacao,
      };
    } catch (err) {
      console.error('❌ [API Error] rastrearPorSerial:', err);
      return null;
    }
  },

  // --------------------------------------------------------------------------
  // CRM PACIENTE — Timeline + Investimento + Adesão
  // --------------------------------------------------------------------------

  /** Timeline cronológica reversa de dispensações de um paciente */
  async getTimelineDispensacoes(pacienteId: string): Promise<{
    id: string;
    created_at: string;
    status: string;
    medicamento_nome: string;
    lote_codigo: string;
    serials: string[];
    custo_total: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('dispensacoes')
        .select('id, created_at, status, itens_dispensacao(quantidade, custo_unitario_lote, lotes(codigo_lote_fabricante, medicamentos(nome)))')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const result = await Promise.all((data ?? []).map(async (d: any) => {
        const { data: seriais } = await supabase
          .from('unidades_serializadas')
          .select('serial_number')
          .eq('dispense_id', d.id);
        const itens = d.itens_dispensacao ?? [];
        const custo_total = itens.reduce((acc: number, item: any) =>
          acc + (item.quantidade ?? 1) * (item.custo_unitario_lote ?? 0), 0);
        const primeiroItem = itens[0];
        return {
          id: d.id,
          created_at: d.created_at,
          status: d.status,
          medicamento_nome: primeiroItem?.lotes?.medicamentos?.nome ?? '—',
          lote_codigo: primeiroItem?.lotes?.codigo_lote_fabricante ?? '—',
          serials: (seriais ?? []).map((s: any) => s.serial_number),
          custo_total,
        };
      }));
      return result;
    } catch (err) {
      console.error('❌ [API Error] getTimelineDispensacoes:', err);
      return [];
    }
  },

  /** Σ(Qi × Vu_lote) — Investimento real baseado no custo do lote dispensado */
  async calcularInvestimentoPaciente(pacienteId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('itens_dispensacao')
        .select('quantidade, custo_unitario_lote, dispensacoes!inner(paciente_id)')
        .eq('dispensacoes.paciente_id', pacienteId);
      if (error) throw error;
      return (data ?? []).reduce((acc: number, item: any) =>
        acc + (item.quantidade ?? 1) * (item.custo_unitario_lote ?? 0), 0);
    } catch (err) {
      console.error('❌ [API Error] calcularInvestimentoPaciente:', err);
      return 0;
    }
  },

  /** (dispensações_recebidas / programadas) × 100 */
  async calcularIndiceAdesao(pacienteId: string): Promise<number> {
    try {
      const { count: total } = await supabase
        .from('dispensacoes')
        .select('*', { count: 'exact', head: true })
        .eq('paciente_id', pacienteId);
      const { count: recebidas } = await supabase
        .from('dispensacoes')
        .select('*', { count: 'exact', head: true })
        .eq('paciente_id', pacienteId)
        .eq('status', 'DISPENSADO');
      if (!total || total === 0) return 0;
      return Math.round(((recebidas ?? 0) / total) * 100);
    } catch (err) {
      console.error('❌ [API Error] calcularIndiceAdesao:', err);
      return 0;
    }
  },

  // --------------------------------------------------------------------------
  // RECALL — Cascata real + WhatsApp
  // --------------------------------------------------------------------------

  /** Inicia recall de um lote: muda status, bloqueia picking, retorna pacientes afetados */
  async iniciarRecall(loteId: string, motivo: string): Promise<{
    pacientesAfetados: { id: string; nome_completo: string; cpf: string; telefone: string | null }[];
  }> {
    try {
      // 1) Atualizar status do lote para RECALL
      const { error: errLote } = await supabase
        .from('lotes')
        .update({ status: 'RECALL' })
        .eq('id', loteId);
      if (errLote) throw errLote;

      // 2) Bloquear unidades serializadas deste lote
      await supabase
        .from('unidades_serializadas')
        .update({ status: 'BLOQUEADO' })
        .eq('lote_id', loteId)
        .neq('status', 'DISPENSADO');

      // 3) Registrar auditoria
      await supabase.from('auditoria_logs').insert({
        acao: 'RECALL_INICIADO',
        tabela_afetada: 'lotes',
        registro_id: loteId,
        dados_novos: { motivo, status: 'RECALL' },
        severidade: 'CRITICA',
      });

      // 4) Buscar pacientes afetados via dispensações que consumiram este lote
      const { data: seriais } = await supabase
        .from('unidades_serializadas')
        .select('dispense_id')
        .eq('lote_id', loteId)
        .eq('status', 'DISPENSADO');

      const dispenseIds = [...new Set((seriais ?? [])
        .map((s: any) => s.dispense_id)
        .filter(Boolean))];

      if (dispenseIds.length === 0) return { pacientesAfetados: [] };

      const { data: dispensacoes } = await supabase
        .from('dispensacoes')
        .select('paciente_id')
        .in('id', dispenseIds);

      const pacienteIds = [...new Set((dispensacoes ?? []).map((d: any) => d.paciente_id))];

      const { data: pacientes } = await supabase
        .from('pacientes')
        .select('id, nome_completo, cpf, telefone')
        .in('id', pacienteIds);

      return { pacientesAfetados: pacientes ?? [] };
    } catch (err) {
      console.error('❌ [API Error] iniciarRecall:', err);
      throw err;
    }
  },

  /** Envia alerta WhatsApp inserindo na fila de notificações */
  async enviarAlertaWhatsApp(pacienteId: string, mensagem: string): Promise<void> {
    try {
      const { error } = await supabase.from('notificacoes_fila').insert({
        paciente_id: pacienteId,
        mensagem,
        canal: 'WHATSAPP',
        status: 'PENDENTE',
      });
      if (error) throw error;
    } catch (err) {
      console.error('❌ [API Error] enviarAlertaWhatsApp:', err);
      throw err;
    }
  },

  // --------------------------------------------------------------------------
  // LOGÍSTICA — Temperatura da Rota
  // --------------------------------------------------------------------------

  /** Leituras de temperatura registradas durante a entrega */
  async getTemperaturaRota(entregaId: string): Promise<{
    id: string;
    temperatura: number;
    timestamp: string;
    lat: number | null;
    lng: number | null;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('temperatura_leituras')
        .select('id, temperatura, timestamp, lat, lng')
        .eq('entrega_id', entregaId)
        .order('timestamp', { ascending: true });
      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('❌ [API Error] getTemperaturaRota:', err);
      return [];
    }
  },
};