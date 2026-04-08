'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  AlertOctagon, Clock, TrendingDown, DollarSign, 
  Users, UserPlus, Activity, Truck, AlertTriangle,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const MOCK_CHART_DATA = [
  { month: 'Out', entrada: 4000, consumo: 2400 },
  { month: 'Nov', entrada: 3000, consumo: 1398 },
  { month: 'Dez', entrada: 2000, consumo: 9800 },
  { month: 'Jan', entrada: 2780, consumo: 3908 },
  { month: 'Fev', entrada: 1890, consumo: 4800 },
  { month: 'Mar', entrada: 2390, consumo: 3800 },
];

const MOCK_SUPPLIERS = [
  { id: '1', nome: 'MedSupply Nacional Ltda', pontualidade: 98, lead_time: 4, compras: 145 },
  { id: '2', nome: 'FarmaLog Distribuidora', pontualidade: 92, lead_time: 7, compras: 89 },
  { id: '3', nome: 'Global Health BR', pontualidade: 85, lead_time: 12, compras: 230 },
];

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulando carregamento dinâmico via api.ts (que tem fallback mock)
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
           <Skeleton className="col-span-2 h-[400px] rounded-2xl" />
           <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      
      {/* HEADER ESTRATÉGICO */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Executivo</h1>
          <p className="text-slate-500 font-medium mt-1">Monitoramento de Segurança Sanitária e Eficiência Logística</p>
        </div>
        <Badge variant="outline" className="h-8 px-4 bg-white border-slate-200 text-slate-500 gap-2 font-bold uppercase tracking-widest text-[10px]">
          <Activity size={14} className="text-emerald-500" /> Live: Municipio Teste-MS
        </Badge>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem 
           title="Estoque Crítico" 
           value="12" 
           trend="+2" 
           icon={AlertOctagon} 
           color="destructive" 
           desc="Itens abaixo do mínimo" 
        />
        <KPIItem 
           title="Lead Time Médio" 
           value="4.2d" 
           trend="-0.5d" 
           icon={Clock} 
           color="primary" 
           desc="Geral dos fornecedores" 
        />
        <KPIItem 
           title="Economia CMED" 
           value="R$ 125k" 
           trend="+12%" 
           icon={DollarSign} 
           color="success" 
           desc="Mês atual vs Tabela" 
        />
        <KPIItem 
           title="Entregas Ativas" 
           value="45" 
           trend="12 Vans" 
           icon={Truck} 
           color="info" 
           desc="Em rota agora" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* GRÁFICO DE CONSUMO */}
        <Card className="xl:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
               <TrendingUp className="text-emerald-500" size={20}/> Performance de Abastecimento
            </CardTitle>
            <CardDescription>Fluxo mensal de Entrada vs Consumo Dispensado</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CHART_DATA}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                   <RechartsTooltip 
                     cursor={{fill: '#f8fafc'}}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar dataKey="entrada" name="Entrada" fill="#1E3A8A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   <Bar dataKey="consumo" name="Consumo" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RISK PANEL */}
        <Card className="border-none shadow-sm">
           <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2 text-[#DC2626]">
                 <AlertTriangle size={20} className="animate-pulse" /> Risco de Ruptura
              </CardTitle>
              <CardDescription>Medicamentos com cobertura inferior a 5 dias</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              {[
                { nome: 'Insulina NPH 100UI', stock: 150, min: 500, days: 2 },
                { nome: 'Sinvastatina 20mg', stock: 1200, min: 2000, days: 5 },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                   <div>
                      <h4 className="font-bold text-sm text-slate-800">{item.nome}</h4>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-black text-red-600 uppercase">Apenas {item.days} dias</span>
                         <div className="w-1 h-1 bg-slate-300 rounded-full" />
                         <span className="text-[10px] font-bold text-slate-500">{item.stock} / {item.min} un</span>
                      </div>
                   </div>
                   <ArrowUpRight size={18} className="text-slate-300 group-hover:text-red-500 transition-colors" />
                </div>
              ))}
           </CardContent>
        </Card>
      </div>

      {/* RANKING FORNECEDORES */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white">
           <CardTitle className="text-lg font-black">Performance de Fornecedores</CardTitle>
           <CardDescription>Ranking auditado por pontualidade e conformidade fiscal (CMED)</CardDescription>
        </CardHeader>
        <Table>
           <TableHeader className="bg-slate-50">
              <TableRow>
                 <TableHead>Fornecedor</TableHead>
                 <TableHead>Pontualidade</TableHead>
                 <TableHead>Lead Time</TableHead>
                 <TableHead className="text-right">Ações</TableHead>
              </TableRow>
           </TableHeader>
           <TableBody>
              {MOCK_SUPPLIERS.map((forn) => (
                <TableRow key={forn.id}>
                   <TableCell className="font-bold text-slate-700">{forn.nome}</TableCell>
                   <TableCell className="w-64">
                      <div className="flex items-center gap-3">
                         <Progress value={forn.pontualidade} className="h-1.5 flex-1" />
                         <span className="text-xs font-black text-slate-600">{forn.pontualidade}%</span>
                      </div>
                   </TableCell>
                   <TableCell>
                      <Badge variant="secondary" className="font-bold text-[10px]">{forn.lead_time} DIAS</Badge>
                   </TableCell>
                   <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="font-bold text-[#1E3A8A]">Auditar Pedidos</Button>
                   </TableCell>
                </TableRow>
              ))}
           </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function KPIItem({ title, value, trend, icon: Icon, color, desc }: any) {
   const colors: any = {
      destructive: "text-red-600 bg-red-50 border-red-100",
      primary: "text-blue-600 bg-blue-50 border-blue-100",
      success: "text-emerald-600 bg-emerald-50 border-emerald-100",
      info: "text-cyan-600 bg-cyan-50 border-cyan-100",
   };

   return (
      <div className={cn("p-6 rounded-2xl bg-white border shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow", colors[color])}>
         <div className="p-3 rounded-xl bg-white border shadow-sm">
            <Icon size={24} />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
               <h3 className="text-2xl font-black text-slate-800">{value}</h3>
               <span className={cn("text-[10px] font-black", color === 'destructive' ? 'text-red-500' : 'text-emerald-500')}>{trend}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1">{desc}</p>
         </div>
      </div>
   );
}
