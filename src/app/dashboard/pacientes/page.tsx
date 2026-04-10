'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Paciente } from '@/lib/api';
import { auditoriaAPI } from '@/lib/api';
import { Users, Search, Plus, X, ArrowRight, UserCircle2, Clock, MapPin, PackageOpen, Phone, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ListaPacientes() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modals / Drawer State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [drawerPaciente, setDrawerPaciente] = useState<Paciente | null>(null);

  // Form State
  const [formCpf, setFormCpf] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formJanela, setFormJanela] = useState('Manhã (08h - 12h)');
  const [formTelefone, setFormTelefone] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  const loadPacientes = async () => {
    setLoading(true);
    try {
      const data = await api.getPacientes();
      setPacientes(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar pacientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, []);

  const resetForm = () => {
    setFormCpf('');
    setFormNome('');
    setFormEndereco('');
    setFormJanela('Manhã (08h - 12h)');
    setFormTelefone('');
  };

  const fecharDrawer = () => setDrawerPaciente(null);

  const pacientesFiltrados = pacientes.filter(p => 
    p.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
    p.cpf.includes(busca)
  );

  const salvarNovoPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await api.createPaciente({
      cpf: formCpf,
      nome_completo: formNome,
      endereco_completo: formEndereco,
      janela_entrega: formJanela,
      telefone: formTelefone || undefined,
    });

    if (result.success && result.data) {
      toast.success(`Paciente "${formNome}" cadastrado com sucesso!`);
      
      // Log de auditoria
      await auditoriaAPI.log('CREATE', 'pacientes', {
        paciente_id: result.data.id,
        nome: formNome,
        cpf: formCpf,
      });

      setPacientes(prev => [...prev, result.data!]);
      setIsNewModalOpen(false);
      resetForm();
    } else {
      toast.error(`Erro ao cadastrar: ${result.error}`);
    }

    setSaving(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-full space-y-6 relative overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cuidado ao Paciente</h1>
          <p className="text-sm text-slate-500 mt-1">Gestão de cadastros e visão centralizada de entregas domiciliárias</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadPacientes}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A2B6D] hover:bg-[#121f4f] text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Novo Paciente
          </button>
        </div>
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

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-blue-500 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Carregando pacientes do banco de dados...</p>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-600">Nenhum paciente encontrado</p>
            <p className="text-sm text-slate-400 mt-1">
              {busca ? 'Tente uma busca diferente.' : 'Cadastre o primeiro paciente clicando no botão acima.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-semibold text-slate-700">Paciente</th>
                  <th className="px-5 py-3 font-semibold text-slate-700">CPF</th>
                  <th className="px-5 py-3 font-semibold text-slate-700">Janela de Entrega</th>
                  <th className="px-5 py-3 font-semibold text-slate-700">Telefone</th>
                  <th className="px-5 py-3 font-semibold text-slate-700">Cadastro</th>
                  <th className="px-5 py-3 font-semibold text-slate-700 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {paciente.nome_completo.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{paciente.nome_completo}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {paciente.endereco_completo?.substring(0, 30)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-600 font-mono text-xs">{paciente.cpf}</td>
                    <td className="px-5 py-4">
                      {paciente.janela_entrega ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded inline-flex">
                          <Clock size={12} className="text-slate-400" /> {paciente.janela_entrega}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Não definida</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {paciente.telefone ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone size={12} className="text-slate-400" /> {paciente.telefone}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(paciente.created_at)}
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
        )}
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
                  {drawerPaciente.nome_completo.charAt(0)}
                </div>
                <h2 className="text-lg font-bold text-slate-800 mt-3">{drawerPaciente.nome_completo}</h2>
                <p className="text-sm font-medium text-slate-500">{drawerPaciente.cpf}</p>
                <div className="mt-2 inline-flex gap-1.5 items-center bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold uppercase">
                  <CheckCircle2Icon size={12}/> Cadastro Validado
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Endereço de Entrega</label>
                  <p className="text-sm font-medium text-slate-700 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{drawerPaciente.endereco_completo}</p>
                </div>
                {drawerPaciente.telefone && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Telefone</label>
                    <p className="text-sm font-medium text-slate-700 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" /> {drawerPaciente.telefone}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <Clock className="mx-auto text-slate-400 mb-1" size={16} />
                    <p className="text-[10px] uppercase font-bold text-slate-400">Janela</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{drawerPaciente.janela_entrega || 'Não definida'}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                    <PackageOpen className="mx-auto text-blue-500 mb-1" size={16} />
                    <p className="text-[10px] uppercase font-bold text-blue-600/70">Desde</p>
                    <p className="text-xs font-bold text-blue-700 mt-0.5">{formatDate(drawerPaciente.created_at)}</p>
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
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">CPF *</label>
                <input 
                  type="text" 
                  placeholder="000.000.000-00" 
                  value={formCpf}
                  onChange={(e) => setFormCpf(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Nome Completo *</label>
                <input 
                  type="text" 
                  placeholder="Nome do paciente" 
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Endereço Completo *</label>
                <input 
                  type="text" 
                  placeholder="Rua, Número, Bairro" 
                  value={formEndereco}
                  onChange={(e) => setFormEndereco(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Telefone</label>
                <input 
                  type="text" 
                  placeholder="(67) 99999-0000" 
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Janela de Entrega Preferencial</label>
                <select 
                  value={formJanela}
                  onChange={(e) => setFormJanela(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                  required
                >
                  <option>Manhã (08h - 12h)</option>
                  <option>Tarde (13h - 18h)</option>
                  <option>Integral (08h - 18h)</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => { setIsNewModalOpen(false); resetForm(); }} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Salvando...' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function CheckCircle2Icon(props: any) { 
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>; 
}
