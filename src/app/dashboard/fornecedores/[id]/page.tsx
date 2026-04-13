'use client';

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  BarChart3,
} from "lucide-react";

// Mock Data
const fornecedoresData: Record<string, any> = {
  "1": {
    id: "1",
    nome: "Biofarma Ltda",
    cnpj: "12.345.678/0001-90",
    telefone: "(11) 3456-7890",
    email: "comercial@biofarma.com.br",
    endereco: "Av. Paulista, 1000 - São Paulo/SP",
    responsavel: "Roberto Silva",
    status: "Ativo",
    kpis: { leadTime: 12, totalCompras: 48, valorAcumulado: 485620.50, pontualidade: 92.5 },
    historicoItens: [
      { id: 1, data: "15/03/2026", medicamento: "Insulina NPH 100UI/ml", lote: "LT2024001", quantidade: 500, precoUnitario: 45.80, valorTotal: 22900.00, notaFiscal: "NF-2026-0315" },
      { id: 2, data: "10/03/2026", medicamento: "Insulina NPH 100UI/ml", lote: "LT2024002", quantidade: 300, precoUnitario: 45.80, valorTotal: 13740.00, notaFiscal: "NF-2026-0298" },
      { id: 3, data: "05/03/2026", medicamento: "Metformina 850mg", lote: "LT2024015", quantidade: 10000, precoUnitario: 0.45, valorTotal: 4500.00, notaFiscal: "NF-2026-0285" },
      { id: 4, data: "28/02/2026", medicamento: "Insulina NPH 100UI/ml", lote: "LT2024003", quantidade: 400, precoUnitario: 44.90, valorTotal: 17960.00, notaFiscal: "NF-2026-0256" },
      { id: 5, data: "20/02/2026", medicamento: "Metformina 850mg", lote: "LT2024016", quantidade: 8000, precoUnitario: 0.48, valorTotal: 3840.00, notaFiscal: "NF-2026-0234" },
      { id: 6, data: "12/02/2026", medicamento: "Glibenclamida 5mg", lote: "LT2024025", quantidade: 5000, precoUnitario: 0.35, valorTotal: 1750.00, notaFiscal: "NF-2026-0218" },
    ],
    ocorrencias: [
      { id: 1, data: "15/03/2026", tipo: "Divergencia de Quantidade", gravidade: "Media", descricao: "Quantidade recebida inferior ao pedido. Diferença de 50 unidades.", medicamento: "Insulina NPH 100UI/ml", lote: "LT2024001", quantidadeEsperada: 550, quantidadeRecebida: 500, responsavel: "João Santos - Conferente CD", status: "Em Analise" },
      { id: 2, data: "05/03/2026", tipo: "Falta de Documentacao", gravidade: "Baixa", descricao: "Certificado de análise não acompanhou a carga. Documento enviado posteriormente.", medicamento: "Metformina 850mg", lote: "LT2024015", quantidadeEsperada: 10000, quantidadeRecebida: 10000, responsavel: "Maria Oliveira - Conferente CD", status: "Resolvido" },
      { id: 3, data: "28/02/2026", tipo: "Temperatura Inadequada", gravidade: "Alta", descricao: "Temperatura do veículo acima de 8°C durante transporte. Lote rejeitado e devolvido.", medicamento: "Insulina NPH 100UI/ml", lote: "LT2024003", quantidadeEsperada: 400, quantidadeRecebida: 0, responsavel: "Carlos Mendes - Supervisor CD", status: "Resolvido" },
    ],
  },
  "2": {
    id: "2",
    nome: "MedPharma S.A.",
    cnpj: "98.765.432/0001-10",
    telefone: "(21) 2345-6789",
    email: "vendas@medpharma.com.br",
    endereco: "Rua das Indústrias, 500 - Rio de Janeiro/RJ",
    responsavel: "Ana Costa",
    status: "Ativo",
    kpis: { leadTime: 8, totalCompras: 62, valorAcumulado: 328450.75, pontualidade: 96.8 },
    historicoItens: [
      { id: 7, data: "16/03/2026", medicamento: "Losartana 50mg", lote: "LT2024008", quantidade: 12000, precoUnitario: 0.68, valorTotal: 8160.00, notaFiscal: "NF-2026-0318" },
      { id: 8, data: "11/03/2026", medicamento: "Enalapril 10mg", lote: "LT2024012", quantidade: 8000, precoUnitario: 0.52, valorTotal: 4160.00, notaFiscal: "NF-2026-0302" },
      { id: 9, data: "06/03/2026", medicamento: "Losartana 50mg", lote: "LT2024009", quantidade: 10000, precoUnitario: 0.65, valorTotal: 6500.00, notaFiscal: "NF-2026-0289" },
      { id: 10, data: "01/03/2026", medicamento: "Sinvastatina 20mg", lote: "LT2024020", quantidade: 15000, precoUnitario: 0.42, valorTotal: 6300.00, notaFiscal: "NF-2026-0271" },
    ],
    ocorrencias: [
      { id: 4, data: "11/03/2026", tipo: "Avaria", gravidade: "Baixa", descricao: "3 caixas com amassamentos leves. Produto íntegro, apenas embalagem externa danificada.", medicamento: "Enalapril 10mg", lote: "LT2024012", quantidadeEsperada: 8000, quantidadeRecebida: 8000, responsavel: "Pedro Lima - Conferente CD", status: "Resolvido" },
    ],
  },
};

export default function FornecedorDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const [abaAtiva, setAbaAtiva] = useState<"historico" | "ocorrencias">("historico");

  const fornecedor = fornecedoresData[params.id as string] || fornecedoresData["1"];

  const totalItens = fornecedor.historicoItens.reduce((sum: number, item: any) => sum + item.quantidade, 0);
  const ocorrenciasPendentes = fornecedor.ocorrencias.filter((o: any) => o.status === "Pendente" || o.status === "Em Analise").length;

  const gravidadeConfig: any = {
    Alta: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
    Media: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
    Baixa: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  };

  const statusConfig: any = {
    Resolvido: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    Pendente: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
    "Em Analise": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  };

  return (
    <div className="space-y-6 pt-16 sm:pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/fornecedores")}
            className="cursor-pointer shrink-0 border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 bg-[#1E3A8A] rounded-xl flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-[#1E293B] font-bold text-2xl">{fornecedor.nome}</h1>
                <p className="text-[#64748B]">CNPJ: {fornecedor.cnpj}</p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                {fornecedor.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Informações de Contato */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8]">Telefone</p>
                <p className="text-sm text-[#1E293B] font-medium">{fornecedor.telefone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8]">E-mail</p>
                <p className="text-sm text-[#1E293B] font-medium">{fornecedor.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8]">Endereço</p>
                <p className="text-sm text-[#1E293B] font-medium">{fornecedor.endereco}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#94A3B8]">Responsável</p>
                <p className="text-sm text-[#1E293B] font-medium">{fornecedor.responsavel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs do Fornecedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lead Time */}
        <Card className="shadow-sm border-l-4 border-l-[#1E3A8A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-1">Lead Time Médio</p>
                <div className="flex items-baseline gap-1">
                   <p className="text-2xl text-[#1E293B] font-black">{fornecedor.kpis.leadTime}</p>
                   <p className="text-xs font-bold text-[#94A3B8]">dias</p>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#1E3A8A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total de Compras */}
        <Card className="shadow-sm border-l-4 border-l-[#16A34A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-1">Total de Compras</p>
                <div className="flex items-baseline gap-1">
                   <p className="text-2xl text-[#1E293B] font-black">{fornecedor.kpis.totalCompras}</p>
                   <p className="text-xs font-bold text-[#94A3B8]">pedidos</p>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-[#16A34A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valor Acumulado */}
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-1">Valor Acumulado</p>
                <p className="text-2xl text-[#1E293B] font-black">
                  {fornecedor.kpis.valorAcumulado.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, })}
                </p>
                <p className="text-[10px] font-bold text-[#94A3B8] mt-1">últimos 12 meses</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pontualidade */}
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-1">Pontualidade</p>
                <p className="text-2xl text-[#1E293B] font-black">{fornecedor.kpis.pontualidade}%</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden mt-2">
                <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: `${fornecedor.kpis.pontualidade}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sistema de Abas */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-[#E2E8F0] pb-0 bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAbaAtiva("historico")}
              className={`pb-4 px-2 border-b-2 transition-colors cursor-pointer text-sm font-bold tracking-widest uppercase ${
                abaAtiva === "historico"
                  ? "border-[#1E3A8A] text-[#1E3A8A]"
                  : "border-transparent text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Histórico de Itens</span>
                <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-700 border-blue-200">{fornecedor.historicoItens.length}</Badge>
              </div>
            </button>
            <button
              onClick={() => setAbaAtiva("ocorrencias")}
              className={`pb-4 px-2 border-b-2 transition-colors cursor-pointer text-sm font-bold tracking-widest uppercase ${
                abaAtiva === "ocorrencias"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Ocorrências</span>
                {ocorrenciasPendentes > 0 && (
                  <Badge variant="outline" className="ml-1 bg-red-100 text-red-800 border-red-200">{ocorrenciasPendentes}</Badge>
                )}
              </div>
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Aba 1: Histórico */}
          {abaAtiva === "historico" && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-4 text-xs font-bold uppercase tracking-widest">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <BarChart3 className="w-4 h-4 text-[#1E3A8A]" /> Total de Itens: <span className="text-[#1E293B] font-black">{totalItens.toLocaleString("pt-BR")} unidades</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <DollarSign className="w-4 h-4 text-[#16A34A]" /> Valor Total: <span className="text-[#1E293B] font-black">{fornecedor.historicoItens.reduce((sum: number, item: any) => sum + item.valorTotal, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white border-b border-[#E2E8F0]">
                      <th className="text-left py-3 px-4 text-[#64748B] text-[10px] uppercase tracking-widest font-bold">Data</th>
                      <th className="text-left py-3 px-4 text-[#64748B] text-[10px] uppercase tracking-widest font-bold">Medicamento</th>
                      <th className="text-left py-3 px-4 text-[#64748B] text-[10px] uppercase tracking-widest font-bold">Lote (Batch ID)</th>
                      <th className="text-right py-3 px-4 text-[#64748B] text-[10px] uppercase tracking-widest font-bold">Quantidade</th>
                      <th className="text-right py-3 px-4 text-[#64748B] text-[10px] uppercase tracking-widest font-bold">Preço Unit.</th>
                      <th className="text-right py-3 px-4 text-[#64748B] text-[10px] uppercase tracking-widest font-bold">Valor Total</th>
                      <th className="text-left py-3 px-4 text-[#64748B] text-[10px] uppercase tracking-widest font-bold">Nota Fiscal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fornecedor.historicoItens.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-[#64748B] font-medium">{item.data}</td>
                        <td className="py-3 px-4 text-[#1E293B] font-bold">{item.medicamento}</td>
                        <td className="py-3 px-4 font-mono text-[#1E3A8A] font-bold">{item.lote}</td>
                        <td className="py-3 px-4 text-right font-black">{item.quantidade.toLocaleString("pt-BR")}</td>
                        <td className="py-3 px-4 text-right text-[#64748B] font-medium">
                          {item.precoUnitario?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600">{item.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-[#1E3A8A] text-sm">
                            <FileText className="w-3 h-3" />
                            {item.notaFiscal ?? "—"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aba 2: Ocorrências */}
          {abaAtiva === "ocorrencias" && (
            <div className="p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200 bg-slate-50/50">
              {fornecedor.ocorrencias.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <p className="text-slate-600 font-bold mb-1">Nenhuma ocorrência registrada</p>
                  <p className="text-sm text-slate-400">Fornecedor com excelência nas entregas.</p>
                </div>
              ) : (
                fornecedor.ocorrencias.map((ocorrencia: any) => (
                  <Card key={ocorrencia.id} className={`border-l-4 shadow-sm ${gravidadeConfig[ocorrencia.gravidade]?.border || "border-slate-300"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${gravidadeConfig[ocorrencia.gravidade]?.bg || "bg-slate-100"} rounded-lg flex items-center justify-center shrink-0`}>
                            <AlertTriangle className={`w-5 h-5 ${gravidadeConfig[ocorrencia.gravidade]?.text || "text-slate-600"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm text-[#1E293B] font-black uppercase tracking-tight">{ocorrencia.tipo}</h4>
                              <Badge className={`${gravidadeConfig[ocorrencia.gravidade]?.bg} ${gravidadeConfig[ocorrencia.gravidade]?.text} border-none shadow-none text-[10px] uppercase font-black tracking-widest`}>
                                {ocorrencia.gravidade}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                              <Calendar className="w-3 h-3" /> {ocorrencia.data}
                            </div>
                          </div>
                        </div>
                        <Badge className={`${statusConfig[ocorrencia.status]?.bg || "bg-slate-100"} ${statusConfig[ocorrencia.status]?.text || "text-slate-600"} border-none shadow-none text-[10px] uppercase font-black tracking-widest`}>
                          {ocorrencia.status}
                        </Badge>
                      </div>
                      <div className="bg-white border rounded-lg p-3 my-3">
                        <p className="text-sm text-slate-600 font-medium">{ocorrencia.descricao}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2 p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-0.5">Medicamento / Lote</p>
                          <p className="text-[#1E293B] font-bold">{ocorrencia.medicamento} <span className="text-indigo-600 font-mono text-xs">{ocorrencia.lote}</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-0.5">Qtd Esperada / Recebida</p>
                          <p className="text-[#1E293B] font-bold">
                            {ocorrencia.quantidadeEsperada.toLocaleString()} <span className="text-slate-400 mx-1">/</span> <span className={ocorrencia.quantidadeRecebida < ocorrencia.quantidadeEsperada ? "text-red-500 font-black" : "text-emerald-500 font-black"}>{ocorrencia.quantidadeRecebida.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                      {ocorrencia.responsavel && (
                        <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center gap-2 text-xs text-[#64748B]">
                          <FileText className="w-3 h-3" />
                          <span>Responsável: <span className="font-semibold text-[#1E293B]">{ocorrencia.responsavel}</span></span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
