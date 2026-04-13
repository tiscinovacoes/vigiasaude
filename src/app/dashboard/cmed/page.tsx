'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit2,
  Check,
  X,
  Search,
  RefreshCw,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { api, type Medicamento } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type MedicamentoCmed = Medicamento & {
  ultimoPreco?: number | null;
  qtdLotesAtivos?: number;
};

export default function CmedPage() {
  const [medicamentos, setMedicamentos] = useState<MedicamentoCmed[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'conforme' | 'excedido'>('todos');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novoTeto, setNovoTeto] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    try {
      // Consulta direta na tabela medicamentos (sem view de lotes)
      const { data: meds, error: medsError } = await supabase
        .from('medicamentos')
        .select('id, nome, dosagem, estoque_minimo, preco_teto_cmed, created_at')
        .order('nome');
      if (medsError || !meds) throw medsError;

      // Busca último preço pago por medicamento via compras (ignora erro se tabela vazia)
      const ultimoPrecoMap: Record<string, number> = {};
      try {
        const { data: compras } = await supabase
          .from('compras')
          .select('medicamento_id, valor_unitario')
          .not('valor_unitario', 'is', null)
          .order('data_solicitacao', { ascending: false });
        compras?.forEach((c) => {
          if (!ultimoPrecoMap[c.medicamento_id] && c.valor_unitario) {
            ultimoPrecoMap[c.medicamento_id] = c.valor_unitario;
          }
        });
      } catch { /* tabela vazia — ignora */ }

      const enriched: MedicamentoCmed[] = meds.map((m: any) => ({
        ...m,
        ultimoPreco: ultimoPrecoMap[m.id] ?? null,
        qtdLotesAtivos: 0,
      }));

      setMedicamentos(enriched);
    } catch (err) {
      toast.error('Erro ao carregar dados CMED');
    } finally {
      setLoading(false);
    }
  }

  async function salvarTeto(med: MedicamentoCmed) {
    const valor = parseFloat(novoTeto.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      toast.error('Informe um valor válido maior que zero');
      return;
    }
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('medicamentos')
        .update({ preco_teto_cmed: valor })
        .eq('id', med.id);
      if (error) throw error;
      toast.success(`Teto CMED atualizado: R$ ${valor.toFixed(2)}`);
      setEditandoId(null);
      carregar();
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  const filtrados = medicamentos
    .filter((m) => {
      if (busca) {
        const q = busca.toLowerCase();
        return m.nome.toLowerCase().includes(q);
      }
      return true;
    })
    .filter((m) => {
      if (filtro === 'conforme') return !m.ultimoPreco || m.ultimoPreco <= m.preco_teto_cmed;
      if (filtro === 'excedido') return m.ultimoPreco && m.ultimoPreco > m.preco_teto_cmed;
      return true;
    });

  const totalExcedidos = medicamentos.filter(
    (m) => m.ultimoPreco && m.ultimoPreco > m.preco_teto_cmed
  ).length;
  const totalConformes = medicamentos.filter(
    (m) => !m.ultimoPreco || m.ultimoPreco <= m.preco_teto_cmed
  ).length;
  const percentualConformidade =
    medicamentos.length > 0 ? (totalConformes / medicamentos.length) * 100 : 100;
  const valorExcedidoTotal = medicamentos.reduce((acc, m) => {
    if (m.ultimoPreco && m.ultimoPreco > m.preco_teto_cmed) {
      return acc + (m.ultimoPreco - m.preco_teto_cmed);
    }
    return acc;
  }, 0);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-[#1E3A8A] rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">Conformidade CMED</h1>
              <p className="text-sm text-slate-500">
                Tabela de Preços Teto — ANVISA / CMED
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={carregar}
            className="gap-2 border-slate-300 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <a
            href="https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="gap-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 cursor-pointer">
              <ExternalLink className="w-4 h-4" />
              Portal ANVISA/CMED
            </Button>
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Conformidade Geral
              </p>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-800">{percentualConformidade.toFixed(0)}%</p>
            <Progress value={percentualConformidade} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Dentro do Teto
              </p>
              <TrendingDown className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-emerald-600">{totalConformes}</p>
            <p className="text-xs text-slate-400 mt-1">medicamentos conformes</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Acima do Teto
              </p>
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-black text-red-600">{totalExcedidos}</p>
            <p className="text-xs text-slate-400 mt-1">
              {totalExcedidos > 0 ? 'requerem ação imediata' : 'nenhuma irregularidade'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Valor Excedido
              </p>
              <DollarSign className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-black text-orange-600">
              {valorExcedidoTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-slate-400 mt-1">acima do teto regulatório</p>
          </CardContent>
        </Card>
      </div>

      {/* Aviso CMED */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <FileSpreadsheet className="w-5 h-5 text-[#1E3A8A] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-[#1E293B]">Tabela CMED — ANVISA</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Os preços teto são publicados mensalmente pela ANVISA. Atualize os valores abaixo
            conforme a tabela vigente ou acesse o portal oficial para baixar a planilha XLS.
            O sistema bloqueia automaticamente registros de entrada acima do teto configurado.
          </p>
        </div>
      </div>

      {/* Tabela */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white pb-0 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar medicamento ou código..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              {(['todos', 'conforme', 'excedido'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer',
                    filtro === f
                      ? f === 'excedido'
                        ? 'bg-red-100 text-red-700'
                        : f === 'conforme'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-[#1E3A8A] text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}
                >
                  {f === 'todos' ? 'Todos' : f === 'conforme' ? 'Conformes' : 'Excedidos'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Medicamento
                </th>
                <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Teto CMED (R$)
                </th>
                <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Último Preço Pago
                </th>
                <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Variação
                </th>
                <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Nenhum medicamento encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((m) => {
                  const excedido = m.ultimoPreco != null && m.ultimoPreco > m.preco_teto_cmed;
                  const variacao =
                    m.ultimoPreco != null
                      ? ((m.ultimoPreco / m.preco_teto_cmed) - 1) * 100
                      : null;
                  const isEditando = editandoId === m.id;

                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        'hover:bg-slate-50 transition-colors',
                        excedido && 'bg-red-50/40'
                      )}
                    >
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{m.nome}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {m.dosagem || '—'}
                        </p>
                      </td>

                      {/* Teto CMED — editável */}
                      <td className="py-3 px-4 text-right">
                        {isEditando ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-slate-400">R$</span>
                            <input
                              type="text"
                              value={novoTeto}
                              onChange={(e) => setNovoTeto(e.target.value)}
                              className="w-24 text-right text-sm font-bold border border-[#1E3A8A] rounded px-2 py-1 outline-none"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="font-black text-slate-700">
                            {m.preco_teto_cmed.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {m.ultimoPreco != null ? (
                          <span className={cn('font-bold', excedido ? 'text-red-600' : 'text-slate-700')}>
                            {m.ultimoPreco.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">sem compras</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {variacao !== null ? (
                          <span
                            className={cn(
                              'text-xs font-black',
                              variacao > 0 ? 'text-red-600' : 'text-emerald-600'
                            )}
                          >
                            {variacao > 0 ? '+' : ''}
                            {variacao.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {excedido ? (
                          <Badge className="bg-red-100 text-red-700 border-none text-[10px] font-black uppercase">
                            ⚠ Acima do Teto
                          </Badge>
                        ) : m.ultimoPreco != null ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-black uppercase">
                            ✓ Conforme
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-black uppercase">
                            Sem Dados
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isEditando ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => salvarTeto(m)}
                              disabled={salvando}
                              className="p-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditandoId(null)}
                              className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditandoId(m.id);
                              setNovoTeto(m.preco_teto_cmed.toFixed(2));
                            }}
                            className="p-1.5 rounded bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 cursor-pointer"
                            title="Editar teto CMED"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtrados.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-bold">
            {filtrados.length} medicamento{filtrados.length !== 1 ? 's' : ''} exibido
            {filtrados.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>
    </div>
  );
}
