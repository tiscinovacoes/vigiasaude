'use client';

import { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  FileCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';

const MOCK_FORNECEDORES = [
  {
    id: 'F001',
    nome: 'MedSupply Nacional Ltda',
    segmento: 'Medicamentos Especializados',
    cidade: 'Goiânia - GO',
    score: 98,
    status: 'Ativo',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    documentos: 'Em Dia',
    ultCompra: '2 dias atrás'
  },
  {
    id: 'F002',
    nome: 'FarmaLog Distribuidora',
    segmento: 'Materiais Hospitalares',
    cidade: 'Dourados - MS',
    score: 84,
    status: 'Ativo',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    documentos: 'Pendente Revalidação',
    ultCompra: '1 semana atrás'
  },
  {
    id: 'F003',
    nome: 'Global Health BR',
    segmento: 'Importação Directa',
    cidade: 'São Paulo - SP',
    score: 65,
    status: 'Sob Observação',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    documentos: 'Crítico',
    ultCompra: '15 dias atrás'
  },
  {
    id: 'F004',
    nome: 'BioDistribuidora Center',
    segmento: 'Vacinas e Biológicos',
    cidade: 'Curitiba - PR',
    score: 92,
    status: 'Ativo',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    documentos: 'Em Dia',
    ultCompra: '3 dias atrás'
  }
];

export default function FornecedoresPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Fornecedores</h1>
          <p className="text-slate-500 font-medium">Monitoramento tático, auditoria de documentos e score de performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 bg-white">
            <FileCheck className="mr-2 h-4 w-4 text-slate-500" /> Relatório de Auditoria
          </Button>
          <Button className="bg-[#1A2B6D] hover:bg-[#121f4f] rounded-xl shadow-lg">
            <Building2 className="mr-2 h-4 w-4" /> Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* KPI TOP ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold">TOTAL</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">42</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Homologados</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold">+12%</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">85%</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Compliance Doc</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                <Star size={24} />
              </div>
              <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold">MÉDIA</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">92/100</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Score Geral</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <Badge variant="destructive" className="bg-red-50 text-red-600 border-none font-bold">CRÍTICO</Badge>
            </div>
            <h3 className="text-3xl font-black text-slate-800">03</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Em Observação</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Buscar por nome, CNPJ ou cidade..." 
            className="pl-11 h-12 bg-slate-50 border-none rounded-xl text-slate-700 font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold">
            <Filter size={18} className="mr-2" /> Filtros
          </Button>
          <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold">
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* SUPPLIERS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MOCK_FORNECEDORES.map((fornecedor) => (
          <Card key={fornecedor.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-md transition-all duration-300">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", fornecedor.bgColor)}>
                      <Building2 className={fornecedor.iconColor} size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-slate-800 group-hover:text-[#1A2B6D] transition-colors">{fornecedor.nome}</h3>
                        {fornecedor.score > 90 && <CheckCircle2 size={16} className="text-emerald-500" />}
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{fornecedor.segmento}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-lg font-black text-slate-800">{fornecedor.score}</span>
                      <span className="text-xs font-bold text-slate-400">/100</span>
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-black uppercase border-none",
                      fornecedor.status === 'Ativo' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                    )}>
                      {fornecedor.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin size={16} className="shrink-0" />
                      <span className="text-xs font-bold">{fornecedor.cidade}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone size={16} className="shrink-0" />
                      <span className="text-xs font-bold">(67) 3411-0000</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={16} className="shrink-0" />
                      <span className="text-xs font-bold">Última: {fornecedor.ultCompra}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={16} className={cn("shrink-0", fornecedor.documentos === 'Crítico' ? "text-red-500" : "text-emerald-500")} />
                       <span className={cn("text-xs font-bold", fornecedor.documentos === 'Crítico' ? "text-red-600" : "text-slate-500")}>
                         Docs: {fornecedor.documentos}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" title="Auditor 1"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300" title="Auditor 2"></div>
                </div>
                <Button variant="ghost" className="text-xs font-black text-[#1A2B6D] hover:bg-slate-100 rounded-lg">
                  VER PERFIL COMPLETO <ExternalLink size={14} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FOOTER INFO */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest pt-4">
        <TrendingUp size={14} />
        O Score é calculado dinamicamente com base em Lead Time, Pontualidade e Qualidade da Entrega.
      </div>
    </div>
  );
}
