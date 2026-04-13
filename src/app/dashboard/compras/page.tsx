'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, type Fornecedor, type CompraRegistro, type Medicamento } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, AlertTriangle, Loader2, X, ShieldCheck, ShieldAlert,
  ShieldX, CheckCircle2, Info
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  ENTREGUE: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  EM_TRANSITO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  EMPENHADO: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  SOLICITADO: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  SUGERIDO: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  DESCARTADO: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

type ValidacaoPreco = {
  cmed: { valido: boolean; teto: number; percentual: number };
  bps: { valido: boolean | null; referencia: number | null; percentual: number | null };
  status: 'OK' | 'ALERTA_BPS' | 'BLOQUEIO_CMED';
} | null;

function PainelConformidade({ validacao, valorUnitario }: {
  validacao: ValidacaoPreco;
  valorUnitario: number;
}) {
  if (!validacao || valorUnitario <= 0) return null;

  return (
    <div className="space-y-2 mt-1">
      {/* CMED */}
      <div className={cn(
        'flex items-start gap-3 rounded-xl p-3 border',
        validacao.cmed.valido
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-300'
      )}>
        {validacao.cmed.valido
          ? <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={16} />
          : <ShieldX className="text-red-600 shrink-0 mt-0.5 animate-pulse" size={16} />
        }
        <div className="flex-1">
          <p className={cn('text-[10px] font-black uppercase tracking-widest', validacao.cmed.valido ? 'text-emerald-700' : 'text-red-700')}>
            CMED / ANVISA
          </p>
          {validacao.cmed.valido ? (
            <p className="text-xs font-medium text-emerald-700">
              Dentro do teto — R$ {validacao.cmed.teto.toFixed(2)}
            </p>
          ) : (
            <p className="text-xs font-bold text-red-700">
              Excede o teto em +{validacao.cmed.percentual.toFixed(1)}%
              {' '}(teto: R$ {validacao.cmed.teto.toFixed(2)})
            </p>
          )}
        </div>
        <span className={cn(
          'text-[9px] font-black uppercase px-2 py-1 rounded-lg',
          validacao.cmed.valido ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        )}>
          {validacao.cmed.valido ? 'OK' : 'BLOQUEADO'}
        </span>
      </div>

      {/* BPS */}
      <div className={cn(
        'flex items-start gap-3 rounded-xl p-3 border',
        validacao.bps.valido === null
          ? 'bg-slate-50 border-slate-200'
          : validacao.bps.valido
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      )}>
        {validacao.bps.valido === null
          ? <Info className="text-slate-400 shrink-0 mt-0.5" size={16} />
          : validacao.bps.valido
          ? <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={16} />
          : <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
        }
        <div className="flex-1">
          <p className={cn(
            'text-[10px] font-black uppercase tracking-widest',
            validacao.bps.valido === null ? 'text-slate-500' : validacao.bps.valido ? 'text-emerald-700' : 'text-amber-700'
          )}>
            BPS / Ministério da Saúde
          </p>
          {validacao.bps.valido === null ? (
            <p className="text-xs text-slate-500">
              Sem referência BPS cadastrada — acesse Banco de Preços BPS para configurar
            </p>
          ) : validacao.bps.valido ? (
            <p className="text-xs font-medium text-emerald-700">
              Abaixo da referência — R$ {validacao.bps.referencia!.toFixed(2)}
            </p>
          ) : (
            <p className="text-xs font-bold text-amber-700">
              +{validacao.bps.percentual!.toFixed(1)}% acima da referência BPS
              {' '}(ref: R$ {validacao.bps.referencia!.toFixed(2)})
            </p>
          )}
        </div>
        <span className={cn(
          'text-[9px] font-black uppercase px-2 py-1 rounded-lg',
          validacao.bps.valido === null
            ? 'bg-slate-100 text-slate-500'
            : validacao.bps.valido
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        )}>
          {validacao.bps.valido === null ? 'SEM REF.' : validacao.bps.valido ? 'OK' : 'ALERTA'}
        </span>
      </div>
    </div>
  );
}

export default function ComprasPage() {
  const [compras, setCompras] = useState<CompraRegistro[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validando, setValidando] = useState(false);
  const [validacao, setValidacao] = useState<ValidacaoPreco>(null);

  const [form, setForm] = useState({
    medicamento_id: '',
    fornecedor_id: '',
    quantidade: '',
    valor_unitario: '',
    data_entrega_prevista: '',
    justificativa_cmed: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [comprasData, fornsData, medsData] = await Promise.all([
        api.getComprasAtivas(),
        api.getFornecedores(),
        api.getEstoqueBase(),
      ]);
      setCompras(comprasData);
      setFornecedores(fornsData);
      setMedicamentos(medsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Alerta CMED automático nas compras existentes
  useEffect(() => {
    if (!loading && compras.length > 0) {
      const acimaCmed = compras.filter((c) => {
        const precoCmed = c.medicamento?.preco_teto_cmed;
        return precoCmed && (c.valor_unitario || 0) > precoCmed;
      });
      acimaCmed.forEach((c, i) => {
        setTimeout(() => {
          const val = c.valor_unitario || 0;
          const teto = c.medicamento?.preco_teto_cmed || 1;
          const diff = (((val - teto) / teto) * 100).toFixed(0);
          toast.warning(`Preço acima da CMED: ${c.medicamento?.nome || 'Medicamento'}`, {
            description: `R$ ${val.toFixed(2)} | Teto CMED: R$ ${teto.toFixed(2)} (+${diff}%)`,
            duration: 6000,
          });
        }, i * 1500);
      });
    }
  }, [compras, loading]);

  // Validação em tempo real ao alterar medicamento ou preço
  const validarPreco = useCallback(async (medId: string, valor: string) => {
    const v = parseFloat(valor.replace(',', '.'));
    if (!medId || !v || v <= 0) { setValidacao(null); return; }
    setValidando(true);
    try {
      const resultado = await api.validarPrecoCompleto(medId, v);
      setValidacao(resultado);
    } finally {
      setValidando(false);
    }
  }, []);

  const handleFormChange = (field: string, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);

    if (field === 'medicamento_id' || field === 'valor_unitario') {
      const medId = field === 'medicamento_id' ? value : next.medicamento_id;
      const val = field === 'valor_unitario' ? value : next.valor_unitario;
      validarPreco(medId, val);
    }
  };

  const handleSubmit = async () => {
    if (!form.medicamento_id || !form.fornecedor_id || !form.quantidade || !form.valor_unitario) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (validacao?.status === 'BLOQUEIO_CMED' && !form.justificativa_cmed.trim()) {
      toast.error('Forneça uma justificativa para prosseguir com preço acima do teto CMED');
      return;
    }
    setSubmitting(true);
    const res = await api.createCompra({
      medicamento_id: form.medicamento_id,
      fornecedor_id: form.fornecedor_id,
      quantidade: Number(form.quantidade),
      valor_unitario: parseFloat(form.valor_unitario.replace(',', '.')),
      data_entrega_prevista: form.data_entrega_prevista || undefined,
      justificativa_cmed: form.justificativa_cmed || undefined,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success('Compra registrada com sucesso!');
      setShowModal(false);
      setForm({ medicamento_id: '', fornecedor_id: '', quantidade: '', valor_unitario: '', data_entrega_prevista: '', justificativa_cmed: '' });
      setValidacao(null);
      fetchData();
    } else {
      toast.error(res.error || 'Erro ao registrar compra');
    }
  };

  const leadTimeData = fornecedores.map(f => ({
    fornecedor: f.razao_social.length > 18 ? f.razao_social.substring(0, 18) + '...' : f.razao_social,
    contratual: Math.max((f.lead_time_medio || 7) - 2, 3),
    real: f.lead_time_medio || 7,
  })).slice(0, 5);

  const calculateLeadTime = (solicitacao: string | null, entrega: string | null) => {
    if (!solicitacao || !entrega) return null;
    return differenceInDays(new Date(entrega), new Date(solicitacao));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A] mb-4" />
        <p className="text-[#64748B] font-medium">Carregando compras do Supabase...</p>
      </div>
    );
  }

  const valorFloat = parseFloat(form.valor_unitario.replace(',', '.')) || 0;
  const bloqueadoCmed = validacao?.status === 'BLOQUEIO_CMED' && !form.justificativa_cmed.trim();

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-full pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1E293B]">Controle de Compras</h1>
          <p className="text-[#64748B] mt-1 font-medium">Gestão de aquisições e licitações vigentes</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white cursor-pointer gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Compra
        </Button>
      </div>

      {/* Table */}
      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Medicamento</th>
                  <th className="text-left py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Fornecedor</th>
                  <th className="text-left py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Solicitação</th>
                  <th className="text-left py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Entrega Prev.</th>
                  <th className="text-right py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Lead Time</th>
                  <th className="text-right py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Valor Unit.</th>
                  <th className="text-right py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Teto CMED</th>
                  <th className="text-center py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compras.map((c) => {
                  const valorUnitario = c.valor_unitario || 0;
                  const precoCmed = c.medicamento?.preco_teto_cmed || null;
                  const acimaCmed = precoCmed && valorUnitario > precoCmed;
                  const cfg = statusConfig[c.status] || statusConfig.SOLICITADO;
                  const leadTime = calculateLeadTime(c.data_solicitacao, c.data_entrega_prevista);

                  return (
                    <tr
                      key={c.id}
                      className={cn('hover:bg-[#F8FAFC] transition-colors', acimaCmed ? 'bg-red-50/50' : '')}
                    >
                      <td className="py-4 px-6 text-[#1E293B] font-bold">
                        <div className="flex items-center gap-2">
                          {c.medicamento?.nome || 'Desconhecido'}
                          {acimaCmed && (
                            <span title="Preço acima do teto CMED">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#64748B] text-sm">{c.fornecedor?.razao_social || '-'}</td>
                      <td className="py-4 px-6 text-[#64748B] text-sm">
                        {c.data_solicitacao ? new Date(c.data_solicitacao).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-4 px-6 text-[#64748B] text-sm">
                        {c.data_entrega_prevista ? new Date(c.data_entrega_prevista).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-4 px-6 text-right text-[#1E293B] font-bold text-sm">
                        {leadTime !== null ? `${leadTime}d` : '-'}
                      </td>
                      <td className={cn('py-4 px-6 text-right font-black', acimaCmed ? 'text-red-600' : 'text-[#1E293B]')}>
                        R$ {valorUnitario.toFixed(2)}
                        {acimaCmed && (
                          <span className="ml-1 text-[9px] font-black bg-red-100 text-red-700 px-1 py-0.5 rounded">
                            +{(((valorUnitario - precoCmed!) / precoCmed!) * 100).toFixed(0)}%
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right text-[#64748B] text-sm">
                        {precoCmed ? `R$ ${precoCmed.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge className={`${cfg.bg} ${cfg.text} ${cfg.border} border hover:bg-transparent shadow-none px-2.5 py-0.5 font-bold`}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {compras.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#64748B]">
                      Nenhuma compra registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lead Time por Fornecedor */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-[#1E293B] flex items-center gap-2 font-black tracking-tight">
            Tempo Médio de Reposição por Fornecedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full min-h-[288px]">
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={leadTimeData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} unit=" dias" />
                <YAxis dataKey="fornecedor" type="category" tick={{ fill: '#64748B', fontSize: 12, fontWeight: 'bold' }} width={120} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8 }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="contratual" name="Prazo Contratual" fill="#94A3B8" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="real" name="Prazo Real Médio" fill="#1E3A8A" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ===== MODAL NOVA COMPRA ===== */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4"
          onClick={() => { setShowModal(false); setValidacao(null); }}
        >
          <Card className="w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Plus className="text-[#1E3A8A]" size={20} />
                  NOVA SOLICITAÇÃO DE COMPRA
                </CardTitle>
                <button
                  onClick={() => { setShowModal(false); setValidacao(null); }}
                  className="text-slate-300 hover:text-slate-600 transition-colors"
                >
                  <X size={22} />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Medicamento */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">
                  Medicamento *
                </label>
                <Select onValueChange={v => handleFormChange('medicamento_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o medicamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {medicamentos.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}{m.dosagem ? ` — ${m.dosagem}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fornecedor */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">
                  Fornecedor *
                </label>
                <Select onValueChange={v => handleFormChange('fornecedor_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        Nenhum fornecedor cadastrado
                      </SelectItem>
                    ) : (
                      fornecedores.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.razao_social}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantidade */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">
                    Quantidade (un) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={form.quantidade}
                    onChange={e => handleFormChange('quantidade', e.target.value)}
                  />
                </div>

                {/* Valor unitário */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block flex items-center gap-1">
                    Valor Unit. (R$) *
                    {validando && <Loader2 size={10} className="animate-spin" />}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={form.valor_unitario}
                    onChange={e => handleFormChange('valor_unitario', e.target.value)}
                    className={cn(
                      validacao?.status === 'BLOQUEIO_CMED' && 'border-red-400 focus-visible:ring-red-400',
                      validacao?.status === 'ALERTA_BPS' && 'border-amber-400 focus-visible:ring-amber-400',
                      validacao?.status === 'OK' && 'border-emerald-400 focus-visible:ring-emerald-400',
                    )}
                  />
                </div>
              </div>

              {/* Painel de conformidade em tempo real */}
              <PainelConformidade validacao={validacao} valorUnitario={valorFloat} />

              {/* Justificativa se CMED bloqueado */}
              {validacao?.status === 'BLOQUEIO_CMED' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black text-red-600 uppercase mb-1.5 block">
                    Justificativa (obrigatória para prosseguir) *
                  </label>
                  <textarea
                    rows={2}
                    className="w-full text-sm rounded-xl border border-red-300 bg-red-50 p-3 outline-none focus:ring-2 focus:ring-red-400 resize-none placeholder:text-red-300"
                    placeholder="Ex: Único fornecedor disponível na licitação emergencial..."
                    value={form.justificativa_cmed}
                    onChange={e => setForm(f => ({ ...f, justificativa_cmed: e.target.value }))}
                  />
                </div>
              )}

              {/* Data prevista */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">
                  Data Prevista de Entrega
                </label>
                <Input
                  type="date"
                  value={form.data_entrega_prevista}
                  onChange={e => handleFormChange('data_entrega_prevista', e.target.value)}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || bloqueadoCmed || !form.medicamento_id || !form.fornecedor_id}
                className={cn(
                  'w-full h-12 rounded-xl font-black text-white mt-2',
                  validacao?.status === 'BLOQUEIO_CMED' && !form.justificativa_cmed
                    ? 'bg-slate-300 cursor-not-allowed'
                    : validacao?.status === 'ALERTA_BPS'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90'
                )}
              >
                {submitting ? (
                  <Loader2 className="animate-spin mx-auto" size={18} />
                ) : validacao?.status === 'BLOQUEIO_CMED' && !form.justificativa_cmed ? (
                  'Justifique o preço para continuar'
                ) : validacao?.status === 'ALERTA_BPS' ? (
                  'Registrar Compra (acima do BPS)'
                ) : (
                  'Registrar Compra'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
