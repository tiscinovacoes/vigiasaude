'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Users, Search, Plus, X, ArrowRight, UserCircle2, Clock, MapPin, PackageOpen } from 'lucide-react';

type Paciente = {
  id: string;
  cpf: string;
  nome: string;
  endereco: string;
  janela_entrega: string;
  status: string;
  entregas_recentes: number;
};

const MOCK_PACIENTES: Paciente[] = [
  { id: 'p001', cpf: '123.456.789-00', nome: 'Maria Aparecida da Silva', endereco: 'Rua das Flores, 120 - Centro', janela_entrega: 'Manhã (08h - 12h)', status: 'Ativo', entregas_recentes: 3 },
  { id: 'p002', cpf: '987.654.321-99', nome: 'João Pedro Alves', endereco: 'Av. Joaquim Teixeira, 500 - Jd. Europa', janela_entrega: 'Tarde (13h - 18h)', status: 'Ativo', entregas_recentes: 1 },
  { id: 'p003', cpf: '456.123.789-11', nome: 'Ana Beatriz Mendes', endereco: 'Rua São Paulo, 45 - Vila Nova', janela_entrega: 'Integral (08h - 18h)', status: 'Atenção', entregas_recentes: 0 },
];

export default function ListaPacientes() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState(MOCK_PACIENTES);
  const [busca, setBusca] = useState('');
  
  // Modals / Drawer State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [drawerPaciente, setDrawerPaciente] = useState<Paciente | null>(null);

  const pacientesFiltrados = pacientes.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || p.cpf.includes(busca)
  );

  const fecharDrawer = () => setDrawerPaciente(null);

  const salvarNovoPaciente = (e: React.FormEvent) => {
    e.preventDefault();
    /* Logic for insertion via supabase:
       await supabase.from('pacientes').insert([{ cpf, nome... }]) 
    */
    setIsNewModalOpen(false);
    // Refresh...
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full space-y-6 relative overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cuidado ao Paciente</h1>
          <p className="text-sm text-slate-500 mt-1">Gestão de cadastros e visão centralizada de entregas domiciliárias</p>
        </div>
        <button 
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A2B6D] hover:bg-[#121f4f] text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} /> Novo Paciente
        </button>
      </div>

      {/* FILTROS E TABELA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por Nome ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
          <p className="text-sm text-slate-500 font-medium">{pacientesFiltrados.length} encontrados</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-700">Paciente</th>
                <th className="px-5 py-3 font-semibold text-slate-700">CPF</th>
                <th className="px-5 py-3 font-semibold text-slate-700">Janela de Entrega</th>
                <th className="px-5 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-5 py-3 font-semibold text-slate-700 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pacientesFiltrados.map((paciente) => (
                <tr key={paciente.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {paciente.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{paciente.nome}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {paciente.endereco.substring(0,25)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-600">{paciente.cpf}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded inline-flex">
                      <Clock size={12} className="text-slate-400" /> {paciente.janela_entrega}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${paciente.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {paciente.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => setDrawerPaciente(paciente)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors inline-flex items-center gap-1.5"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER LATERAL (Detalhes do Paciente) */}
      {drawerPaciente && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={fecharDrawer} />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 animate-in slide-in-from-right">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCircle2 className="text-[#1A2B6D]" /> Perfil Rápido
              </h3>
              <button onClick={fecharDrawer} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl mx-auto border-4 border-white shadow-md">
                  {drawerPaciente.nome.charAt(0)}
                </div>
                <h2 className="text-lg font-bold text-slate-800 mt-3">{drawerPaciente.nome}</h2>
                <p className="text-sm font-medium text-slate-500">{drawerPaciente.cpf}</p>
                <div className="mt-2 inline-flex gap-1.5 items-center bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold uppercase">
                  <CheckCircle2 size={12}/> Cadastro Validado
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Endereço de Entrega</label>
                  <p className="text-sm font-medium text-slate-700 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{drawerPaciente.endereco}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <Clock className="mx-auto text-slate-400 mb-1" size={16} />
                    <p className="text-[10px] uppercase font-bold text-slate-400">Janela</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{drawerPaciente.janela_entrega.split('(')[0]}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                    <PackageOpen className="mx-auto text-blue-500 mb-1" size={16} />
                    <p className="text-[10px] uppercase font-bold text-blue-600/70">Entregas no Mês</p>
                    <p className="text-xs font-bold text-blue-700 mt-0.5">{drawerPaciente.entregas_recentes} Concluídas</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => router.push(`/dashboard/pacientes/${drawerPaciente.id}`)}
                className="w-full flex justify-center items-center gap-2 py-3 bg-[#1A2B6D] hover:bg-[#121f4f] text-white rounded-xl shadow-sm font-semibold transition-all"
              >
                Ver Perfil Completo <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO PACIENTE */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNewModalOpen(false)}/>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 animate-in zoom-in-95">
             <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Cadastrar Novo Paciente</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={salvarNovoPaciente}>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">CPF</label>
                <input type="text" placeholder="000.000.000-00" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required/>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Nome Completo</label>
                <input type="text" placeholder="Nome do paciente" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required/>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Endereço Completo</label>
                <input type="text" placeholder="Rua, Número, Bairro" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required/>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Janela de Entrega Preferencial</label>
                <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option>Manhã (08h - 12h)</option>
                  <option>Tarde (13h - 18h)</option>
                  <option>Integral (08h - 18h)</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Concluir Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Icon fallbacks because of large file scope merging
function CheckCircle2(props:any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>; }
