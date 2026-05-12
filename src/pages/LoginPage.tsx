import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { Shield, Lock, Mail, Users } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('COMPRADOR');
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await login({
      id: Math.random().toString(36).substr(2, 9),
      nome: role === 'COMPRADOR' ? 'João Comprador' : 'Maria Fornecedora',
      email: email || 'usuario@vigiasaude.com.br',
      role: role,
    });

    navigate(role === 'COMPRADOR' ? '/comprador' : '/fornecedor');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all hover:shadow-blue-200/50">
        <div className="bg-blue-600 p-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Vigia Saúde</h1>
          <p className="mt-2 text-blue-100">Portal de Gestão de Medicamentos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700" htmlFor="email">
              E-mail
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                required
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="exemplo@vigiasaude.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700" htmlFor="password">
              Senha
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                required
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Perfil de Acesso</label>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('COMPRADOR')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all ${
                  role === 'COMPRADOR'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4" />
                Comprador
              </button>
              <button
                type="button"
                onClick={() => setRole('FORNECEDOR')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all ${
                  role === 'FORNECEDOR'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4" />
                Fornecedor
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>

        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Monitoramento em Tempo Real
          </p>
        </div>
      </div>
    </div>
  );
}
