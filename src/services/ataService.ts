import { mockAtas, mockFornecedores, mockMedicamentosAta, mockPedidosCompra } from '../lib/mockData';
import type { Ata, MedicamentoAta, PedidoCompra } from '../types';

export interface AtaWithFornecedor extends Ata {
  fornecedorNome: string;
}

export interface AtaFullDetails extends AtaWithFornecedor {
  medicamentos: MedicamentoAta[];
  pedidos: PedidoCompra[];
}

export const getAtas = async (): Promise<AtaWithFornecedor[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = mockAtas.map(ata => ({
        ...ata,
        fornecedorNome: mockFornecedores.find(f => f.id === ata.fornecedorId)?.nome || 'Desconhecido',
      }));
      resolve(data);
    }, 800);
  });
};

export const getAtaFullDetails = async (id: string): Promise<AtaFullDetails | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const ata = mockAtas.find(a => a.id === id);
      if (!ata) {
        resolve(null);
        return;
      }
      
      const result: AtaFullDetails = {
        ...ata,
        fornecedorNome: mockFornecedores.find(f => f.id === ata.fornecedorId)?.nome || 'Desconhecido',
        medicamentos: mockMedicamentosAta.filter(m => m.ataId === id),
        pedidos: mockPedidosCompra.filter(p => p.ataId === id),
      };
      
      resolve(result);
    }, 800);
  });
};
