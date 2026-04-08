'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    let masked = value;
    if (value.length > 9) {
      masked = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      masked = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      masked = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    
    setCpf(masked);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        throw new Error('CPF incompleto. Digite 11 dígitos.');
      }

      // Converte CPF para formato email esperado pelo Supabase Auth no sistema
      const email = `${cleanCpf}@vigiamunicipioteste.ms.gov.br`;

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error('Credenciais inválidas. Verifique seu CPF e senha.');
      }

      if (data.user) {
        // Validação adicional na tabela usuarios_sistema
        const { data: userData, error: userError } = await supabase
          .from('usuarios_sistema')
          .select('id, ativo, perfil_id')
          .eq('auth_user_id', data.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error(userError);
          // throw new Error('Erro ao validar permissões.');
        }

        if (userData && !userData.ativo) {
          // Desloga o usuário se inativo
          await supabase.auth.signOut();
          throw new Error('Acesso negado: Usuário inativo no sistema.');
        }

        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao conectar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Background radial gradient and subtle elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-vigia-blue)_0%,_#0A1128_100%)] opacity-90" />
      <div className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[100px] -top-64 -left-64 pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[80px] bottom-0 right-0 pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header Section */}
          <div className="pt-10 pb-6 px-8 text-center bg-slate-50 border-b border-slate-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vigia-blue bg-[#1A2B6D] text-white shadow-lg mb-4 border-4 border-white ring-2 ring-slate-100">
              <Shield size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Vigia Saúde
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">
              Municipio Teste - MS
            </p>
            <p className="text-xs text-slate-400 mt-2 px-4">
              Sistema de Vigilância e Gestão de Medicamentos
            </p>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="font-medium leading-relaxed">{error}</p>
                </div>
              )}

              {/* CPF Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 ml-1">
                  CPF
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2B6D] focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 ml-1">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2B6D] focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || cpf.length < 14 || !password}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#1A2B6D] hover:bg-[#121f4f] text-white rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none font-semibold text-sm"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Shield size={18} />
                    Entrar
                  </>
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center pt-2">
                <a
                  href="#"
                  className="text-sm font-medium text-slate-500 hover:text-[#1A2B6D] transition-colors"
                >
                  Esqueci minha senha
                </a>
              </div>
              
            </form>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-sm text-blue-200/60 font-medium">
            &copy; {new Date().getFullYear()} Governo de Municipio Teste - MS
          </p>
        </div>
      </div>
    </div>
  );
}
