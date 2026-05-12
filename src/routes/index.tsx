import { createBrowserRouter } from 'react-router';
import Layout from '../components/Layout/Layout';
import Auth from '../pages/Auth';
import Comprador from '../pages/Comprador';
import Fornecedor from '../pages/Fornecedor';
import Fallback from '../pages/Fallback';

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <Fallback />,
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">Início</h1>
            <p className="mt-2 text-gray-600">Bem-vindo ao Vigia Saúde.</p>
          </div>
        ),
      },
      {
        path: 'comprador',
        element: <Comprador />,
      },
      {
        path: 'fornecedor',
        element: <Fornecedor />,
      },
      {
        path: 'atas',
        lazy: async () => {
          const { AtasLista } = await import('../pages/Atas');
          return { Component: AtasLista };
        },
      },
      {
        path: 'atas/:id',
        lazy: async () => {
          const { AtasDetalhes } = await import('../pages/Atas/Detalhes');
          return { Component: AtasDetalhes };
        },
      },
      {
        path: 'pedidos',
        lazy: async () => {
          const { PedidosLista } = await import('../pages/Pedidos');
          return { Component: PedidosLista };
        },
      },
      {
        path: 'confirmar-entrega/:id',
        lazy: async () => {
          const { ConfirmarEntrega } = await import('../pages/Pedidos/ConfirmarEntrega');
          return { Component: ConfirmarEntrega };
        },
      },
      {
        path: 'comparar-orcamentos/:id',
        lazy: async () => {
          const { CompararOrcamentos } = await import('../pages/CompararOrcamentos');
          return { Component: CompararOrcamentos };
        },
      },
    ],
  },
  {
    path: '/auth',
    element: <Auth />,
    errorElement: <Fallback />,
  },
]);
