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
  Package,
  ClipboardList,
  CheckCircle2,
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
import Link from 'next/link';

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
          {dataSource === 'live' ? 'Ao Vivo: Supabase Conectado' : 'Modo: Dados Locais'}
        </Badge>
      </div>

      {/* KPI GRID — Indicadores de Estoque */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Indicadores de Estoque</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIItem
            title="Estoque Crítico"
            value={kpis?.estoqueCritico?.toString() || '0'}
            trend={kpis && kpis.estoqueCritico > 0 ? `${kpis.estoqueCritico} itens` : 'OK'}
            icon={AlertOctagon}
            color={kpis && kpis.estoqueCritico > 0 ? 'destructive' : 'success'}
            desc="Medicamentos abaixo do mínimo"
            href="/dashboard/estoque"
          />
          <KPIItem
            title="Previsão Ruptura 7d"
            value={kpis?.riscoRupturaCount?.toString() || '0'}
            trend="Itens em risco"
            icon={TrendingDown}
            color={kpis && kpis.riscoRupturaCount > 0 ? 'warning' : 'success'}
            desc="Itens com cobertura < 7 dias"
            href="/dashboard/estoque"
          />
          <KPIItem
            title="Lead Time Médio"
            value={kpis?.leadTimeMedio ? `${kpis.leadTimeMedio}d` : '0d'}
            trend="Fornecedores"
            icon={Clock}
            color="primary"
            desc="Geral dos fornecedores"
            href="/dashboard/lead-time"
          />
          <KPIItem
            title="Lotes Próx. Vencimento"
            value={kpis?.lotesVencimentoProximo?.toString() || '0'}
            trend={kpis && kpis.lotesVencimentoProximo > 0 ? 'Atenção' : 'OK'}
            icon={Package}
            color={kpis && kpis.lotesVencimentoProximo > 0 ? 'warning' : 'success'}
            desc="Vencimento em menos de 90 dias"
            href="/dashboard/estoque"
          />
        </div>
      </div>

      {/* KPI GRID — Cuidado ao Paciente */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Cuidado ao Paciente</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIItem
            title="Pacientes Ativos"
            value={kpis?.totalPacientes?.toString() || '0'}
            trend="Cadastrados"
            icon={Users}
            color="success"
            desc="No sistema"
            href="/dashboard/pacientes"
          />
          <KPIItem
            title="Pendentes / Fila"
            value={kpis?.entregasAtivas?.toString() || '0'}
            trend="Aguardando entrega"
            icon={ClipboardList}
            color="warning"
            desc="Receitas aguardando entrega"
            href="/dashboard/entregas"
          />
          <KPIItem
            title="Entregas Concluídas"
            value={kpis?.entregasConcluidas?.toString() || '0'}
            trend="No período"
            icon={CheckCircle2}
            color="success"
            desc="Entregas finalizadas com sucesso"
            href="/dashboard/entregas"
          />
          <KPIItem
            title="Em Rota"
            value={kpis?.entregasAtivas?.toString() || '0'}
            trend="Entregadores ativos"
            icon={Truck}
            color="info"
            desc="Entregadores nas ruas agora"
            href="/dashboard/monitoramento"
          />
        </div>
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
                {kpis && kpis.riscoRupturaCount > 0 
                  ? `${kpis.riscoRupturaCount} medicamentos com estoque < 7 dias`
                  : 'Lotes com cobertura inferior a 90 dias'
                }
              </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              {kpis && kpis.riscoRupturaCount > 0 ? (
                <Link href="/dashboard/estoque?tab=risco" className="p-4 rounded-xl bg-red-50 border border-red-100 flex justify-between items-center group cursor-pointer hover:bg-white hover:shadow-md transition-all">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{kpis.riscoRupturaCount} medicamentos em risco crítico</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-red-600 uppercase">Estoque para menos de 7 dias</span>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
                </Link>
              ) : (
                <Link href="/dashboard/estoque" className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center group cursor-pointer hover:bg-white hover:shadow-md transition-all">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Tudo sob controle</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Nenhum item crítico</span>
                    </div>
                  </div>
                  <Package size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                </Link>
              )}
              {kpis && kpis.lotesVencimentoProximo > 0 && (
                <Link href="/dashboard/estoque?tab=lotes" className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all cursor-pointer">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Vencimento Próximo</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-orange-600 uppercase">{kpis.lotesVencimentoProximo} lotes com validade &lt; 90 dias</span>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-slate-300 group-hover:text-orange-500 group-hover:scale-110 transition-all" />
                </Link>
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
                   <TableHead className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Fornecedor</TableHead>
                   <TableHead className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Performance</TableHead>
                   <TableHead className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Status Ranking</TableHead>
                   <TableHead className="font-bold text-slate-800 uppercase text-[10px] tracking-widest text-center">Lead Time</TableHead>
                   <TableHead className="text-right font-bold text-slate-800 uppercase text-[10px] tracking-widest">Total Contratado</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {fornecedores.slice(0, 5).map((forn) => (
                  <TableRow key={forn.id} className="group hover:bg-slate-50/80 transition-colors">
                     <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 leading-none">{forn.razao_social}</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tighter">{forn.cnpj}</span>
                        </div>
                     </TableCell>
                     <TableCell className="w-48">
                        <div className="flex items-center gap-3">
                           <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className={cn(
                                 "h-full rounded-full transition-all duration-1000",
                                 forn.pontualidade_percentual >= 95 ? "bg-emerald-500" :
                                 forn.pontualidade_percentual >= 85 ? "bg-blue-500" : "bg-orange-500"
                               )} 
                               style={{ width: `${forn.pontualidade_percentual}%` }} 
                             />
                           </div>
                           <span className="text-xs font-black text-slate-600">{forn.pontualidade_percentual}%</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        {forn.pontualidade_percentual >= 95 ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-black uppercase">EXCELENTE</Badge>
                        ) : forn.pontualidade_percentual >= 85 ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-black uppercase">CONFIÁVEL</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-100 text-[10px] font-black uppercase">EM ALERTA</Badge>
                        )}
                     </TableCell>
                     <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <span className="font-bold text-slate-700 text-sm">{forn.lead_time_medio} <span className="text-[10px] text-slate-400 font-medium">DIAS</span></span>
                        </div>
                     </TableCell>
                     <TableCell className="text-right">
                        <span className="font-black text-slate-800">
                          R$ {forn.valor_total_contratado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
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

function KPIItem({ title, value, trend, icon: Icon, color, desc, href }: any) {
   const colors: any = {
      destructive: "text-red-600 bg-red-50 border-red-100",
      primary: "text-blue-600 bg-blue-50 border-blue-100",
      success: "text-emerald-600 bg-emerald-50 border-emerald-100",
      info: "text-cyan-600 bg-cyan-50 border-cyan-100",
      warning: "text-amber-600 bg-amber-50 border-amber-100",
   };

   const Content = (
      <div className={cn("p-6 rounded-2xl bg-white border shadow-sm flex items-start gap-4 transition-all duration-200", href ? "hover:shadow-md group" : "", colors[color])}>
         <div className={cn("p-3 rounded-xl bg-white border shadow-sm transition-transform duration-200", href ? "group-hover:scale-105" : "")}>
            <Icon size={24} />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
               <h3 className="text-2xl font-black text-slate-800">{value}</h3>
               <span className={cn("text-[10px] font-black", color === 'destructive' ? 'text-red-500' : color === 'warning' ? 'text-amber-500' : 'text-emerald-500')}>{trend}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1">{desc}</p>
         </div>
      </div>
   );

   if (href) {
      return (
         <Link href={href} className="block w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] rounded-2xl">
            {Content}
         </Link>
      );
   }

   return Content;
}
