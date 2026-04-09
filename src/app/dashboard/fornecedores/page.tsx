'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  FileCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Plus,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { api, type Fornecedor } from '@/lib/api';
import { auditoriaAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function FornecedoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formCnpj, setFormCnpj] = useState('');
  const [formRazaoSocial, setFormRazaoSocial] = useState('');
  const [formLeadTime, setFormLeadTime] = useState('');

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    setLoading(true);
    try {
      const data = await api.getFornecedores();
      setFornecedores(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const filteredFornecedores = fornecedores.filter(f =>
    f.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj.includes(searchTerm)
  );

  // Computed KPIs
  const totalHomologados = fornecedores.length;
  const avgScore = fornecedores.length > 0 
    ? Math.round(fornecedores.reduce((s, f) => s + f.pontualidade_percentual, 0) / fornecedores.length) 
    : 0;
  const emObservacao = fornecedores.filter(f => f.pontualidade_percentual < 80).length;

  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Ativo' };
    if (score >= 70) return { text: 'text-blue-500', bg: 'bg-blue-50', label: 'Regular' };
    return { text: 'text-orange-500', bg: 'bg-orange-50', label: 'Sob Observação' };
  };

  const resetForm = () => {
    setFormCnpj('');
    setFormRazaoSocial('');
    setFormLeadTime('');
  };

  const salvarNovoFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await api.createFornecedor({
      cnpj: formCnpj,
      razao_social: formRazaoSocial,
      lead_time_medio: formLeadTime ? parseInt(formLeadTime) : undefined,
    });

    if (result.success && result.data) {
      toast.success(`Fornecedor "${formRazaoSocial}" cadastrado!`);
      
      await auditoriaAPI.log('CREATE', 'fornecedores', {
        fornecedor_id: result.data.id,
        razao_social: formRazaoSocial,
        cnpj: formCnpj,
      });

      setFornecedores(prev => [...prev, result.data!]);
      setIsNewModalOpen(false);
      resetForm();
    } else {
      toast.error(`Erro: ${result.error}`);
    }

    setSaving(false);
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Fornecedores</h1>
          <p className="text-slate-500 font-medium">Monitoramento tático, auditoria de documentos e score de performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 bg-white" onClick={loadFornecedores}>
            <RefreshCw className={cn("mr-2 h-4 w-4 text-slate-500", loading && "animate-spin")} /> Atualizar
          </Button>
          <Button className="bg-[#1A2B6D] hover:bg-[#121f4f] rounded-xl shadow-lg" onClick={() => setIsNewModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* KPI TOP ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold">TOTAL</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{totalHomologados}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Homologados</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold">SCORE</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{avgScore}%</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Pontualidade Média</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                <Star size={24} />
              </div>
              <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold">MÉDIA</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">
              {fornecedores.length > 0 
                ? Math.round(fornecedores.reduce((s, f) => s + f.lead_time_medio, 0) / fornecedores.length)
                : 0
              }d
            </h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Time Médio</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <Badge variant={emObservacao > 0 ? "destructive" : "secondary"} className="bg-red-50 text-red-600 border-none font-bold">
                {emObservacao > 0 ? 'CRÍTICO' : 'OK'}
              </Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{String(emObservacao).padStart(2, '0')}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Em Observação</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Buscar por nome ou CNPJ..." 
            className="pl-11 h-12 bg-slate-50 border-none rounded-xl text-slate-700 font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* SUPPLIERS LIST */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Carregando fornecedores do banco de dados...</p>
        </div>
      ) : filteredFornecedores.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
          <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-600">Nenhum fornecedor encontrado</p>
          <p className="text-sm text-slate-400 mt-1">
            {searchTerm ? 'Tente uma busca diferente.' : 'Cadastre o primeiro fornecedor clicando no botão acima.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFornecedores.map((fornecedor) => {
            const scoreStyle = getScoreColor(fornecedor.pontualidade_percentual);
            
            return (
              <Card key={fornecedor.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-md transition-all duration-300">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", scoreStyle.bg)}>
                          <Building2 className={scoreStyle.text} size={28} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-lg text-slate-800 group-hover:text-[#1A2B6D] transition-colors">{fornecedor.razao_social}</h3>
                            {fornecedor.pontualidade_percentual > 90 && <CheckCircle2 size={16} className="text-emerald-500" />}
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">{fornecedor.cnpj}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 mb-1">
                          <Star size={14} className="text-amber-400 fill-amber-400" />
                          <span className="text-lg font-black text-slate-800">{fornecedor.pontualidade_percentual}</span>
                          <span className="text-xs font-bold text-slate-400">%</span>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-black uppercase border-none",
                          fornecedor.pontualidade_percentual >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                        )}>
                          {scoreStyle.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock size={16} className="shrink-0" />
                          <span className="text-xs font-bold">Lead Time: {fornecedor.lead_time_medio} dias</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <TrendingUp size={16} className="shrink-0" />
                          <span className="text-xs font-bold">
                            Contratado: R$ {fornecedor.valor_total_contratado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-medium">
                      Desde {new Date(fornecedor.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <Button variant="ghost" className="text-xs font-black text-[#1A2B6D] hover:bg-slate-100 rounded-lg">
                      VER PERFIL COMPLETO <ExternalLink size={14} className="ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest pt-4">
        <TrendingUp size={14} />
        O Score é calculado com base na Pontualidade de Entrega registrada no Supabase.
      </div>

      {/* MODAL NOVO FORNECEDOR */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNewModalOpen(false)}/>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Cadastrar Novo Fornecedor</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={salvarNovoFornecedor}>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">CNPJ *</label>
                <input 
                  type="text" 
                  placeholder="00.000.000/0000-00" 
                  value={formCnpj}
                  onChange={(e) => setFormCnpj(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Razão Social *</label>
                <input 
                  type="text" 
                  placeholder="Nome da empresa" 
                  value={formRazaoSocial}
                  onChange={(e) => setFormRazaoSocial(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Lead Time Médio (dias)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 7" 
                  value={formLeadTime}
                  onChange={(e) => setFormLeadTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
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
