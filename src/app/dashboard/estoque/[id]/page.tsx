'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Package, 
  Layers, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  History,
  Info
} from 'lucide-react';
import { api, type Medicamento, type Lote } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function MedicamentoDetalheFEFO() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [medicamento, setMedicamento] = useState<Medicamento | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar medicamento via estoque base (filtro local por enquanto)
      const meds = await api.getEstoqueBase();
      const med = meds.find(m => m.id === id);
      if (med) {
        setMedicamento(med);
        // Carregar lotes via API específica FEFO
        const lotesData = await api.getLotesByMedicamento(id);
        setLotes(lotesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  if (!medicamento) {
    return <div className="p-8 text-center">Medicamento não encontrado.</div>;
  }

  const totalDisponivel = lotes.reduce((acc, l) => acc + (l.quantidade_disponivel || 0), 0);
  const isCritico = totalDisponivel < medicamento.estoque_minimo;

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl shadow-sm">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">{medicamento.nome}</h1>
              <Badge variant="outline" className="font-mono text-[10px] text-slate-400 border-slate-200">ID: {medicamento.codigo || 'S/C'}</Badge>
              <Badge variant="secondary" className="font-bold text-xs px-3">{medicamento.dosagem}</Badge>
            </div>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Rastreabilidade FEFO Ativada
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="gap-2 font-bold text-xs rounded-xl shadow-sm">
             <History size={16} /> Ver Histórico de Saídas
           </Button>
           <Button className="bg-[#1E3A8A] hover:bg-blue-800 gap-2 font-bold text-xs rounded-xl shadow-lg">
             <TrendingUp size={16} /> Ajustar Estoque
           </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Package size={14} /> Estoque Total Físico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <h3 className={cn("text-3xl font-black", isCritico ? "text-red-600" : "text-slate-800")}>{totalDisponivel}</h3>
              <span className="text-xs font-bold text-slate-400">UNIDADES</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Mínimo de Segurança: {medicamento.estoque_minimo}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} /> Total de Lotes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">{lotes.length}</h3>
              <span className="text-xs font-bold text-slate-400">LOTES</span>
            </div>
            <p className="text-[10px] font-bold text-blue-500 mt-2 uppercase tracking-tight flex items-center gap-1">
              <Info size={12} /> Diversificação de validade protege a logística
            </p>
          </CardContent>
        </Card>

        <Card className={cn("border-none shadow-sm", isCritico ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black opacity-60 uppercase tracking-widest">
              Status Logístico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {isCritico ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
              <div>
                <h3 className="text-xl font-black uppercase text-slate-800">{isCritico ? 'Crítico/Ruptura' : 'Operação Saudável'}</h3>
                <p className="text-[10px] font-bold opacity-70 uppercase mt-0.5">Baseado no consumo médio mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOTES TABLE (FEFO FOCUS) */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black">Escalonamento de Lotes (Regra FEFO)</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-tighter text-slate-400 mt-1">
              Ordenação automática: Lotes com validade mais próxima saem primeiro
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 italic text-xs font-medium">
             <Calendar size={14} /> Regra: First Expired, First Out
          </div>
        </CardHeader>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Prioridade</TableHead>
              <TableHead>Código do Lote</TableHead>
              <TableHead>Data de Validade</TableHead>
              <TableHead className="text-right">Quantidade Disponível</TableHead>
              <TableHead className="text-right">Quantidade Reservada</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Custo Unitário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotes.map((lote, index) => {
              const daysToExpire = Math.ceil((new Date(lote.data_validade).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              const isFirst = index === 0;

              return (
                <TableRow key={lote.id} className={cn(
                  "hover:bg-slate-50 transition-colors",
                  isFirst ? "bg-emerald-50/50" : ""
                )}>
                  <TableCell>
                    {isFirst ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 animate-pulse text-[10px] font-black uppercase tracking-wider px-2.5">
                        Proximo a Sair
                      </Badge>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 ml-4 font-mono">#{index + 1}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-slate-700">{lote.codigo_lote_fabricante}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-black text-sm",
                        daysToExpire < 90 ? "text-orange-600" : "text-slate-700"
                      )}>
                        {new Date(lote.data_validade).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Expira em {daysToExpire} dias
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-800">{lote.quantidade_disponivel}</TableCell>
                  <TableCell className="text-right text-slate-500 font-medium italic">{lote.quantidade_reservada}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "text-[10px] font-bold uppercase tracking-widest border-none",
                      lote.status === 'ATIVO' ? "bg-emerald-50 text-emerald-600 shadow-none border border-emerald-100" : 
                      lote.status === 'RECALL' ? "bg-red-600 text-white" : "bg-slate-200 text-slate-600"
                    )}>
                      {lote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-500">
                    R$ {lote.custo_unitario_compra.toFixed(2).replace('.', ',')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {lotes.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Layers size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">Nenhum lote ativo encontrado</p>
            <p className="text-sm">Não há estoque disponível para dispensação no momento.</p>
          </div>
        )}
      </Card>

      {/* FOOTER INFO */}
      <div className="rounded-2xl bg-white border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
             <Info size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">Informação de Conformidade</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              Este painel reflete o estado atual do banco de dados do Vigia Saúde. A recomendação de saída respeita estritamente o princípio **FEFO**. Qualquer dispensação fora da ordem sugerida gerará um alerta automático no painel de Auditoria Master.
            </p>
          </div>
        </div>
        <Button variant="outline" className="font-bold text-xs uppercase tracking-widest border-slate-200 hover:bg-slate-50">
          Gerar Laudo de Conformidade
        </Button>
      </div>
    </div>
  );
}
