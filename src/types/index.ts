export type FornecedorStatus = 'ATIVO' | 'PENDENTE' | 'BLOQUEADO';

export interface Fornecedor {
  id: string;
  nome: string;
  status: FornecedorStatus;
  email: string;
}

export type AtaStatus = 'ATIVA' | 'VENCIDA' | 'CANCELADA' | 'EM_REVISAO';

export interface Ata {
  id: string;
  numero: string;
  dataInicio: string; // ISO date string
  dataFim: string; // ISO date string
  valorTeto: number;
  fornecedorId: string;
  status: AtaStatus;
}

export interface MedicamentoAta {
  id: string;
  ataId: string;
  nome: string;
  precoUnitario: number;
  quantidadeInicial: number;
  quantidadeUsada: number;
  precoBPS: number;
  precoCMED: number;
}

export type PedidoCompraStatus = 
  | 'RASCUNHO' 
  | 'PENDENTE' 
  | 'APROVADO' 
  | 'EM_TRANSITO' 
  | 'ENTREGUE' 
  | 'CANCELADO';

export interface PedidoCompraItem {
  medicamentoId: string;
  quantidade: number;
  precoUnitario: number; // Preço no momento do pedido
}

export interface PedidoCompra {
  id: string;
  status: PedidoCompraStatus;
  ataId: string;
  itens: PedidoCompraItem[];
  valorTotal: number;
  dataCriacao: string; // ISO date string
}

export type AuditoriaAcao = 'CRIACAO' | 'ATUALIZACAO' | 'EXCLUSAO' | 'APROVACAO' | 'BLOQUEIO';

export interface Auditoria {
  id: string;
  timestamp: string; // ISO date string
  usuarioId: string;
  acao: AuditoriaAcao;
  entidadeId: string;
  detalhes: string;
}
