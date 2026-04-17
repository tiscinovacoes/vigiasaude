'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  X,
  Loader2,
  RefreshCw,
  FileText,
  Upload,
  ExternalLink,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Download,
  Pencil,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { api, type Medico } from '@/lib/api';
import { toast } from 'sonner';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function formatCRMInput(raw: string): string {
  // Remove tudo que não é letra/número/barra e mantém somente "CRM/UF NÚMERO"
  return raw.toUpperCase().replace(/[^A-Z0-9/ ]/g, '').slice(0, 20);
}

/* ── Modal de Cadastro / Edição ─────────────────────────────────────────── */

interface MedicoFormProps {
  medico?: Medico | null;
  onClose: () => void;
  onSaved: () => void;
}

function MedicoModal({ medico, onClose, onSaved }: MedicoFormProps) {
  const isEdit = !!medico;
  const fileRef = useRef<HTMLInputElement>(null);

  const [crm, setCrm]               = useState(medico?.crm ?? '');
  const [nome, setNome]             = useState(medico?.nome ?? '');
  const [especialidade, setEspec]   = useState(medico?.especialidade ?? '');
  const [email, setEmail]           = useState(medico?.email ?? '');
  const [telefone, setTel]          = useState(medico?.telefone ?? '');
  const [arquivo, setArquivo]       = useState<File | null>(null);
  const [preview, setPreview]       = useState<string>(medico?.documento_url ?? '');
  const [saving, setSaving]         = useState(false);
  const [erro, setErro]             = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErro('Formato não suportado. Use PDF, JPG ou PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErro('Arquivo muito grande. Máximo 5 MB.');
      return;
    }
    setErro(null);
    setArquivo(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!crm.trim())  { setErro('CRM é obrigatório.'); return; }
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return; }

    setSaving(true);
    setErro(null);

    const res = isEdit
      ? await api.updateMedico(medico!.id, { crm, nome, especialidade, email, telefone, arquivo })
      : await api.createMedico({ crm, nome, especialidade, email, telefone, arquivo });

    setSaving(false);
    if (res.ok) {
      toast.success(isEdit ? 'Médico atualizado com sucesso!' : 'Médico cadastrado com sucesso!');
      onSaved();
      onClose();
    } else {
      setErro(res.error ?? 'Erro ao salvar.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Stethoscope size={18} className="text-[#1A2B6D]" />
            <h2 className="text-base font-black text-slate-900">
              {isEdit ? 'Editar Médico' : 'Novo Médico'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* CRM */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              CRM *
            </label>
            <input
              type="text"
              value={crm}
              onChange={e => setCrm(formatCRMInput(e.target.value))}
              placeholder="CRM/SP 123456"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Nome completo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Dr. João da Silva"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          {/* Especialidade */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Especialidade
            </label>
            <input
              type="text"
              value={especialidade}
              onChange={e => setEspec(e.target.value)}
              placeholder="Clínica Geral, Cardiologia..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          {/* Email + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dr@clinica.com"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Telefone
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={e => setTel(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Upload de Documento */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Documento (CRM, diploma, etc.)
            </label>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
            >
              {arquivo || preview ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={20} className="text-blue-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[260px]">
                    {arquivo?.name ?? medico?.documento_nome ?? 'Documento vinculado'}
                  </span>
                  {preview && (
                    <a
                      href={preview}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
                  <Upload size={22} />
                  <p className="text-sm font-bold">Clique ou arraste um arquivo</p>
                  <p className="text-[10px]">PDF, JPG, PNG — máx. 5 MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0])}
            />

            {(arquivo || preview) && (
              <button
                type="button"
                onClick={() => { setArquivo(null); setPreview(''); }}
                className="mt-1.5 text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                × Remover documento
              </button>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">
              <X size={14} className="shrink-0" /> {erro}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[#1A2B6D] hover:bg-[#121f4f] disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar médico'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Página Principal ────────────────────────────────────────────────────── */

export default function MedicosPage() {
  const [medicos, setMedicos]           = useState<Medico[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Medico | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  useEffect(() => { loadMedicos(); }, []);

  async function loadMedicos() {
    setLoading(true);
    try {
      const data = await api.getMedicos();
      setMedicos(data);
    } catch {
      toast.error('Erro ao carregar médicos.');
    } finally {
      setLoading(false);
    }
  }

  function openNew()              { setEditTarget(null); setModalOpen(true); }
  function openEdit(m: Medico)    { setEditTarget(m);   setModalOpen(true); }
  function closeModal()           { setModalOpen(false); setEditTarget(null); }

  async function toggleAtivo(m: Medico) {
    const res = await api.updateMedico(m.id, { ativo: !m.ativo });
    if (res.ok) {
      setMedicos(prev => prev.map(x => x.id === m.id ? { ...x, ativo: !x.ativo } : x));
      toast.success(m.ativo ? 'Médico desativado.' : 'Médico reativado.');
    } else {
      toast.error(res.error ?? 'Erro ao alterar status.');
    }
  }

  async function handleDelete(m: Medico) {
    if (!confirm(`Excluir o médico "${m.nome}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(m.id);
    const res = await api.deleteMedico(m.id);
    setDeletingId(null);
    if (res.ok) {
      setMedicos(prev => prev.filter(x => x.id !== m.id));
      toast.success('Médico excluído.');
    } else {
      toast.error(res.error ?? 'Erro ao excluir.');
    }
  }

  const filtered = medicos.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    m.crm.toLowerCase().includes(search.toLowerCase()) ||
    (m.especialidade ?? '').toLowerCase().includes(search.toLowerCase())
  );

  /* KPIs */
  const totalAtivos     = medicos.filter(m => m.ativo).length;
  const totalInativos   = medicos.length - totalAtivos;
  const comDocumento    = medicos.filter(m => m.documento_url).length;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cadastro de Médicos</h1>
          <p className="text-slate-500 font-medium">Gerencie os médicos vinculados às receitas e prescrições.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 bg-white"
            onClick={loadMedicos}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4 text-slate-500', loading && 'animate-spin')} />
            Atualizar
          </Button>
          <Button
            className="bg-[#1A2B6D] hover:bg-[#121f4f] rounded-xl shadow-lg"
            onClick={openNew}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Médico
          </Button>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total cadastrados */}
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Stethoscope size={24} />
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold">TOTAL</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{medicos.length}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Médicos Cadastrados</p>
          </CardContent>
        </Card>

        {/* Ativos */}
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <UserCheck size={24} />
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold">ATIVOS</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{totalAtivos}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
              {totalInativos > 0 ? `${totalInativos} inativo(s)` : 'Todos ativos'}
            </p>
          </CardContent>
        </Card>

        {/* Com documento */}
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <Badge variant="secondary" className="bg-violet-50 text-violet-600 border-none font-bold">DOCS</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{comDocumento}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Com Documento Vinculado</p>
          </CardContent>
        </Card>
      </div>

      {/* ── BUSCA ──────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por nome, CRM ou especialidade..."
            className="pl-11 h-12 bg-slate-50 border-none rounded-xl text-slate-700 font-medium placeholder:text-slate-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── LISTA ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Carregando médicos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
          <Stethoscope size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-600">Nenhum médico encontrado</p>
          <p className="text-sm text-slate-400 mt-1">
            {search ? 'Tente outra busca.' : 'Cadastre o primeiro médico clicando no botão acima.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(m => (
            <Card
              key={m.id}
              className={cn(
                'border-none shadow-sm rounded-3xl bg-white group hover:shadow-md transition-all duration-300',
                !m.ativo && 'opacity-60'
              )}
            >
              <CardContent className="p-0">
                <div className="p-6">
                  {/* Top row */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                        m.ativo ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                      )}>
                        <Stethoscope size={26} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-800 group-hover:text-[#1A2B6D] transition-colors leading-tight">
                          {m.nome}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 font-mono tracking-wide mt-0.5">{m.crm}</p>
                        {m.especialidade && (
                          <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 uppercase tracking-wider">
                            {m.especialidade}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'text-[10px] font-black uppercase border-none',
                        m.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {m.ativo ? '● Ativo' : '○ Inativo'}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    {m.email && (
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                        <Mail size={13} className="shrink-0" />
                        <span className="truncate">{m.email}</span>
                      </div>
                    )}
                    {m.telefone && (
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                        <Phone size={13} className="shrink-0" />
                        <span>{m.telefone}</span>
                      </div>
                    )}
                    {m.documento_url && (
                      <div className="flex items-center gap-2 text-violet-600 text-xs font-bold">
                        <FileText size={13} className="shrink-0" />
                        <a
                          href={m.documento_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {m.documento_nome ?? 'Ver documento'}
                          <Download size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Desde {new Date(m.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(m)}
                      title="Editar"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleAtivo(m)}
                      title={m.ativo ? 'Desativar' : 'Reativar'}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        m.ativo
                          ? 'text-orange-400 hover:bg-orange-50 hover:text-orange-600'
                          : 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
                      )}
                    >
                      {m.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      disabled={deletingId === m.id}
                      title="Excluir"
                      className="p-1.5 rounded-lg text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      {deletingId === m.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── MODAL ──────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <MedicoModal
          medico={editTarget}
          onClose={closeModal}
          onSaved={loadMedicos}
        />
      )}
    </div>
  );
}
