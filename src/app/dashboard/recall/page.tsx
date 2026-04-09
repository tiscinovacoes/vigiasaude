'use client';

import { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Package, 
  Truck, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  ArrowRight
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { api, Lote } from '@/lib/api';

type RecallResult = {
  id: string;
  nome: string;
  lote: string;
  status: string;
  data: string;
};

const MOCK_RECALL_DATA: {
  activeCount: number;
  stockLocked: number;
  inTransit: number;
  patientsNotified: number;
  results: RecallResult[];
} = {
  activeCount: 154,
  stockLocked: 0,
  inTransit: 0,
  patientsNotified: 0,
  results: []
};

export default function RecallPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLote, setSelectedLote] = useState<string | null>(null);
  const [loteData, setLoteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm) return;
    setLoading(true);
    
    try {
      const allLotes = await api.getLotes();
      const match = allLotes.find(l => 
        l.codigo_lote_fabricante.toUpperCase() === searchTerm.toUpperCase() || 
        l.id === searchTerm
      );

      if (match) {
        setSelectedLote(match.codigo_lote_fabricante);
        setLoteData(match);
        toast.error(`Lote ${match.codigo_lote_fabricante} identificado no sistema! Iniciando bloqueio WMS.`);
      } else {
        setSelectedLote(null);
        toast.warning('Nenhum lote crítico encontrado com este ID.');
      }
    } catch (err) {
      toast.error('Erro ao consultar base de rastreabilidade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      
      {/* HEADER DE BUSCA PESADA */}
      <div className="bg-white p-8 rounded-[0.625rem] border shadow-sm space-y-4">
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <ShieldAlert size={32} className="text-[#DC2626] animate-pulse" /> Motor de Recall Sanitário
        </h1>
        <p className="text-slate-500 font-medium">Busca em cascata por Batch ID para bloqueio imediato e notificação de pacientes.</p>
        
        <div className="flex gap-4 max-w-2xl">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Insira o Batch ID (Lote) para Auditoria..." 
                className="pl-12 h-14 text-lg font-bold border-2 focus-visible:ring-[#DC2626]"
              />
           </div>
           <Button onClick={handleSearch} className="h-14 px-8 bg-[#DC2626] hover:bg-red-700 font-bold">Investigar Rastreio</Button>
        </div>
      </div>

      {selectedLote && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          
          {/* DASHBOARD DE IMPACTO */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white p-6 rounded-xl border flex flex-col gap-2">
                <Package className="text-slate-400" size={20}/>
                <h4 className="text-xs font-black text-slate-500 uppercase">Estoque CD</h4>
                <p className="text-3xl font-black text-[#DC2626]">{MOCK_RECALL_DATA.stockLocked}</p>
             </div>
             <div className="bg-white p-6 rounded-xl border flex flex-col gap-2">
                <Truck className="text-slate-400" size={20}/>
                <h4 className="text-xs font-black text-slate-500 uppercase">Em Trânsito</h4>
                <p className="text-3xl font-black text-orange-500">{MOCK_RECALL_DATA.inTransit}</p>
             </div>
             <div className="bg-white p-6 rounded-xl border flex flex-col gap-2">
                <Users className="text-slate-400" size={20}/>
                <h4 className="text-xs font-black text-slate-500 uppercase">Pacientes Expostos</h4>
                <p className="text-3xl font-black text-blue-600">{MOCK_RECALL_DATA.patientsNotified}</p>
             </div>
             <div className="bg-[#DC2626] p-6 rounded-xl border flex flex-col gap-2 shadow-lg shadow-red-200">
                <ShieldAlert className="text-white/80" size={20}/>
                <h4 className="text-xs font-black text-white/70 uppercase">Escopo de Risco</h4>
                <p className="text-3xl font-black text-white">GRAVIDADE 5</p>
             </div>
          </div>

          {/* CONTROLE DE AÇÃO EM ABAS */}
          <Tabs defaultValue="pacientes" className="bg-white p-6 rounded-xl border">
            <TabsList className="mb-6 bg-slate-100 p-1">
              <TabsTrigger value="pacientes" className="gap-2"><Users size={16}/> Pacientes Notificados</TabsTrigger>
              <TabsTrigger value="estoque" className="gap-2"><Package size={16}/> Estoque Bloqueado (WMS)</TabsTrigger>
              <TabsTrigger value="transito" className="gap-2"><Truck size={16}/> Interceptação de Vans</TabsTrigger>
            </TabsList>

            <TabsContent value="pacientes" className="space-y-4">
               <div className="flex justify-between items-center bg-red-50 p-4 rounded-lg border border-red-100">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-600" size={24} />
                    <div>
                      <h4 className="font-bold text-red-900 leading-tight">Ação de Campo Necessária</h4>
                      <p className="text-xs text-red-700">Notificação massiva pendente para 2 pacientes.</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-red-600 hover:bg-red-700 font-bold gap-2">
                        <Lock size={16}/> Disparar Mailing de Alerta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Disparo de Alerta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação enviará SMS e notificações via WhatsApp para todos os pacientes que receberam o lote <strong>{selectedLote}</strong>. O log será gravado na auditoriaAPI com seu CPF.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abortar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600" onClick={() => toast.success('Disparos iniciados via Multi-Channel API.')}>
                          Confirmar Disparo WORM
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
               </div>

               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-12"><Checkbox /></TableHead>
                     <TableHead>Paciente</TableHead>
                     <TableHead>Protocolo Lote</TableHead>
                     <TableHead>Status Sanitário</TableHead>
                     <TableHead>Last Check-in</TableHead>
                     <TableHead className="text-right">Ação</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {MOCK_RECALL_DATA.results.map((res) => (
                     <TableRow key={res.id}>
                       <TableCell><Checkbox /></TableCell>
                       <TableCell className="font-bold text-slate-700">{res.nome}</TableCell>
                       <TableCell className="font-mono text-xs">{res.lote}</TableCell>
                       <TableCell>
                          <Badge variant={res.status.includes('Confirmado') ? 'default' : res.status.includes('SMS') ? 'outline' : 'destructive'}>
                            {res.status}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-xs text-slate-500">{res.data}</TableCell>
                       <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="font-bold text-blue-600 gap-1">
                            Ver prontuário <ArrowRight size={14}/>
                          </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </TabsContent>
          </Tabs>

        </div>
      )}
    </div>
  );
}
