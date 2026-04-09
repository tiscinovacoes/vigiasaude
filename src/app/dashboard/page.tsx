'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  AlertOctagon, Clock, TrendingDown, DollarSign, 
  Users, UserPlus, Activity, Truck, AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Package
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
import { api, type Fornecedor, type KpisDashboard } from '@/lib/api';
import { cn } from '@/lib/utils';

const FALLBACK_CHART_DATA = [
  { month: 'Out', entrada: 4000, consumo: 2400 },
  { month: 'Nov', entrada: 3000, consumo: 1398 },
  { month: 'Dez', entrada: 2000, consumo: 9800 },
  { month: 'Jan', entrada: 2780, consumo: 3908 },
  { month: 'Fev', entrada: 1890, consumo: 4800 },
  { month: 'Mar', entrada: 2390, consumo: 3800 },
];

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpisDashboard | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [chartData, setChartData] = useState(FALLBACK_CHART_DATA);
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('fallback');
  
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Carregar KPIs
      const kpisData = await api.getKpisDashboard();
      setKpis(kpisData);

      // Carregar fornecedores
      const fornsData = await api.getFornecedores();
      if (fornsData.length > 0) {
        setFornecedores(fornsData);
        setDataSource('live');
      }

      // Carregar dados do gráfico
      const consumoData = await api.getConsumoMensal();
      if (consumoData.length > 0) {
        setChartData(consumoData);
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <Badge variant="outline" className={cn(
          "h-8 px-4 bg-white border-slate-200 gap-2 font-bold uppercase tracking-widest text-[10px]",
          dataSource === 'live' ? 'text-emerald-600 border-emerald-200' : 'text-slate-500'
        )}>
          <Activity size={14} className={dataSource === 'live' ? 'text-emerald-500' : 'text-orange-400'} />
          {dataSource === 'live' ? 'Live: Supabase Conectado' : 'Modo: Dados Locais'}
        </Badge>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem 
           title="Estoque Crítico" 
           value={kpis?.estoqueCritico?.toString() || '0'} 
           trend={kpis && kpis.estoqueCritico > 0 ? `${kpis.estoqueCritico} itens` : 'OK'} 
           icon={AlertOctagon} 
           color={kpis && kpis.estoqueCritico > 0 ? 'destructive' : 'success'} 
           desc="Itens abaixo do mínimo" 
        />
        <KPIItem 
           title="Lead Time Médio" 
           value={kpis?.leadTimeMedio ? `${kpis.leadTimeMedio}d` : '0d'} 
           trend="Fornecedores" 
           icon={Clock} 
           color="primary" 
           desc="Geral dos fornecedores" 
        />
        <KPIItem 
           title="Pacientes Ativos" 
           value={kpis?.totalPacientes?.toString() || '0'} 
           trend="Cadastrados" 
           icon={Users} 
           color="success" 
           desc="No sistema" 
        />
        <KPIItem 
           title="Entregas Ativas" 
           value={kpis?.entregasAtivas?.toString() || '0'} 
           trend={`${kpis?.entregasConcluidas || 0} concluídas`} 
           icon={Truck} 
           color="info" 
           desc="Em rota ou pendentes" 
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
                <BarChart data={chartData}>
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
              <CardDescription>
                {kpis && kpis.lotesVencimentoProximo > 0 
                  ? `${kpis.lotesVencimentoProximo} lotes com vencimento em até 90 dias`
                  : 'Lotes com cobertura inferior a 90 dias'
                }
              </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              {kpis && kpis.estoqueCritico > 0 ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{kpis.estoqueCritico} medicamentos em risco</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-red-600 uppercase">Estoque abaixo do mínimo</span>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-red-500" />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Tudo sob controle</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Nenhum item crítico</span>
                    </div>
                  </div>
                  <Package size={18} className="text-emerald-500" />
                </div>
              )}
              {kpis && kpis.lotesVencimentoProximo > 0 && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Vencimento Próximo</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-orange-600 uppercase">{kpis.lotesVencimentoProximo} lotes com validade &lt; 90 dias</span>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                </div>
              )}
           </CardContent>
        </Card>
      </div>

      {/* RANKING FORNECEDORES */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white">
           <CardTitle className="text-lg font-black">Performance de Fornecedores</CardTitle>
           <CardDescription>
             {fornecedores.length > 0 
               ? `Ranking auditado — ${fornecedores.length} fornecedores cadastrados`
               : 'Nenhum fornecedor cadastrado no sistema'
             }
           </CardDescription>
        </CardHeader>
        {fornecedores.length > 0 ? (
          <Table>
             <TableHeader className="bg-slate-50">
                <TableRow>
                   <TableHead>Fornecedor</TableHead>
                   <TableHead>CNPJ</TableHead>
                   <TableHead>Pontualidade</TableHead>
                   <TableHead>Lead Time</TableHead>
                   <TableHead className="text-right">Valor Contratado</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {fornecedores.slice(0, 5).map((forn) => (
                  <TableRow key={forn.id}>
                     <TableCell className="font-bold text-slate-700">{forn.razao_social}</TableCell>
                     <TableCell className="font-mono text-xs text-slate-500">{forn.cnpj}</TableCell>
                     <TableCell className="w-64">
                        <div className="flex items-center gap-3">
                           <Progress value={forn.pontualidade_percentual} className="h-1.5 flex-1" />
                           <span className="text-xs font-black text-slate-600">{forn.pontualidade_percentual}%</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge variant="secondary" className="font-bold text-[10px]">{forn.lead_time_medio} DIAS</Badge>
                     </TableCell>
                     <TableCell className="text-right font-bold text-slate-700">
                        R$ {forn.valor_total_contratado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </TableCell>
                  </TableRow>
                ))}
             </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-bold">Nenhum fornecedor cadastrado</p>
            <p className="text-sm mt-1">Cadastre fornecedores para visualizar o ranking de performance.</p>
          </div>
        )}
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
