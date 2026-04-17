'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
  Edit,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { validateCNS } from '@/utils/validate-cns';
import { useRouter } from 'next/navigation';

interface Inconsistencia {
  id: string;
  nome_completo: string;
  cpf: string;
  cartao_sus: string | null;
  tipo_inconsistencia: 'AUSENTE' | 'INVALIDO';
  tentativas_invalidas: number;
  ultima_tentativa: string | null;
}

export default function InconsistenciasPage() {
  const router = useRouter();
  const [inconsistencias, setInconsistencias] = useState<Inconsistencia[]>([]);
  const [filtradas, setFiltradas] = useState<Inconsistencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'AUSENTE' | 'INVALIDO'>('AUSENTE');
  const [validandoId, setValidandoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Carregar inconsistências e logar acesso
  useEffect(() => {
    async function carregarDados() {
      setIsLoading(true);
      try {
        const dados = await api.getInconsistencias();
        setInconsistencias(dados);

        // Log auditoria
        await api.auditoriaAPI.log('ACESSO_RELATORIO_INCONSISTENCIAS', 'pacientes', {
          total_inconsistencias: dados.length,
          ausentes: dados.filter((d) => d.tipo_inconsistencia === 'AUSENTE').length,
          invalidos: dados.filter((d) => d.tipo_inconsistencia === 'INVALIDO').length,
        });
      } catch (err) {
        console.error('Erro ao carregar inconsistências:', err);
        toast.error('❌ Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    }

    carregarDados();
  }, []);

  // Filtrar por tab + search
  useEffect(() => {
    let resultado = inconsistencias.filter((i) => i.tipo_inconsistencia === activeTab);

    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (i) =>
          i.nome_completo.toLowerCase().includes(termo) ||
          i.cpf.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
      );
    }

    setFiltradas(resultado);
  }, [inconsistencias, activeTab, searchTerm]);

  // Validar CNS
  const handleValidar = async (paciente: Inconsistencia) => {
    setValidandoId(paciente.id);
    try {
      // Re-validate CNS if present
      if (paciente.cartao_sus) {
        const isValid = validateCNS(paciente.cartao_sus);
        if (isValid) {
          toast.success('✅ CNS válido! Este paciente pode ser movido para dados válidos.');
          // Log auditoria
          await api.auditoriaAPI.log('VALIDACAO_CNS_SUCESSO', 'pacientes', {
            paciente_id: paciente.id,
            cartao_sus: paciente.cartao_sus,
          });
        } else {
          toast.error('❌ CNS ainda inválido conforme algoritmo do Ministério da Saúde');
        }
      } else {
        toast.info('ℹ️ Paciente não possui CNS registrado');
      }

      // Log auditoria
      await api.auditoriaAPI.log('VALIDACAO_CNS_MANUAL', 'pacientes', {
        paciente_id: paciente.id,
        cartao_sus: paciente.cartao_sus || null,
        tipo_inconsistencia: paciente.tipo_inconsistencia,
      });
    } catch (err) {
      console.error('Erro ao validar:', err);
      toast.error('❌ Erro ao validar CNS');
    } finally {
      setValidandoId(null);
    }
  };

  // Abrir modal de correção
  const handleCorrigir = (paciente: Inconsistencia) => {
    setEditandoId(paciente.id);
    // TODO: Abrir modal com formulário de vínculo (vinculos/page.tsx)
    // Por enquanto, navegar para página de vinculos
    router.push(`/dashboard/pacientes/vinculos?cpf=${paciente.cpf.replace(/\D/g, '')}`);
  };

  const totalAusentes = inconsistencias.filter((i) => i.tipo_inconsistencia === 'AUSENTE').length;
  const totalInvalidos = inconsistencias.filter((i) => i.tipo_inconsistencia === 'INVALIDO').length;

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
        <h1 className="text-3xl font-black text-[#1E293B]">Relatório de Inconsistências</h1>
        <Badge className="bg-red-100 text-red-700">{inconsistencias.length} Inconsistências</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-blue-900">{inconsistencias.length}</p>
            <p className="text-xs text-blue-600 mt-1">pacientes com inconsistências</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-amber-700">CNS Ausente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-amber-900">{totalAusentes}</p>
            <p className="text-xs text-amber-600 mt-1">
              {((totalAusentes / inconsistencias.length) * 100 || 0).toFixed(0)}% dos inconsistentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-700">CNS Inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-red-900">{totalInvalidos}</p>
            <p className="text-xs text-red-600 mt-1">
              {((totalInvalidos / inconsistencias.length) * 100 || 0).toFixed(0)}% dos inconsistentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Pacientes com Dados Inconsistentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'AUSENTE' | 'INVALIDO')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="AUSENTE" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                CNS Ausente ({totalAusentes})
              </TabsTrigger>
              <TabsTrigger value="INVALIDO" className="flex items-center gap-2">
                <X className="w-4 h-4" />
                CNS Inválido ({totalInvalidos})
              </TabsTrigger>
            </TabsList>

            {/* Tabela — CNS Ausente */}
            <TabsContent value="AUSENTE">
              {isLoading ? (
                <div className="space-y-3 mt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filtradas.length > 0 ? (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Nome</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">CPF</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map((paciente) => (
                        <tr
                          key={paciente.id}
                          className="border-b hover:bg-slate-50 transition"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                              {paciente.nome_completo}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{paciente.cpf}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700">
                              Ausente
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCorrigir(paciente)}
                              disabled={editandoId === paciente.id}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Corrigir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert className="bg-green-50 border-green-200 mt-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>✅ Nenhum paciente com CNS ausente!</strong> Todos têm Cartão SUS
                    registrado.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Tabela — CNS Inválido */}
            <TabsContent value="INVALIDO">
              {isLoading ? (
                <div className="space-y-3 mt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filtradas.length > 0 ? (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Nome</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">CPF</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          CNS Atual
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map((paciente) => (
                        <tr
                          key={paciente.id}
                          className="border-b hover:bg-slate-50 transition"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                              {paciente.nome_completo}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{paciente.cpf}</td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                            {paciente.cartao_sus || '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="destructive" className="bg-red-100 text-red-700">
                              Inválido
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidar(paciente)}
                              disabled={validandoId === paciente.id}
                              className="text-slate-600 hover:text-slate-700"
                            >
                              {validandoId === paciente.id ? (
                                <>
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  Validando
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Validar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCorrigir(paciente)}
                              disabled={editandoId === paciente.id}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Corrigir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert className="bg-green-50 border-green-200 mt-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>✅ Nenhum paciente com CNS inválido!</strong> Todos os Cartões SUS
                    estão válidos conforme algoritmo do Ministério da Saúde.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          {/* Informativo */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Impacto no Faturamento SUS:</strong> Inconsistências no CNS podem impactar
              diretamente no Investimento Total em Saúde do prontuário e prejudicar a rastreabilidade
              de atendimentos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
