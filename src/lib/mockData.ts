import { Ata, Auditoria, Fornecedor, MedicamentoAta, PedidoCompra } from '../types';

export const mockFornecedores: Fornecedor[] = [
  { id: 'f1', nome: 'MedSupply Nacional LTDA', status: 'ATIVO', email: 'contato@medsupply.com.br' },
  { id: 'f2', nome: 'FarmaDistribuidora Regional', status: 'ATIVO', email: 'vendas@farmadistribuidora.com.br' },
  { id: 'f3', nome: 'Global Health Import', status: 'PENDENTE', email: 'cadastro@globalhealth.com' },
  { id: 'f4', nome: 'BioLogistica Sul', status: 'BLOQUEADO', email: 'legal@biologisticasul.com.br' },
];

export const mockAtas: Ata[] = [
  {
    id: 'a1',
    numero: 'SRP 045/2025',
    dataInicio: '2025-01-10T00:00:00Z',
    dataFim: '2026-01-10T00:00:00Z',
    valorTeto: 2500000.0,
    fornecedorId: 'f1',
    status: 'ATIVA',
  },
  {
    id: 'a2',
    numero: 'SRP 112/2024',
    dataInicio: '2024-05-15T00:00:00Z',
    dataFim: '2025-05-15T00:00:00Z',
    valorTeto: 1800000.0,
    fornecedorId: 'f2',
    status: 'ATIVA',
  },
  {
    id: 'a3',
    numero: 'SRP 010/2023',
    dataInicio: '2023-02-20T00:00:00Z',
    dataFim: '2024-02-20T00:00:00Z',
    valorTeto: 500000.0,
    fornecedorId: 'f1',
    status: 'VENCIDA',
  },
];

export const mockMedicamentosAta: MedicamentoAta[] = [
  // Ata 1 (f1)
  { id: 'm1', ataId: 'a1', nome: 'Dipirona Sódica 500mg/ml', precoUnitario: 0.85, quantidadeInicial: 100000, quantidadeUsada: 45000, precoBPS: 0.90, precoCMED: 1.20 },
  { id: 'm2', ataId: 'a1', nome: 'Paracetamol 750mg', precoUnitario: 0.45, quantidadeInicial: 50000, quantidadeUsada: 48000, precoBPS: 0.50, precoCMED: 0.75 },
  { id: 'm3', ataId: 'a1', nome: 'Amoxicilina 500mg', precoUnitario: 1.20, quantidadeInicial: 20000, quantidadeUsada: 5000, precoBPS: 1.15, precoCMED: 2.10 },
  // Ata 2 (f2)
  { id: 'm4', ataId: 'a2', nome: 'Losartana Potássica 50mg', precoUnitario: 0.30, quantidadeInicial: 200000, quantidadeUsada: 120000, precoBPS: 0.35, precoCMED: 0.60 },
  { id: 'm5', ataId: 'a2', nome: 'Omeprazol 20mg', precoUnitario: 0.60, quantidadeInicial: 80000, quantidadeUsada: 80000, precoBPS: 0.65, precoCMED: 1.05 }, // Esgotado
];

export const mockPedidosCompra: PedidoCompra[] = [
  {
    id: 'pdc1',
    status: 'ENTREGUE',
    ataId: 'a1',
    dataCriacao: '2025-02-15T10:30:00Z',
    itens: [
      { medicamentoId: 'm1', quantidade: 20000, precoUnitario: 0.85 },
      { medicamentoId: 'm2', quantidade: 25000, precoUnitario: 0.45 },
    ],
    valorTotal: 17000 + 11250, // 28250
  },
  {
    id: 'pdc2',
    status: 'EM_TRANSITO',
    ataId: 'a2',
    dataCriacao: '2026-05-01T14:20:00Z',
    itens: [
      { medicamentoId: 'm4', quantidade: 50000, precoUnitario: 0.30 },
    ],
    valorTotal: 15000,
  },
  {
    id: 'pdc3',
    status: 'RASCUNHO',
    ataId: 'a1',
    dataCriacao: '2026-05-10T09:00:00Z',
    itens: [
      { medicamentoId: 'm3', quantidade: 5000, precoUnitario: 1.20 },
    ],
    valorTotal: 6000,
  },
  {
    id: 'pdc4',
    status: 'APROVADO',
    ataId: 'a1',
    dataCriacao: '2026-05-11T16:45:00Z',
    itens: [
      { medicamentoId: 'm1', quantidade: 10000, precoUnitario: 0.85 },
    ],
    valorTotal: 8500,
  },
];

export const mockAuditoria: Auditoria[] = [
  { id: 'aud1', timestamp: '2025-01-05T08:00:00Z', usuarioId: 'u1', acao: 'CRIACAO', entidadeId: 'f1', detalhes: 'Fornecedor MedSupply cadastrado no sistema.' },
  { id: 'aud2', timestamp: '2025-01-10T09:30:00Z', usuarioId: 'u2', acao: 'CRIACAO', entidadeId: 'a1', detalhes: 'Ata SRP 045/2025 registrada.' },
  { id: 'aud3', timestamp: '2026-05-11T16:45:00Z', usuarioId: 'u3', acao: 'APROVACAO', entidadeId: 'pdc4', detalhes: 'Pedido de compra pdc4 aprovado pela diretoria.' },
  { id: 'aud4', timestamp: '2026-05-05T10:15:00Z', usuarioId: 'u1', acao: 'BLOQUEIO', entidadeId: 'f4', detalhes: 'Fornecedor BioLogistica Sul bloqueado por documentação irregular.' },
];
