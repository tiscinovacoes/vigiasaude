'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, AlertCircle, Calendar, 
  Truck, CheckCircle2, Factory, ScrollText
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// === Typings ===
type CompraRecord = {
  id: string;
  medicamento: string;
  fornecedor: string;
  data_solicitacao: string;
  data_empenho: string | null;
  data_entrega: string | null;
  status: 'Entregue' | 'Em Trânsito' | 'Aguardando Empenho' | 'Solicitado';
  valor_unitario: number;
  preco_cmed: number;
};

type ToastAlert = {
  id: string;
  message: string;
  excedente: number;
};

// === Mock Data (Fallback) ===
const MOCK_COMPRAS: CompraRecord[] = [
  { id: 'C001', medicamento: 'Sinvastatina 20mg', fornecedor: 'MedSupply Nacional Ltda', data_solicitacao: '2023-10-01', data_empenho: '2023-10-03', data_entrega: '2023-10-10', status: 'Entregue', valor_unitario: 1.80, preco_cmed: 1.50 },
  { id: 'C002', medicamento: 'Losartana Potássica 50mg', fornecedor: 'FarmaLog Distribuidora', data_solicitacao: '2023-10-05', data_empenho: '2023-10-07', data_entrega: null, status: 'Em Trânsito', valor_unitario: 0.45, preco_cmed: 0.60 },
  { id: 'C003', medicamento: 'Insulina NPH 100UI/ml', fornecedor: 'Global Health BR', data_solicitacao: '2023-10-14', data_empenho: null, data_entrega: null, status: 'Aguardando Empenho', valor_unitario: 45.00, preco_cmed: 42.00 },
  { id: 'C004', medicamento: 'Dipirona Sódica 500mg', fornecedor: 'MedicaDistribuidora', data_solicitacao: '2023-10-20', data_empenho: null, data_entrega: null, status: 'Solicitado', valor_unitario: 0.35, preco_cmed: 0.40 },
  { id: 'C005', medicamento: 'Amoxicilina 500mg', fornecedor: 'MedSupply Nacional Ltda', data_solicitacao: '2023-09-15', data_empenho: '2023-09-18', data_entrega: '2023-09-28', status: 'Entregue', valor_unitario: 1.20, preco_cmed: 1.15 }
];

const MOCK_CHART_DATA = [
  { supplier: 'MedSupply Nacional', contractual: 15, real: 18 },
  { supplier: 'FarmaLog Dist.', contractual: 10, real: 12 },
  { supplier: 'Global Health BR', contractual: 30, real: 25 },
  { supplier: 'MedicaDist', contractual: 7, real: 7 },
];

export default function ControleCompras() {
  const [compras, setCompras] = useState<CompraRecord[]>(MOCK_COMPRAS);
  const [chartData, setChartData] = useState(MOCK_CHART_DATA);
  const [alerts, setAlerts] = useState<ToastAlert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComprasData();
  }, []);

  const fetchComprasData = async () => {
    setLoading(true);
    try {
      // Logic for DB fetching will go here.
      // Expected: JOIN compras, medicamentos (for cmed), fornecedores.
      
      // Fallback para mock e processamento dos alertas em tempo real
      processarAlertasCmed(MOCK_COMPRAS);
    } catch (e) {
      console.error(e);
      processarAlertasCmed(MOCK_COMPRAS);
    } finally {
      setLoading(false);
    }
  };

  const processarAlertasCmed = (dados: CompraRecord[]) => {
    const novosAlertas: ToastAlert[] = [];
    
    dados.forEach((compra) => {
      if (compra.valor_unitario > compra.preco_cmed) {
        const excedente = ((compra.valor_unitario / compra.preco_cmed) - 1) * 100;
        novosAlertas.push({
          id: compra.id,
          excedente: Math.round(excedente),
          message: `Preço acima da CMED: ${compra.medicamento} | Valor: R$ ${compra.valor_unitario.toFixed(2)} | CMED: R$ ${compra.preco_cmed.toFixed(2)} (+${Math.round(excedente)}%)`
        });
      }
    });

    setAlerts(novosAlertas);
  };

  const calculateLeadTime = (solicitacao: string, entrega: string | null) => {
    if (!entrega) return 'Pendente';
    const diff = differenceInDays(new Date(entrega), new Date(solicitacao));
    return `${diff} dias`;
  };

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const renderStatus = (status: CompraRecord['status']) => {
    const config = {
      'Entregue': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
      'Em Trânsito': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Truck },
      'Aguardando Empenho': { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle },
      'Solicitado': { bg: 'bg-slate-100', text: 'text-slate-700', icon: ScrollText }
    };

    const StatusIcon = config[status].icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${config[status].bg} ${config[status].text} rounded-md text-[11px] font-bold uppercase tracking-wider`}>
        <StatusIcon size={12} /> {status}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50/50 min-h-full pb-20 relative">
      
      {/* HEADER & TOAST CONTAINER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Controle de Compras</h1>
          <p className="text-sm text-slate-500 mt-1">Monitoramento de Aquisições e Validador Fiscal (CMED)</p>
        </div>
        
        {/* Toast Alerts (Top Right) */}
        <div className="flex flex-col gap-2 max-w-sm z-50">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl shadow-md flex items-start gap-3 animate-in slide-in-from-right-10 fade-in">
              <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-orange-900 text-sm">Alerta de Preço Fiscal</p>
                <p className="text-xs text-orange-800 mt-1 font-medium leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHARTS LAYER */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT CHART: Lead Time Performance */}
        <div className="xl:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Factory size={18} className="text-slate-400" />
            Performance de Fornecedores
          </h2>
          <div className="h-[300px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="supplier" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} width={120} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="contractual" name="Prazo Contratual" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="real" name="Prazo Real (Lead Time)" fill="#f97316" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: TRACKING TABLE */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ScrollText size={18} className="text-blue-500" />
              Acompanhamento de Ciclo de Vida e CMED
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Medicamento</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Fornecedor</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Datas / Lead Time</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">Valores (Unit / CMED)</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compras.map((compra) => {
                  const isAboveCmed = compra.valor_unitario > compra.preco_cmed;
                  
                  return (
                    <tr key={compra.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${isAboveCmed ? 'text-red-600' : 'text-slate-800'}`}>
                            {compra.medicamento}
                          </p>
                          {isAboveCmed && <AlertTriangle size={14} className="text-red-500" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Cód. {compra.id}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700 font-medium">{compra.fornecedor}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 text-[11px]">
                          <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400"/> Sol: {format(new Date(compra.data_solicitacao), 'dd/MM/yyyy')}</span>
                          {compra.data_entrega && (
                            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                              <Truck size={12}/> Ent: {format(new Date(compra.data_entrega), 'dd/MM/yyyy')}
                            </span>
                          )}
                          <span className="mt-1 font-bold text-slate-600 border-t border-slate-100 pt-1">
                            LT: {calculateLeadTime(compra.data_solicitacao, compra.data_entrega)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className={`font-bold ${isAboveCmed ? 'text-red-600' : 'text-slate-800'}`}>
                          {formatCurrency(compra.valor_unitario)}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                          TETO: {formatCurrency(compra.preco_cmed)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {renderStatus(compra.status)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
