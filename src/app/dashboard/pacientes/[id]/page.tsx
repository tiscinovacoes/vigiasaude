'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  History,
  FileBadge,
  TrendingDown,
  Info
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
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const MOCK_PACIENTE = {
  id: 'PRT-8821',
  nome: 'Benedita Silva Camargo',
  cpf: '445.***.***-09',
  investimentoTotal: 'R$ 12.450,00',
  adesao: 94,
  entregas: [
    { id: 'ENT-992', data: '22/03/2024', status: 'Entregue', motorista: 'Carlos L.', lote: 'LT-2023-B1' },
    { id: 'ENT-981', data: '20/02/2024', status: 'Entregue', motorista: 'João M.', lote: 'LT-2023-A2' },
  ],
  evidencias: [
    { url: 'https://via.placeholder.com/400x300?text=Assinatura+Digital+PRT-8821', legenda: 'Assinatura (22/03)' },
    { url: 'https://via.placeholder.com/400x300?text=Foto+Entrega+Portaria+PRT-8821', legenda: 'Foto Portaria' },
    { url: 'https://via.placeholder.com/400x300?text=Comprovante+S/N+PRT-8821', legenda: 'Serial Number Validado' },
  ]
};

function PacienteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeTab = searchParams.get('tab') || 'timeline';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* HEADER PERFIL */}
      <div className="bg-white p-8 rounded-[0.625rem] border shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <div className="flex gap-6 items-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-100 font-black text-2xl text-emerald-600">BC</div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{MOCK_PACIENTE.nome}</h1>
            <div className="flex gap-3 items-center mt-2">
               <Badge variant="secondary" className="bg-slate-100 text-slate-600">{MOCK_PACIENTE.cpf}</Badge>
               <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50">Ativo / Regular</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="text-right border-l pl-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Investimento Acumulado</p>
              <h3 className="text-2xl font-black text-[#1E3A8A]">{MOCK_PACIENTE.investimentoTotal}</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Economia CMED: 12%</p>
           </div>
           <div className="text-right border-l pl-6 min-w-[140px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Índice de Adesão</p>
              <div className="flex items-center gap-2">
                 <Progress value={MOCK_PACIENTE.adesao} className="h-2 w-20 bg-slate-100" />
                 <span className="text-lg font-black text-slate-800">{MOCK_PACIENTE.adesao}%</span>
              </div>
           </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="bg-white p-8 rounded-[0.625rem] border shadow-sm">
        <TabsList className="bg-slate-50 p-1 mb-8">
           <TabsTrigger value="timeline" className="gap-2 font-bold"><History size={16}/> Histórico de Entregas</TabsTrigger>
           <TabsTrigger value="evidencias" className="gap-2 font-bold"><ShieldCheck size={16}/> Auditoria Jurídica (Fotos)</TabsTrigger>
           <TabsTrigger value="recall" className="gap-2 font-bold"><AlertTriangle size={16}/> Impacto Recall</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
           <Table>
              <TableHeader className="bg-slate-50">
                 <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {MOCK_PACIENTE.entregas.map((ent) => (
                    <TableRow key={ent.id}>
                       <TableCell className="font-mono font-bold text-slate-600">{ent.id}</TableCell>
                       <TableCell>{ent.data}</TableCell>
                       <TableCell>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{ent.status}</Badge>
                       </TableCell>
                       <TableCell>{ent.motorista}</TableCell>
                       <TableCell>{ent.lote}</TableCell>
                       <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-blue-600"><FileBadge size={18}/></Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver Assinatura Digital</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                       </TableCell>
                    </TableRow>
                 ))}
              </TableBody>
           </Table>
        </TabsContent>

        <TabsContent value="evidencias">
           <div className="max-w-2xl mx-auto py-12">
              <Carousel className="w-full">
                <CarouselContent>
                   {MOCK_PACIENTE.evidencias.map((ev, index) => (
                     <CarouselItem key={index}>
                        <div className="p-1">
                           <div className="bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200">
                             <img src={ev.url} alt={ev.legenda} className="w-full h-[400px] object-cover" />
                             <div className="p-4 bg-white border-t flex justify-between items-center">
                                <span className="font-bold text-slate-800 text-sm">{ev.legenda}</span>
                                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-emerald-50 text-emerald-700 border-emerald-200">Validado Blockchain</Badge>
                             </div>
                           </div>
                        </div>
                     </CarouselItem>
                   ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
              <div className="mt-8 p-6 bg-slate-50 rounded-xl border-dashed border-2 flex flex-col items-center gap-2 text-slate-400">
                  <ShieldCheck size={32} />
                  <p className="text-xs font-bold uppercase tracking-widest text-center">Toda evidência é associada ao Geotagging e Timestamp do motorista no ato da entrega (Lei 14.063/2020).</p>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="recall" className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
               <ShieldCheck size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Paciente Seguro</h3>
            <p className="text-slate-500 max-w-sm mt-2">Nenhum dos lotes consumidos por esta paciente nos últimos 12 meses está sob alerta de Recall.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PacienteDetalhePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Acessando Prontuário Auditado...</div>}>
      <PacienteContent />
    </Suspense>
  );
}
