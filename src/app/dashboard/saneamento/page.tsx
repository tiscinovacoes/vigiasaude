'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, auditoriaAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface SaneamentoStatus {
  total_pacientes: number;
  cns_valido: number;
  cns_ausente: number;
  cns_invalido: number;
  percentual_integridade: number;
}

export default function SaneamentoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SaneamentoStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      setIsLoading(true);
      try {
        const dados = await api.getSaneamentoStatus();
        setStatus(dados);

        // Log auditoria
        await auditoriaAPI.log('ACESSO_DASHBOARD_SANEAMENTO', 'pacientes', {
          total_pacientes: dados.total_pacientes,
          cns_valido: dados.cns_valido,
          cns_ausente: dados.cns_ausente,
          cns_invalido: dados.cns_invalido,
          percentual_integridade: dados.percentual_integridade,
        });
      } catch (err) {
        console.error('Erro ao carregar dados de saneamento:', err);
        toast.error('❌ Erro ao carregar dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    carregarDados();
  }, []);

  if (!status) {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-black text-[#1E293B]">Saneamento de Dados</h1>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  // Preparar dados para gráfico
  const chartData = [
    {
      name: 'CNS Válido',
      value: status.cns_valido,
      color: '#22c55e',
    },
    {
      name: 'CNS Ausente',
      value: status.cns_ausente,
      color: '#f59e0b',
    },
    {
      name: 'CNS Inválido',
      value: status.cns_invalido,
      color: '#ef4444',
    },
  ];

  // Calcular variações (simulado — em produção seria com dados históricos)
  const variacaoIntegridade = status.percentual_integridade >= 80 ? 'up' : 'down';

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-black text-[#1E293B]">Saneamento de Dados</h1>
        <Badge className="bg-blue-100 text-blue-700">CNS / Integridade</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Total de Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-slate-900">{status.total_pacientes}</p>
            <p className="text-xs text-slate-600 mt-1">registros no sistema</p>
          </CardContent>
        </Card>

        {/* CNS Válido */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              CNS Válido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-green-900">{status.cns_valido}</p>
            <p className="text-xs text-green-600 mt-1">
              {status.total_pacientes > 0
                ? ((status.cns_valido / status.total_pacientes) * 100).toFixed(1)
                : 0}
              % dos pacientes
            </p>
          </CardContent>
        </Card>

        {/* CNS Ausente */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              CNS Ausente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-amber-900">{status.cns_ausente}</p>
            <p className="text-xs text-amber-600 mt-1">
              {status.total_pacientes > 0
                ? ((status.cns_ausente / status.total_pacientes) * 100).toFixed(1)
                : 0}
              % dos pacientes
            </p>
          </CardContent>
        </Card>

        {/* CNS Inválido */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              CNS Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-red-900">{status.cns_invalido}</p>
            <p className="text-xs text-red-600 mt-1">
              {status.total_pacientes > 0
                ? ((status.cns_invalido / status.total_pacientes) * 100).toFixed(1)
                : 0}
              % dos pacientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integridade Geral */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Integridade de Dados CNS
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-blue-900">
                {status.percentual_integridade.toFixed(1)}%
              </span>
              <Badge
                className={
                  variacaoIntegridade === 'up'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {variacaoIntegridade === 'up' ? '↑' : '↓'} vs. período anterior
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-slate-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${status.percentual_integridade}%` }}
            />
          </div>
          <p className="text-sm text-blue-700 mt-3">
            {status.cns_valido} de {status.total_pacientes} pacientes com Cartão SUS válido
          </p>
        </CardContent>
      </Card>

      {/* Gráfico Pie Chart */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status CNS</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Distribuição de Status CNS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value} pacientes`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impacto no Faturamento */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Impacto no Faturamento SUS:</strong> Inconsistências no CNS podem impactar
          diretamente no Investimento Total em Saúde (ITS) do prontuário e prejudicar a
          rastreabilidade de atendimentos. Uma integridade abaixo de 80% requer ação corretiva
          urgente.
        </AlertDescription>
      </Alert>

      {/* Recomendações */}
      {status.percentual_integridade < 80 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>⚠️ Ação Necessária:</strong> A integridade de dados está abaixo de 80%. Acesse o{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-red-700 font-semibold underline"
              onClick={() => router.push('/dashboard/relatorios/inconsistencias')}
            >
              Relatório de Inconsistências
            </Button>{' '}
            para identificar e corrigir pacientes com dados faltantes ou inválidos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
