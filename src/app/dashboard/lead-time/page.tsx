'use client';

import { 
  Timer, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Filter,
  Download,
  Calendar,
  Zap,
  PackageCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';

const MOCK_LEAD_TIME_HISTORY = [
  { day: 'Seg', real: 4.2, meta: 5.0 },
  { day: 'Ter', real: 5.8, meta: 5.0 },
  { day: 'Qua', real: 4.5, meta: 5.0 },
  { day: 'Qui', real: 3.9, meta: 5.0 },
  { day: 'Sex', real: 7.2, meta: 5.0 },
  { day: 'Sab', real: 5.1, meta: 5.0 },
  { day: 'Dom', real: 4.8, meta: 5.0 },
];

const MOCK_BY_CATEGORY = [
  { category: 'Antibióticos', tempo: 3.5 },
  { category: 'Psicotrópicos', tempo: 12.8 },
  { category: 'Insulinas', tempo: 2.1 },
  { category: 'Injetáveis', tempo: 5.4 },
  { category: 'Soros', tempo: 8.9 },
];

export default function LeadTimePage() {
  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Análise de Lead Time</h1>
          <p className="text-slate-500 font-medium">Eficiência logística e identificação de gargalos no ciclo de suprimentos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-600">
            <Calendar className="mr-2 h-4 w-4" /> Útimos 30 Dias
          </Button>
          <Button className="bg-[#1A2B6D] hover:bg-[#121f4f] rounded-xl shadow-lg font-bold">
            <Download className="mr-2 h-4 w-4" /> Exportar BI
          </Button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lead Time Médio</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">4.8d</h3>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                <TrendingDown size={14} /> -1.2d
              </span>
            </div>
          </div>
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Timer size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ciclo de Empenho</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">1.5d</h3>
              <span className="text-xs font-bold text-red-500 flex items-center gap-0.5">
                <TrendingUp size={14} /> +0.3d
              </span>
            </div>
          </div>
          <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
            <Zap size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taxa de Pontualidade</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">92%</h3>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                <TrendingUp size={14} /> +4%
              </span>
            </div>
          </div>
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <PackageCheck size={28} />
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LINE CHART: Historical Performance */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-lg font-black text-slate-800">Performance Diária vs Meta</CardTitle>
            <CardDescription className="text-slate-400 font-medium">Histórico de tempo de entrega real em dias.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_LEAD_TIME_HISTORY}>
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="real" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorReal)" name="Real" />
                <Line type="monotone" dataKey="meta" stroke="#94a3b8" strokeDasharray="5 5" name="Meta Estipulada" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* BAR CHART: By Category */}
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-lg font-black text-slate-800">Lag por Categoria</CardTitle>
            <CardDescription className="text-slate-400 font-medium">Médias de tempo em dias.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_BY_CATEGORY} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} width={80} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="tempo" fill="#1A2B6D" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* CRITICAL ALERTS & ANALYSIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <div className="bg-red-50 border border-red-100 p-6 rounded-3xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black text-red-800">Gargalo Detectado: Psicotrópicos</h4>
              <p className="text-sm font-medium text-red-700 mt-1">O tempo médio de espera para psicotrópicos subiu para **12.8 dias**. Isso representa um aumento de 45% em relação ao mês anterior.</p>
              <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-4 py-2 text-xs">
                INVESTIGAR FORNECEDORES <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black text-emerald-800">Eficiência Máxima: Insulinas</h4>
              <p className="text-sm font-medium text-emerald-700 mt-1">O lead time de insulinas atingiu a marca histórica de **2.1 dias**, devido à nova rota logística rápida implementada semana passada.</p>
              <Badge className="mt-4 bg-emerald-600 text-white border-none px-3 py-1 text-[10px] font-black uppercase">Meta Batida</Badge>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
