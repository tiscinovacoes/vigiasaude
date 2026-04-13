'use client';

import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "./ui/table";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { InfoIcon, AlertCircle, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type Lote } from "@/lib/api";

export function TabelaEstoqueFEFO() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLotes();

    // Ouvir evento global de recall disparado pelo RecallListener
    const handleRecall = () => {
      console.log('🔄 Recall detectado! Recarregando lista de lotes (FEFO)...');
      loadLotes();
    };

    window.addEventListener('recall-detected', handleRecall);

    return () => {
      window.removeEventListener('recall-detected', handleRecall);
    };
  }, []);

  const loadLotes = async () => {
    setLoading(true);
    try {
      const data = await api.getLotes();
      setLotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 size={28} className="mx-auto animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Carregando lotes do banco de dados...</p>
      </div>
    );
  }

  if (lotes.length === 0) {
    return (
      <div className="p-12 text-center">
        <Package size={36} className="mx-auto text-slate-300 mb-3" />
        <p className="font-bold text-slate-600">Nenhum lote ativo encontrado</p>
        <p className="text-sm text-slate-400 mt-1">Os lotes cadastrados no Supabase aparecerão aqui ordenados por validade (FEFO).</p>
      </div>
    );
  }

  // Agrupar lotes por medicamento
  const grouped: Record<string, { nome: string; lotes: Lote[] }> = {};
  lotes.forEach(lote => {
    const medNome = (lote as any).medicamentos?.nome || 'Sem Medicamento';
    const medId = lote.medicamento_id;
    if (!grouped[medId]) {
      grouped[medId] = { nome: medNome, lotes: [] };
    }
    grouped[medId].lotes.push(lote);
  });

  // Ordenar lotes dentro de cada grupo por validade (FEFO)
  Object.values(grouped).forEach(group => {
    group.lotes.sort((a, b) => new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime());
  });

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6">
        {Object.entries(grouped).map(([medId, group]) => (
          <div key={medId} className="border rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b">
              <h3 className="font-bold text-slate-800 text-sm">{group.nome}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {group.lotes.length} lote(s) ativo(s) — Ordenação FEFO aplicada
              </p>
            </div>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Lote (Batch ID)</TableHead>
                  <TableHead>Data de Validade</TableHead>
                  <TableHead className="text-right">Qtd. Disponível</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead className="text-center">Prioridade de Saída</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.lotes.map((lote, index) => {
                  const isPrimeiro = index === 0;
                  const hoje = new Date();
                  const validade = new Date(lote.data_validade);
                  const diasAteVencer = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                  const isCritico = diasAteVencer <= 90;
                  const isVencido = diasAteVencer <= 0;

                  return (
                    <TableRow key={lote.id} className={cn(
                      isPrimeiro && "bg-[#1E3A8A]/5",
                      isVencido && "bg-red-50"
                    )}>
                      <TableCell className="font-mono font-medium">{lote.codigo_lote_fabricante}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {new Date(lote.data_validade).toLocaleDateString("pt-BR")}
                          {isCritico && <AlertCircle className={cn("size-4 animate-pulse", isVencido ? "text-red-600" : "text-orange-500")} />}
                          {isVencido && <Badge variant="destructive" className="text-[9px]">VENCIDO</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{lote.quantidade_disponivel} un.</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {lote.custo_unitario !== null && lote.custo_unitario !== undefined ? (
                          `R$ ${lote.custo_unitario.toFixed(2).replace('.', ',')}`
                        ) : (
                          <span className="text-slate-400 italic">Restrito</span>
                        )}
                      </TableCell>
                      <TableCell className="flex justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <Badge variant={isPrimeiro ? "default" : "outline"} className="gap-1">
                                {index + 1}º da Fila
                                <InfoIcon className="size-3 opacity-70" />
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            {isPrimeiro ? (
                              <p><strong>Ação Obrigatória:</strong> Este é o lote com vencimento mais próximo. Deve ser o primeiro a ser dispensado para evitar perdas (FEFO).</p>
                            ) : (
                              <p>Este lote está na {index + 1}ª posição de reserva. Só deverá ser utilizado após o esgotamento dos lotes anteriores.</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
