export const MockServer = {
  async getMedicamentos() {
    return [
      { id: 'med_001', nome: 'Insulina NPH 100UI/ml', categoria: 'Injetável', status: 'Atenção', preco_teto_cmed: 45.00, estoque_total: 120 },
      { id: 'med_002', nome: 'Sinvastatina 20mg', categoria: 'Comprimido', status: 'Normal', preco_teto_cmed: 1.80, estoque_total: 8000 },
      { id: 'med_003', nome: 'Rivastigmina 1.5mg', categoria: 'Cápsula', status: 'Crítico', preco_teto_cmed: 320.00, estoque_total: 15 }
    ];
  },

  async logAuditoria(data: any) {
    console.warn('[MOCK SERVER] Registro de Auditoria Armazenado em Memória Local:', data);
    return true;
  },

  async validarFefoMobile(loteEscaneado: string, loteEsperado: string) {
    if (loteEscaneado !== loteEsperado) {
      return { valido: false, erro: 'Risco de Dispensação. Lote scanneado diverge da regra FEFO (First-Expired, First-Out)' };
    }
    return { valido: true };
  },

  async getPerformanceMotorista(motoristaId: string) {
    return {
      motoristaId,
      efetividade: 98.2,
      devolucoes: 3,
      emRota: true
    };
  }
};
