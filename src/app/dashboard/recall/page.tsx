'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Package, 
  Truck, 
  Users, 
  AlertTriangle,
  Lock,
  ArrowRight,
  QrCode,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Send,
  PhoneCall
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { api, recallAPI } from '@/lib/api';

// ---------- Tipos ----------
type RecallResultInfo = {
  success: boolean;
  pacientesNotificados: number;
  serialNumbersAffected: number;
  pacientesAfetados: { id: string; nome_completo: string; cpf: string; telefone: string | null }[];
  error?: string;
};

type SNRastreio = {
  serial_number: string;
  lote: { codigo: string; validade: string; status: string };
  medicamento: { nome: string };
  paciente?: { nome: string; id: string };
  entregas: { data: string; status: string; entregador: string }[];
};

type LoteRecall = {
  id: string;
  codigo_lote_fabricante: string;
  data_validade: string;
  medicamento_nome: string;
  unidades_afetadas: number;
};

// ---------- Componente interno (usa useSearchParams) ----------
function RecallContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('q') ?? '';

  const [searchTerm, setSearchTerm] = useState(prefill);
  const [loteData, setLoteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recalling, setRecalling] = useState(false);
  const [recallResult, setRecallResult] = useState<RecallResultInfo | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notifDone, setNotifDone] = useState(false);

  // Lista geral de lotes em RECALL
  const [lotesEmRecall, setLotesEmRecall] = useState<LoteRecall[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);

  // Rastreio por S/N
  const [snTerm, setSnTerm] = useState('');
  const [snLoading, setSnLoading] = useState(false);
  const [snResult, setSnResult] = useState<SNRastreio | null>(null);
  const [snNotFound, setSnNotFound] = useState(false);

  // Carrega lista de lotes em recall ao montar
  const fetchLotesEmRecall = useCallback(async () => {
    setLoadingLotes(true);
    const lista = await recallAPI.getLotesEmRecall();
    setLotesEmRecall(lista);
    setLoadingLotes(false);
  }, []);

  useEffect(() => {
    fetchLotesEmRecall();
  }, [fetchLotesEmRecall]);

  // Auto-busca se vier query param
  useEffect(() => {
    if (prefill) handleSearch(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (term?: string) => {
    const q = (term ?? searchTerm).trim();
    if (!q) return;
    setLoading(true);
    setLoteData(null);
    setRecallResult(null);

    try {
      const allLotes = await api.getLotes();
      const match = allLotes.find(l =>
        l.codigo_lote_fabricante.toUpperCase() === q.toUpperCase() ||
        l.id === q
      );

      if (match) {
        setLoteData(match);
        toast.error(`Lote ${match.codigo_lote_fabricante} identificado — aguardando ação de recall.`, {
          icon: <ShieldAlert className="text-red-600" />,
        });
      } else {
        setLoteData(null);
        toast.warning('Nenhum lote encontrado com este ID/código.');
      }
    } catch {
      toast.error('Erro ao consultar base de rastreabilidade.');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarRecall = async () => {
    if (!loteData?.id) return;
    setRecalling(true);
    try {
      const raw = await recallAPI.iniciarRecall(loteData.id, 'Recall iniciado pelo painel');
      const normalized: RecallResultInfo = {
        success: true,
        pacientesNotificados: raw.pacientesAfetados.length,
        serialNumbersAffected: 0,
        pacientesAfetados: raw.pacientesAfetados,
      };
      setRecallResult(normalized);
      toast.success(
        `Recall iniciado! ${normalized.pacientesNotificados} pacientes afetados identificados.`,
        { duration: 8000 }
      );
    } catch (err: any) {
      const failed: RecallResultInfo = {
        success: false,
        pacientesNotificados: 0,
        serialNumbersAffected: 0,
        pacientesAfetados: [],
        error: err?.message ?? 'Erro desconhecido',
      };
      setRecallResult(failed);
      toast.error(`Falha ao iniciar recall: ${failed.error}`);
    } finally {
      setRecalling(false);
      setNotifDone(false);
      await fetchLotesEmRecall();
    }
  };

  const handleRastrearSN = async () => {
    const sn = snTerm.trim();
    if (!sn) return;
    setSnLoading(true);
    setSnResult(null);
    setSnNotFound(false);
    const result = await recallAPI.rastrearSerialNumber(sn);
    setSnLoading(false);
    if (result) {
      setSnResult(result);
    } else {
      setSnNotFound(true);
      toast.warning('Serial number não encontrado no sistema.');
    }
  };

  const handleNotificarTodos = async () => {
    if (!recallResult?.pacientesAfetados?.length) return;
    setNotifying(true);
    let sucessos = 0;
    let falhas = 0;
    for (const paciente of recallResult.pacientesAfetados) {
      try {
        const mensagem = `⚠️ RECALL SANITÁRIO: O medicamento que você recebeu (Lote: ${loteData?.codigo_lote_fabricante ?? 'N/D'}) foi objeto de recall. Por favor, NÃO utilize o produto e entre em contato imediatamente com a farmácia responsável pelo seu tratamento. Pedimos desculpas pelo inconveniente.`;
        await recallAPI.enviarAlertaWhatsApp(paciente.id, mensagem);
        sucessos++;
      } catch {
        falhas++;
      }
    }
    setNotifying(false);
    setNotifDone(true);
    if (falhas === 0) {
      toast.success(`✅ ${sucessos} alertas WhatsApp enfileirados com sucesso!`, { duration: 8000 });
    } else {
      toast.warning(`⚠️ ${sucessos} enviados, ${falhas} falhas ao enfileirar.`);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'RECALL') return 'destructive';
    if (s === 'ATIVO') return 'default';
    return 'secondary';
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">

      {/* HEADER */}
      <div className="bg-white p-8 rounded-[0.625rem] border shadow-sm space-y-4">
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <ShieldAlert size={32} className="text-[#DC2626] animate-pulse" />
          Motor de Recall Sanitário
        </h1>
        <p className="text-slate-500 font-medium">
          Busca por Batch ID para bloqueio imediato e notificação em cascata de pacientes via WhatsApp.
        </p>

        <div className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Insira o Batch ID ou código do lote..."
              className="pl-12 h-14 text-lg font-bold border-2 focus-visible:ring-[#DC2626]"
            />
          </div>
          <Button
            onClick={() => handleSearch()}
            disabled={loading}
            className="h-14 px-8 bg-[#DC2626] hover:bg-red-700 font-bold gap-2"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
            Investigar
          </Button>
        </div>
      </div>

      {/* RESULTADO DE BUSCA DE LOTE */}
      {loteData && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">

          {/* HEADER DO LOTE */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-red-800 text-xl flex items-center gap-2">
                    <AlertTriangle size={20} />
                    Lote: {loteData.codigo_lote_fabricante}
                  </CardTitle>
                  <p className="text-sm text-red-600 mt-1">
                    Validade: {new Date(loteData.data_validade).toLocaleDateString('pt-BR')} &nbsp;|&nbsp;
                    Status atual: <Badge variant={statusColor(loteData.status)}>{loteData.status}</Badge>
                  </p>
                </div>

                {/* BOTÃO RECALL */}
                {loteData.status !== 'RECALL' ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="bg-red-600 hover:bg-red-700 font-bold gap-2"
                        disabled={recalling}
                      >
                        {recalling ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
                        Disparar Recall em Cascata
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Recall Sanitário?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá:<br />
                          1. Marcar o lote <strong>{loteData.codigo_lote_fabricante}</strong> como <strong>RECALL</strong> no banco.<br />
                          2. Identificar todos os pacientes que receberam unidades deste lote.<br />
                          3. Enfileirar alertas WhatsApp automáticos para cada paciente na tabela <code>notificacoes_fila</code>.<br />
                          4. Registrar o evento em auditoria com timestamp imutável.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleIniciarRecall}
                        >
                          Confirmar Recall
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Badge variant="destructive" className="text-sm px-4 py-2">
                    ✅ RECALL JÁ ATIVO
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* RESULTADO DO RECALL */}
          {recallResult && (
            <div className="space-y-4">
              <Card className={recallResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {recallResult.success
                      ? <CheckCircle2 size={32} className="text-green-600" />
                      : <XCircle size={32} className="text-red-600" />
                    }
                    <div>
                      <p className="font-bold text-lg">
                        {recallResult.success ? 'Recall executado com sucesso!' : `Erro: ${recallResult.error}`}
                      </p>
                      {recallResult.success && (
                        <p className="text-sm text-slate-600">
                          <strong>{recallResult.serialNumbersAffected}</strong> unidades serializadas afetadas &nbsp;|&nbsp;
                          <strong>{recallResult.pacientesNotificados}</strong> pacientes identificados
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PAINEL DE NOTIFICAÇÃO EM MASSA */}
              {recallResult.success && recallResult.pacientesAfetados.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-orange-800 text-base flex items-center gap-2">
                      <PhoneCall size={18} />
                      Notificação WhatsApp em Massa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Lista compacta de pacientes */}
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {recallResult.pacientesAfetados.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-orange-100">
                          <div className="flex items-center gap-2 text-sm">
                            <Users size={14} className="text-orange-500 shrink-0" />
                            <span className="font-medium text-slate-700">{p.nome_completo}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {p.telefone ?? 'Sem tel.'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm text-orange-700">
                        {notifDone
                          ? '✅ Alertas enfileirados na tabela notificacoes_fila.'
                          : `Pronto para disparar alerta para ${recallResult.pacientesAfetados.length} paciente(s) via WhatsApp.`
                        }
                      </p>
                      <Button
                        onClick={handleNotificarTodos}
                        disabled={notifying || notifDone}
                        className="bg-green-600 hover:bg-green-700 gap-2 shrink-0"
                      >
                        {notifying
                          ? <RefreshCw size={16} className="animate-spin" />
                          : <Send size={16} />
                        }
                        {notifDone ? 'Enviado ✓' : 'Notificar todos via WhatsApp'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ABAS PRINCIPAIS */}
      <Tabs defaultValue="recall-list" className="bg-white p-6 rounded-xl border">
        <TabsList className="mb-6 bg-slate-100 p-1">
          <TabsTrigger value="recall-list" className="gap-2">
            <Package size={16} /> Lotes em RECALL
            {lotesEmRecall.length > 0 && (
              <Badge variant="destructive" className="ml-1">{lotesEmRecall.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="serial" className="gap-2">
            <QrCode size={16} /> Rastreio por S/N
          </TabsTrigger>
        </TabsList>

        {/* TAB: Lotes em RECALL */}
        <TabsContent value="recall-list" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Lotes com status RECALL ativo</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLotesEmRecall}
              disabled={loadingLotes}
              className="gap-2"
            >
              <RefreshCw size={14} className={loadingLotes ? 'animate-spin' : ''} />
              Atualizar
            </Button>
          </div>

          {loadingLotes ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : lotesEmRecall.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-green-400" />
              <p className="font-bold">Nenhum lote em RECALL ativo no momento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código do Lote</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Unidades Afetadas</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotesEmRecall.map((lote) => (
                  <TableRow key={lote.id} className="hover:bg-red-50">
                    <TableCell className="font-mono font-bold text-red-700">
                      {lote.codigo_lote_fabricante}
                    </TableCell>
                    <TableCell className="font-medium">{lote.medicamento_nome}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(lote.data_validade).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{lote.unidades_afetadas} un.</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-blue-600 font-bold"
                        onClick={() => {
                          setSearchTerm(lote.codigo_lote_fabricante);
                          handleSearch(lote.codigo_lote_fabricante);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Investigar <ArrowRight size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* TAB: Rastreio por Serial Number */}
        <TabsContent value="serial" className="space-y-6">
          <div>
            <h3 className="font-bold text-slate-700 mb-2">Rastreio por Serial Number (S/N)</h3>
            <p className="text-sm text-slate-500 mb-4">
              Insira o serial number de uma unidade serializada para ver toda a cadeia de custódia.
            </p>
            <div className="flex gap-3 max-w-xl">
              <div className="relative flex-1">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  value={snTerm}
                  onChange={(e) => setSnTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRastrearSN()}
                  placeholder="Ex: SN-2024-00123456"
                  className="pl-10"
                />
              </div>
              <Button onClick={handleRastrearSN} disabled={snLoading} className="gap-2">
                {snLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                Rastrear
              </Button>
            </div>
          </div>

          {snNotFound && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              <AlertTriangle size={20} />
              <p className="font-medium">Serial number não encontrado na base de dados.</p>
            </div>
          )}

          {snResult && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              {/* Info do lote */}
              <Card className={snResult.lote.status === 'RECALL' ? 'border-red-300 bg-red-50' : 'border-slate-200'}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode size={18} />
                    S/N: <span className="font-mono">{snResult.serial_number}</span>
                    <Badge variant={statusColor(snResult.lote.status)} className="ml-2">
                      {snResult.lote.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-bold mb-1">Medicamento</p>
                    <p className="font-semibold">{snResult.medicamento.nome}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-bold mb-1">Lote</p>
                    <p className="font-mono font-semibold">{snResult.lote.codigo}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-bold mb-1">Validade</p>
                    <p className="font-semibold">{new Date(snResult.lote.validade).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {snResult.paciente && (
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-slate-400 text-xs uppercase font-bold mb-1">Último Paciente Registrado</p>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-500" />
                        <p className="font-semibold text-blue-700">{snResult.paciente.nome}</p>
                        <Link href={`/dashboard/pacientes/${snResult.paciente.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-blue-600 h-6 px-2">
                            Ver prontuário <ArrowRight size={12} />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline de entregas */}
              {snResult.entregas.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-600 mb-3 flex items-center gap-2">
                    <Truck size={16} /> Cadeia de Custódia ({snResult.entregas.length} registros)
                  </h4>
                  <div className="relative pl-6 space-y-3">
                    {snResult.entregas.map((e, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[1.4rem] top-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-1 ring-blue-300" />
                        {i < snResult.entregas.length - 1 && (
                          <div className="absolute -left-[1.15rem] top-4 w-0.5 h-full bg-slate-200" />
                        )}
                        <div className="bg-slate-50 border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{e.entregador || 'Entregador não registrado'}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(e.data).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <Badge variant={e.status === 'ENTREGUE' ? 'default' : 'secondary'} className="text-xs">
                              {e.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Página (wrapper com Suspense para useSearchParams) ----------
export default function RecallPage() {
  return (
    <Suspense fallback={
      <div className="p-8 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <RecallContent />
    </Suspense>
  );
}
