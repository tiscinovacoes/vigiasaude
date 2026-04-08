'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  ArrowLeft, 
  AlertTriangle, 
  TrendingUp, 
  ArrowDownCircle, 
  Activity,
  History,
  Layers,
  Info
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TabelaEstoqueFEFO } from '@/components/TabelaEstoqueFEFO';

// === Mock Data (Refined for FEFO rules) ===
const MOCK_DETALHE = {
  id: 'med_001',
  nome: 'Insulina NPH 100UI/ml',
  categoria: 'Injetável',
  estoque_total: 125,
  lotes: [
    { id: 'LT-2023-A1', validade: '2024-04-15', qtd: 45, status: 'Vencimento Próximo', prioridade: '1º a usar' },
    { id: 'LT-2023-A2', validade: '2024-12-30', qtd: 80, status: 'Normal', prioridade: '2º a usar' }
  ],
  movimentacoes: [
    { data: '2024-03-15', acao: 'Saída/Entrega', qtd: -5, lote: 'LT-2023-A1', paciente: 'Ana Beatriz' },
    { data: '2024-03-10', acao: 'Entrada/Compra', qtd: 100, lote: 'LT-2023-A2', paciente: '-' }
  ]
};

function MedicamentoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get('tab') || 'lotes';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {MOCK_DETALHE.nome}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Código CMED: 10982-1</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h1>
          <p className="text-muted-foreground">{MOCK_DETALHE.categoria}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Layers size={24}/></div>
           <div><p className="text-xs font-bold text-muted-foreground uppercase">Estoque Total</p><h3 className="text-2xl font-black">{MOCK_DETALHE.estoque_total} un</h3></div>
         </div>
         <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><TrendingUp size={24}/></div>
           <div><p className="text-xs font-bold text-muted-foreground uppercase">Consumo Médio</p><h3 className="text-2xl font-black">4.2/dia</h3></div>
         </div>
         <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-center gap-4">
           <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center animate-pulse-red"><AlertTriangle size={24}/></div>
           <div><p className="text-xs font-bold text-red-600 uppercase">Risco de Ruptura</p><h3 className="text-2xl font-black text-red-700">7 dias</h3></div>
         </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="lotes" className="flex items-center gap-2"><Layers size={16}/> Lotes Ativos (FEFO)</TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2"><History size={16}/> Histórico de Movimentação</TabsTrigger>
        </TabsList>

        <TabsContent value="lotes" className="mt-6">
          <TabelaEstoqueFEFO />
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Paciente / Destino</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DETALHE.movimentacoes.map((mov, idx) => (
                <TableRow key={idx}>
                  <TableCell>{mov.data}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className={mov.qtd > 0 ? "text-emerald-500" : "text-orange-500"} />
                      {mov.acao}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{mov.lote}</TableCell>
                  <TableCell>{mov.paciente}</TableCell>
                  <TableCell className={cn("text-right font-bold", mov.qtd > 0 ? "text-emerald-600" : "text-orange-600")}>
                    {mov.qtd > 0 ? `+${mov.qtd}` : mov.qtd}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MedicamentoDetalhe() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-medium">Carregando Auditoria e Dados FEFO...</div>}>
      <MedicamentoContent />
    </Suspense>
  );
}
