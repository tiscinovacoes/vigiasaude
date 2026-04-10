'use client';

import { useEffect, useState } from 'react';
import { api, type Fornecedor, type CompraRegistro } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  ENTREGUE: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  EM_TRANSITO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  EMPENHADO: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  SOLICITADO: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  SUGERIDO: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  DESCARTADO: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function ComprasPage() {
  const [compras, setCompras] = useState<CompraRegistro[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComprasData();
  }, []);

  const fetchComprasData = async () => {
    setLoading(true);
    try {
      const [comprasData, fornsData] = await Promise.all([
        api.getComprasAtivas(),
        api.getFornecedores()
      ]);
      setCompras(comprasData);
      setFornecedores(fornsData);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao buscar dados de compras');
    } finally {
      setLoading(false);
    }
  };

  // Alerta CMED: notifica automaticamente itens acima da tabela
  useEffect(() => {
    if (!loading && compras.length > 0) {
      const acimaCmed = compras.filter((c) => {
        const precoCmed = c.medicamento?.preco_teto_cmed;
        return precoCmed && (c.valor_unitario || 0) > precoCmed;
      });

      if (acimaCmed.length > 0) {
        acimaCmed.forEach((c, i) => {
          setTimeout(() => {
            const val = c.valor_unitario || 0;
            const teto = c.medicamento?.preco_teto_cmed || 1;
            const diff = (((val - teto) / teto) * 100).toFixed(0);
            
            toast.warning(`Preço acima da CMED: ${c.medicamento?.nome || 'Medicamento'}`, {
              description: `Valor: R$ ${val.toFixed(2)} | CMED: R$ ${teto.toFixed(2)} (+${diff}%) - Vigia Saúde`,
              duration: 6000,
            });
          }, i * 1500);
        });
      }
    }
  }, [compras, loading]);

  const leadTimeData = fornecedores.map(f => ({
    fornecedor: f.razao_social.length > 18 ? f.razao_social.substring(0, 18) + '...' : f.razao_social,
    contratual: Math.max(f.lead_time_medio - 2, 3), // Simulação de contratual baseado no real
    real: f.lead_time_medio,
  })).slice(0, 5);

  const calculateLeadTime = (solicitacao: string | null, entrega: string | null) => {
    if (!solicitacao) return null;
    if (!entrega) return null; // 'Pendente' mas mantemos os dias
    return differenceInDays(new Date(entrega), new Date(solicitacao));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A] mb-4" />
        <p className="text-[#64748B] font-medium">Carregando compras do Supabase...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-full pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1E293B]">Controle de Compras</h1>
          <p className="text-[#64748B] mt-1 font-medium">Gestão de aquisições e licitações vigentes</p>
        </div>
        <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white cursor-pointer gap-2">
          <Plus className="w-4 h-4" />
          Nova Compra
        </Button>
      </div>

      {/* Table */}
      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Medicamento</th>
                  <th className="text-left py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Fornecedor</th>
                  <th className="text-left py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Solicitação</th>
                  <th className="text-left py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Entrega Prev.</th>
                  <th className="text-right py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Lead Time</th>
                  <th className="text-right py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Valor Unit.</th>
                  <th className="text-right py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Preço CMED</th>
                  <th className="text-center py-3 px-6 text-[#64748B] text-xs font-black tracking-wider uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compras.map((c) => {
                  const valorUnitario = c.valor_unitario || 0;
                  const precoCmed = c.medicamento?.preco_teto_cmed || null;
                  const acimaCmed = precoCmed && valorUnitario > precoCmed;
                  const cfg = statusConfig[c.status] || statusConfig.SOLICITADO;
                  const leadTime = calculateLeadTime(c.data_solicitacao, c.data_entrega_prevista);

                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        "hover:bg-[#F8FAFC] transition-colors",
                         acimaCmed ? "bg-red-50/50" : ""
                      )}
                    >
                      <td className="py-4 px-6 text-[#1E293B] font-bold">
                        <div className="flex items-center gap-2">
                          {c.medicamento?.nome || 'Desconhecido'}
                          {acimaCmed && <span title="Preço acima da tabela CMED"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /></span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#64748B] text-sm">{c.fornecedor?.razao_social || '-'}</td>
                      <td className="py-4 px-6 text-[#64748B] text-sm">
                        {c.data_solicitacao ? new Date(c.data_solicitacao).toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="py-4 px-6 text-[#64748B] text-sm">
                        {c.data_entrega_prevista ? new Date(c.data_entrega_prevista).toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="py-4 px-6 text-right text-[#1E293B] font-bold text-sm">
                        {leadTime !== null ? `${leadTime}d` : "-"}
                      </td>
                      <td className={cn("py-4 px-6 text-right font-black", acimaCmed ? "text-red-600" : "text-[#1E293B]")}>
                        R$ {valorUnitario.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right text-[#64748B] text-sm">
                        {precoCmed ? `R$ ${precoCmed.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge className={`${cfg.bg} ${cfg.text} ${cfg.border} border hover:bg-transparent shadow-none px-2.5 py-0.5 font-bold`}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {compras.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#64748B]">
                      Nenhuma compra registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lead Time por Fornecedor */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-[#1E293B] flex items-center gap-2 font-black tracking-tight">
            Tempo Médio de Reposição por Fornecedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full min-h-[288px]">
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={leadTimeData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis key="xaxis" type="number" tick={{ fill: "#64748B", fontSize: 12 }} unit=" dias" />
                <YAxis key="yaxis" dataKey="fornecedor" type="category" tick={{ fill: "#64748B", fontSize: 12, fontWeight: 'bold' }} width={120} axisLine={false} tickLine={false} />
                <Tooltip key="tooltip" contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend key="legend" iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar key="bar-contratual" dataKey="contratual" name="Prazo Contratual" fill="#94A3B8" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar key="bar-real" dataKey="real" name="Prazo Real Médio" fill="#1E3A8A" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
