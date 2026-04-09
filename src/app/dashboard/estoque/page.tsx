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
  Info,
  Loader2,
  Package
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
import { api, type Medicamento } from '@/lib/api';

function EstoqueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get('tab') || 'visao-geral';

  const [loading, setLoading] = useState(true);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  useEffect(() => {
    loadEstoque();
  }, []);

  const loadEstoque = async () => {
    setLoading(true);
    try {
      const data = await api.getEstoqueBase();
      setMedicamentos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Compute stats
  const totalMeds = medicamentos.length;
  const totalLotes = medicamentos.reduce((s, m) => s + (m.lotes?.length || 0), 0);
  const estoqueCritico = medicamentos.filter(m => {
    const totalDisp = (m.lotes || []).reduce((s, l) => s + (l.quantidade_disponivel || 0), 0);
    return totalDisp < m.estoque_minimo;
  }).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Gestão de Estoque FEFO
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>First Expired, First Out — Lotes com vencimento mais próximo devem ser dispensados primeiro.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h1>
          <p className="text-muted-foreground">Medicamentos e Lotes conectados ao Supabase</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Package size={24}/></div>
           <div><p className="text-xs font-bold text-muted-foreground uppercase">Medicamentos</p><h3 className="text-2xl font-black">{totalMeds}</h3></div>
         </div>
         <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Layers size={24}/></div>
           <div><p className="text-xs font-bold text-muted-foreground uppercase">Total de Lotes</p><h3 className="text-2xl font-black">{totalLotes}</h3></div>
         </div>
         <div className={cn(
           "p-6 rounded-xl border flex items-center gap-4",
           estoqueCritico > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
         )}>
           <div className={cn(
             "w-12 h-12 rounded-lg flex items-center justify-center",
             estoqueCritico > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
           )}>
             <AlertTriangle size={24}/>
           </div>
           <div>
             <p className={cn("text-xs font-bold uppercase", estoqueCritico > 0 ? "text-red-600" : "text-emerald-600")}>
               {estoqueCritico > 0 ? 'Estoque Crítico' : 'Estoque OK'}
             </p>
             <h3 className={cn("text-2xl font-black", estoqueCritico > 0 ? "text-red-700" : "text-emerald-700")}>
               {estoqueCritico > 0 ? `${estoqueCritico} itens` : 'Tudo em ordem'}
             </h3>
           </div>
         </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2"><Package size={16}/> Visão Geral</TabsTrigger>
          <TabsTrigger value="lotes" className="flex items-center gap-2"><Layers size={16}/> Lotes Ativos (FEFO)</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-6">
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 size={32} className="mx-auto animate-spin text-blue-500 mb-3" />
              <p className="text-sm text-slate-500 font-medium">Carregando medicamentos...</p>
            </div>
          ) : medicamentos.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-xl border">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-600">Nenhum medicamento cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Dosagem</TableHead>
                  <TableHead className="text-right">Estoque Mín.</TableHead>
                  <TableHead className="text-right">Estoque Atual</TableHead>
                  <TableHead className="text-right">Preço CMED</TableHead>
                  <TableHead className="text-center">Lotes</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicamentos.map((med) => {
                  const totalDisp = (med.lotes || []).reduce((s, l) => s + (l.quantidade_disponivel || 0), 0);
                  const isCritico = totalDisp < med.estoque_minimo;
                  
                  return (
                    <TableRow key={med.id} className={cn(isCritico && "bg-red-50/50")}>
                      <TableCell className="font-bold text-slate-800">{med.nome}</TableCell>
                      <TableCell className="text-slate-500">{med.dosagem || '-'}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{med.estoque_minimo}</TableCell>
                      <TableCell className={cn("text-right font-black", isCritico ? "text-red-600" : "text-slate-800")}>
                        {totalDisp}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        R$ {med.preco_teto_cmed?.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-bold text-[10px]">{(med.lotes || []).length}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {isCritico ? (
                          <Badge variant="destructive" className="text-[10px] font-bold">CRÍTICO</Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-bold">NORMAL</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="lotes" className="mt-6">
          <TabelaEstoqueFEFO />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EstoquePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-medium">Carregando Estoque e Dados FEFO...</div>}>
      <EstoqueContent />
    </Suspense>
  );
}
