'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Search,
  RefreshCw,
  ExternalLink,
  Edit2,
  Check,
  X,
  Info,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type Medicamento } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type MedicamentoBps = Medicamento & {
  ultimoPreco?: number | null;
  precoBps?: number | null;
};

export default function BpsPage() {
  const [medicamentos, setMedicamentos] = useState<MedicamentoBps[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'abaixo' | 'acima' | 'semBps'>('todos');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novoBps, setNovoBps] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    try {
      // Consulta direta na tabela medicamentos
      const { data: meds, error: medsError } = await supabase
        .from('medicamentos')
        .select('id, nome, dosagem, estoque_minimo, preco_teto_cmed, created_at')
        .order('nome');
      if (medsError || !meds) throw medsError;

      // Último preço pago por medicamento
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
      } catch { /* ignora */ }

      // Preços BPS ficam em localStorage até migration ser criada
      const bpsStore: Record<string, number> = JSON.parse(
        typeof window !== 'undefined' ? localStorage.getItem('bps_precos') || '{}' : '{}'
      );

      const enriched: MedicamentoBps[] = meds.map((m: any) => ({
        ...m,
        ultimoPreco: ultimoPrecoMap[m.id] ?? null,
        precoBps: bpsStore[m.id] ?? null,
      }));

      setMedicamentos(enriched);
    } catch {
      toast.error('Erro ao carregar dados BPS');
    } finally {
      setLoading(false);
    }
  }

  function salvarBps(med: MedicamentoBps) {
    const valor = parseFloat(novoBps.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      toast.error('Informe um valor válido maior que zero');
      return;
    }
    // Salva em localStorage (sem precisar de migration no banco)
    const store: Record<string, number> = JSON.parse(localStorage.getItem('bps_precos') || '{}');
    store[med.id] = valor;
    localStorage.setItem('bps_precos', JSON.stringify(store));
    toast.success(`Preço BPS salvo: R$ ${valor.toFixed(2)}`);
    setEditandoId(null);
    carregar();
  }

  const filtrados = medicamentos
    .filter((m) => {
      if (!busca) return true;
      const q = busca.toLowerCase();
      return m.nome.toLowerCase().includes(q);
    })
    .filter((m) => {
      if (filtro === 'abaixo') return m.ultimoPreco != null && m.precoBps != null && m.ultimoPreco <= m.precoBps;
      if (filtro === 'acima') return m.ultimoPreco != null && m.precoBps != null && m.ultimoPreco > m.precoBps;
      if (filtro === 'semBps') return m.precoBps == null;
      return true;
    });

  const comBps = medicamentos.filter((m) => m.precoBps != null);
  const abaixoBps = comBps.filter((m) => m.ultimoPreco != null && m.ultimoPreco <= m.precoBps!);
  const acimaBps = comBps.filter((m) => m.ultimoPreco != null && m.ultimoPreco > m.precoBps!);
  const economiaTotal = comBps.reduce((acc, m) => {
    if (m.ultimoPreco != null && m.precoBps != null && m.ultimoPreco < m.precoBps) {
      return acc + (m.precoBps - m.ultimoPreco);
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Banco de Preços em Saúde</h1>
            <p className="text-sm text-slate-500">
              Comparativo BPS — Ministério da Saúde
            </p>
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
            href="https://bps.saude.gov.br/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
              <ExternalLink className="w-4 h-4" />
              Portal BPS
            </Button>
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Com Preço BPS</p>
              <BarChart3 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-800">{comBps.length}</p>
            <p className="text-xs text-slate-400 mt-1">de {medicamentos.length} medicamentos</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abaixo do BPS</p>
              <TrendingDown className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-emerald-600">{abaixoBps.length}</p>
            <p className="text-xs text-slate-400 mt-1">compras eficientes</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acima do BPS</p>
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-black text-red-600">{acimaBps.length}</p>
            <p className="text-xs text-slate-400 mt-1">revisar fornecedores</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Economia vs BPS</p>
              <Award className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black text-blue-700">
              {economiaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">por unidade vs referência</p>
          </CardContent>
        </Card>
      </div>

      {/* Aviso BPS */}
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <Info className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-[#1E293B]">Como usar o BPS</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Acesse <strong>bps.saude.gov.br</strong>, busque o medicamento pelo nome ou código,
            copie o preço de referência e registre abaixo clicando no ícone de edição. O sistema
            calcula automaticamente a economia ou sobrepreço em relação à média nacional de compras governamentais.
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
                placeholder="Buscar medicamento..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'abaixo', 'acima', 'semBps'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer',
                    filtro === f
                      ? f === 'acima' ? 'bg-red-100 text-red-700'
                        : f === 'abaixo' ? 'bg-emerald-100 text-emerald-700'
                        : f === 'semBps' ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}
                >
                  {f === 'todos' ? 'Todos' : f === 'abaixo' ? '↓ Abaixo BPS' : f === 'acima' ? '↑ Acima BPS' : 'Sem BPS'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Medicamento</th>
                <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Preço Ref. BPS</th>
                <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Último Preço Pago</th>
                <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Diferença</th>
                <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="text-center py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ref. BPS</th>
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
                  const acima = m.ultimoPreco != null && m.precoBps != null && m.ultimoPreco > m.precoBps;
                  const abaixo = m.ultimoPreco != null && m.precoBps != null && m.ultimoPreco <= m.precoBps;
                  const diff = m.ultimoPreco != null && m.precoBps != null
                    ? ((m.ultimoPreco / m.precoBps) - 1) * 100
                    : null;
                  const isEditando = editandoId === m.id;

                  return (
                    <tr key={m.id} className={cn('hover:bg-slate-50 transition-colors', acima && 'bg-red-50/30')}>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{m.nome}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {m.dosagem || '—'}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isEditando ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-slate-400">R$</span>
                            <input
                              type="text"
                              value={novoBps}
                              onChange={(e) => setNovoBps(e.target.value)}
                              className="w-24 text-right text-sm font-bold border border-emerald-500 rounded px-2 py-1 outline-none"
                              autoFocus
                              placeholder="0,00"
                            />
                          </div>
                        ) : m.precoBps != null ? (
                          <span className="font-black text-slate-700">
                            {m.precoBps.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">não cadastrado</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {m.ultimoPreco != null ? (
                          <span className={cn('font-bold', acima ? 'text-red-600' : abaixo ? 'text-emerald-600' : 'text-slate-700')}>
                            {m.ultimoPreco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">sem compras</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {diff !== null ? (
                          <span className={cn('text-xs font-black', diff > 0 ? 'text-red-600' : 'text-emerald-600')}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {m.precoBps == null ? (
                          <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-black uppercase">
                            Sem Ref.
                          </Badge>
                        ) : acima ? (
                          <Badge className="bg-red-100 text-red-700 border-none text-[10px] font-black uppercase">
                            ↑ Acima BPS
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-black uppercase">
                            ↓ Eficiente
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isEditando ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => salvarBps(m)}
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
                              setNovoBps(m.precoBps?.toFixed(2) ?? '');
                            }}
                            className="p-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                            title="Editar preço BPS"
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
            {filtrados.length} medicamento{filtrados.length !== 1 ? 's' : ''} exibido{filtrados.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>
    </div>
  );
}
