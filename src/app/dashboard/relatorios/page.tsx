'use client';

import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  FileSpreadsheet,
  FileCode,
  Calendar
} from 'lucide-react';
import { 
  Menubar, 
  MenubarContent, 
  MenubarItem, 
  MenubarMenu, 
  MenubarSeparator, 
  MenubarShortcut, 
  MenubarTrigger 
} from '@/components/ui/menubar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MOCK_REPORTS = [
  { id: 'REP-001', nome: 'Extrato CMED Mensal', tipo: 'Financeiro', data: '2024-03-25', status: 'Pronto' },
  { id: 'REP-002', nome: 'Inventário de Bordo (Lote/Serial)', tipo: 'Logístico', data: '2024-03-25', status: 'Processando' },
  { id: 'REP-003', nome: 'Auditoria de Assinaturas Digitais', tipo: 'Compliance', data: '2024-03-24', status: 'Arquivado' },
];

export default function RelatoriosPage() {
  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Central de Relatórios WORM</h1>
          <p className="text-slate-500 font-medium">Extração de dados imutáveis para auditoria governamental.</p>
        </div>
        <Menubar className="bg-white px-2 h-12 shadow-sm border-2">
          <MenubarMenu>
            <MenubarTrigger className="font-bold gap-2"><Download size={16}/> Exportar Global</MenubarTrigger>
            <MenubarContent>
               <MenubarItem className="gap-2"><FileText size={14}/> PDF Document (.pdf) <MenubarShortcut>⌘P</MenubarShortcut></MenubarItem>
               <MenubarItem className="gap-2"><FileSpreadsheet size={14}/> Excel Sheet (.xlsx) <MenubarShortcut>⌘E</MenubarShortcut></MenubarItem>
               <MenubarSeparator />
               <MenubarItem className="gap-2"><FileCode size={14}/> Dados Brutos (.csv) <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="font-bold gap-2 text-slate-400"><Calendar size={16}/> Período</MenubarTrigger>
            <MenubarContent>
               <MenubarItem>Últimos 30 dias</MenubarItem>
               <MenubarItem>Este Trimestre</MenubarItem>
               <MenubarSeparator />
               <MenubarItem>Personalizado...</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      <div className="bg-white rounded-[0.625rem] border shadow-sm p-6 space-y-6">
         <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2">
               <ToggleGroup type="single" defaultValue="todos" className="border rounded-lg p-1 bg-slate-50">
                  <ToggleGroupItem value="todos" className="font-bold text-xs uppercase px-4 h-8">Todos</ToggleGroupItem>
                  <ToggleGroupItem value="fin" className="font-bold text-xs uppercase px-4 h-8">Financeiro</ToggleGroupItem>
                  <ToggleGroupItem value="log" className="font-bold text-xs uppercase px-4 h-8">Logístico</ToggleGroupItem>
               </ToggleGroup>
            </div>
            <div className="relative w-full md:w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <Input placeholder="Buscar por ID de relatório..." className="pl-10 h-10 border-slate-200" />
            </div>
         </div>

         <Table>
            <TableHeader className="bg-slate-50">
               <TableRow>
                  <TableHead>Protocolo ID</TableHead>
                  <TableHead>Nome do Relatório</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Geração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {MOCK_REPORTS.map((rep) => (
                 <TableRow key={rep.id}>
                    <TableCell className="font-mono font-bold text-slate-600">{rep.id}</TableCell>
                    <TableCell className="font-medium">{rep.nome}</TableCell>
                    <TableCell>
                       <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100">{rep.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">{rep.data}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", rep.status === 'Pronto' ? 'bg-emerald-500' : rep.status === 'Processando' ? 'bg-orange-500 animate-pulse' : 'bg-slate-400')} />
                          <span className="text-xs font-bold">{rep.status}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button 
                        variant="outline" 
                        size="sm" 
                        className="font-bold text-[#1E3A8A] hover:bg-blue-50"
                        onClick={() => toast.success(`Download do ${rep.id} iniciado.`)}
                       >
                         Download
                       </Button>
                    </TableCell>
                 </TableRow>
               ))}
            </TableBody>
         </Table>

         {/* PAGINAÇÃO SIMULADA */}
         <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-slate-500">Exibindo 3 de 15 relatórios</p>
            <div className="flex gap-2">
               <Button variant="outline" size="sm" disabled>Anterior</Button>
               <Button variant="outline" size="sm">Próximo</Button>
            </div>
         </div>
      </div>
    </div>
  );
}
