'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type CompraRegistro, type RecebimentoItem } from '@/lib/api';
import { toast } from 'sonner';

// ─────────────────────────── helpers ───────────────────────────────────────

type ItemUI = RecebimentoItem & { medicamento_nome?: string };

type AvariaForm = {
  itemId: string;
  quantidade: number;
  observacao: string;
};

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONFERIDO: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    AVARIA: 'bg-red-500/20 text-red-300 border border-red-500/40',
    PENDENTE: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  };
  const labels: Record<string, string> = {
    CONFERIDO: '✓ Conferido',
    AVARIA: '⚠ Avaria',
    PENDENTE: '⏳ Pendente',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'bg-gray-500/20 text-gray-300'}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─────────────────────────── main page ─────────────────────────────────────

export default function ReceberPage() {
  const { id: compraId } = useParams<{ id: string }>();
  const router = useRouter();

  // state: compra
  const [compra, setCompra] = useState<CompraRegistro | null>(null);
  const [loadingCompra, setLoadingCompra] = useState(true);

  // state: recebimento
  const [recebimentoId, setRecebimentoId] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemUI[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);

  // state: form de item
  const [barcode, setBarcode] = useState('');
  const [lote, setLote] = useState('');
  const [validade, setValidade] = useState('');
  const [qtdRecebida, setQtdRecebida] = useState(1);

  // state: avaria modal
  const [avariaTarget, setAvariaTarget] = useState<string | null>(null);
  const [avariaForm, setAvariaForm] = useState<AvariaForm>({ itemId: '', quantidade: 1, observacao: '' });

  const barcodeRef = useRef<HTMLInputElement>(null);

  // ── load compra ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingCompra(true);
      const details = await api.getCompraDetalhes(compraId);
      if (details) {
        setCompra(details.compra as CompraRegistro);
        // Resume if there's already an in-progress recebimento
        if (details.recebimento && details.recebimento.status === 'EM_CONFERENCIA') {
          setRecebimentoId(details.recebimento.id);
          setItens((details.recebimento.itens ?? []) as ItemUI[]);
        }
      }
      setLoadingCompra(false);
    })();
  }, [compraId]);

  // ── iniciar recebimento ────────────────────────────────────────────────────
  async function iniciar() {
    if (!compraId) return;
    setSalvando(true);
    try {
      const result = await api.iniciarRecebimento(compraId);
      if (!result.success || !result.recebimentoId) {
        toast.error(result.error ?? 'Erro ao iniciar recebimento');
        return;
      }
      setRecebimentoId(result.recebimentoId);
      toast.success('Recebimento iniciado! Escaneie os itens.');
      barcodeRef.current?.focus();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao iniciar recebimento');
    } finally {
      setSalvando(false);
    }
  }

  // ── conferir item ──────────────────────────────────────────────────────────
  async function conferirItem(e: React.FormEvent) {
    e.preventDefault();
    if (!recebimentoId || !compra) return;
    if (!lote || !validade) { toast.error('Informe o lote e validade'); return; }

    setSalvando(true);
    try {
      const result = await api.conferirItemBarcode({
        recebimento_id: recebimentoId,
        compra_id: compraId,
        medicamento_id: compra.medicamento_id,
        barcode: barcode || undefined,
        lote,
        validade,
        quantidade_recebida: qtdRecebida,
      });

      if (!result.success || !result.itemId) {
        toast.error(result.error ?? 'Erro ao conferir item');
        return;
      }

      const newItem: ItemUI = {
        id: result.itemId,
        recebimento_id: recebimentoId,
        compra_id: compraId,
        medicamento_id: compra.medicamento_id,
        barcode: barcode || null,
        lote,
        validade,
        quantidade_recebida: qtdRecebida,
        status_item: 'CONFERIDO',
        medicamento_nome: (compra as any).medicamentos?.nome ?? compra.medicamento_id,
      };

      setItens((prev) => [newItem, ...prev]);
      toast.success(`Lote ${lote} conferido ✓`);

      // reset form
      setBarcode('');
      setLote('');
      setValidade('');
      setQtdRecebida(1);
      barcodeRef.current?.focus();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao conferir item');
    } finally {
      setSalvando(false);
    }
  }

  // ── registrar avaria ───────────────────────────────────────────────────────
  async function registrarAvaria() {
    if (!recebimentoId || !avariaForm.itemId) return;
    setSalvando(true);
    try {
      const result = await api.registrarAvaria(recebimentoId, avariaForm.itemId, {
        quantidade_avaria: avariaForm.quantidade,
        observacao: avariaForm.observacao,
      });
      if (!result.success) { toast.error(result.error ?? 'Erro ao registrar avaria'); return; }
      setItens((prev) =>
        prev.map((i) => (i.id === avariaForm.itemId ? { ...i, status_item: 'AVARIA' as const } : i))
      );
      toast.warning('Avaria registrada e gestor notificado');
      setAvariaTarget(null);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao registrar avaria');
    } finally {
      setSalvando(false);
    }
  }

  // ── finalizar recebimento ──────────────────────────────────────────────────
  async function finalizar() {
    if (!recebimentoId) return;
    if (itens.length === 0) { toast.error('Nenhum item conferido'); return; }
    const ok = confirm(
      `Finalizar recebimento?\n\n• ${itens.filter((i) => i.status_item === 'CONFERIDO').length} item(ns) conferido(s)\n• ${itens.filter((i) => i.status_item === 'AVARIA').length} item(ns) com avaria\n\nLotes conferidos serão lançados no estoque.`
    );
    if (!ok) return;

    setFinalizando(true);
    try {
      const result = await api.finalizarRecebimento(recebimentoId);
      if (!result.success) { toast.error(result.error ?? 'Erro ao finalizar'); return; }
      toast.success(`Recebimento finalizado! ${result.lotesEntrados} lote(s) entrado(s) no estoque.`);
      setFinalizado(true);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao finalizar');
    } finally {
      setFinalizando(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const conferidos = itens.filter((i) => i.status_item === 'CONFERIDO').length;
  const avariados  = itens.filter((i) => i.status_item === 'AVARIA').length;
  const qtdTotal   = itens.reduce((s, i) => s + i.quantidade_recebida, 0);
  const qtdPedida  = compra?.quantidade ?? 0;
  const pct        = qtdPedida > 0 ? Math.min(100, Math.round((qtdTotal / qtdPedida) * 100)) : 0;

  if (loadingCompra) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#0d1117] text-white">
        <p className="text-red-400 text-lg">Compra não encontrada.</p>
        <Link href="/dashboard/compras" className="text-blue-400 underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white px-4 py-6 max-w-4xl mx-auto">
      {/* ── header ── */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/compras" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-1">
            ← Compras
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Recebimento de Compra
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {(compra as any).medicamentos?.nome ?? compra.medicamento_id} · {compra.quantidade} {(compra as any).unidade}
            {(compra as any).numero_po && (
              <span className="ml-2 text-cyan-400 font-mono">[{(compra as any).numero_po}]</span>
            )}
          </p>
        </div>

        {/* Progress badge */}
        <div className="text-right">
          <div className="text-3xl font-bold text-cyan-400">{pct}%</div>
          <div className="text-xs text-gray-400">{qtdTotal}/{qtdPedida} un.</div>
        </div>
      </header>

      {/* ── progress bar ── */}
      <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
        <div
          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* ── stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Conferidos', value: conferidos, color: 'text-emerald-400' },
          { label: 'Avarias', value: avariados, color: 'text-red-400' },
          { label: 'Qtd Total', value: qtdTotal, color: 'text-cyan-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ── iniciar or finalizado block ── */}
      {finalizado ? (
        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-6 text-center mb-6">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-emerald-300 font-semibold text-lg">Recebimento finalizado!</p>
          <p className="text-gray-400 text-sm mt-1">
            {conferidos} lote(s) entrado(s) no estoque · {avariados} lote(s) com avaria (bloqueados)
          </p>
          <Link
            href="/dashboard/compras"
            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition"
          >
            Voltar para Compras
          </Link>
        </div>
      ) : !recebimentoId ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center mb-6">
          <p className="text-gray-300 mb-4">Clique para iniciar a conferência desta compra.</p>
          <button
            onClick={iniciar}
            disabled={salvando}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
          >
            {salvando ? 'Iniciando…' : '▶ Iniciar Recebimento'}
          </button>
        </div>
      ) : (
        <>
          {/* ── scan / conferência form ── */}
          <form onSubmit={conferirItem} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-200 mb-2">📦 Conferir Item</h2>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Código de Barras (opcional)</label>
              <input
                ref={barcodeRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan ou digitar…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Lote *</label>
                <input
                  required
                  type="text"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  placeholder="ex.: LOT-2025-001"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Validade *</label>
                <input
                  required
                  type="date"
                  value={validade}
                  onChange={(e) => setValidade(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Quantidade recebida *</label>
              <input
                required
                type="number"
                min={1}
                value={qtdRecebida}
                onChange={(e) => setQtdRecebida(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              {salvando ? 'Salvando…' : '✓ Confirmar Item'}
            </button>
          </form>

          {/* ── itens conferidos ── */}
          {itens.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-gray-800">
                <h2 className="font-semibold text-gray-200">Itens Conferidos ({itens.length})</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        Lote <span className="font-mono text-cyan-400">{item.lote}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Val: {item.validade} · {item.quantidade_recebida} un.
                        {item.barcode && <span className="ml-2 text-gray-500">📷 {item.barcode}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={item.status_item} />
                      {item.status_item === 'CONFERIDO' && (
                        <button
                          onClick={() => {
                            setAvariaTarget(item.id);
                            setAvariaForm({ itemId: item.id, quantidade: 1, observacao: '' });
                          }}
                          className="text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-2 py-0.5 rounded transition"
                        >
                          Informar Avaria
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── finalizar button ── */}
          <button
            onClick={finalizar}
            disabled={finalizando || itens.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all shadow-lg"
          >
            {finalizando ? '⏳ Finalizando…' : '🏁 Finalizar Recebimento'}
          </button>
        </>
      )}

      {/* ── avaria modal ── */}
      {avariaTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-gray-900 border border-red-800/60 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-red-300 mb-4">⚠ Registrar Avaria</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Quantidade avariada *</label>
                <input
                  type="number"
                  min={1}
                  value={avariaForm.quantidade}
                  onChange={(e) => setAvariaForm((f) => ({ ...f, quantidade: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Observação *</label>
                <textarea
                  rows={3}
                  value={avariaForm.observacao}
                  onChange={(e) => setAvariaForm((f) => ({ ...f, observacao: e.target.value }))}
                  placeholder="Descreva o tipo de avaria…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setAvariaTarget(null)}
                className="flex-1 border border-gray-700 text-gray-300 hover:text-white py-2 rounded-xl text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={registrarAvaria}
                disabled={salvando || !avariaForm.observacao}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition"
              >
                {salvando ? 'Salvando…' : 'Registrar Avaria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
