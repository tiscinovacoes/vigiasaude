import { mockPedidosCompra, mockAtas } from '../lib/mockData';
import type { PedidoCompra } from '../types';

export interface PedidoWithAta extends PedidoCompra {
  ataNumero: string;
}

export const getPedidos = async (): Promise<PedidoWithAta[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = mockPedidosCompra.map(pedido => {
        const ata = mockAtas.find(a => a.id === pedido.ataId);
        return {
          ...pedido,
          ataNumero: ata?.numero || 'Desconhecida'
        };
      });
      resolve(data);
    }, 800);
  });
};

export const getPedidoById = async (id: string): Promise<PedidoWithAta | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const pedido = mockPedidosCompra.find(p => p.id === id);
      if (!pedido) {
        resolve(null);
        return;
      }
      const ata = mockAtas.find(a => a.id === pedido.ataId);
      resolve({
        ...pedido,
        ataNumero: ata?.numero || 'Desconhecida'
      });
    }, 800);
  });
};
