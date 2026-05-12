import { createBrowserRouter } from 'react-router';
import App from '../App';
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
    ],
  },
  {
    path: '/auth',
    element: <Auth />,
    errorElement: <Fallback />,
  },
]);
