'use client';

import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "./ui/table";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { InfoIcon, AlertCircle } from "lucide-react";
import { estoqueMultiLotes } from "./mock-data";
import { cn } from "@/lib/utils";

export function TabelaEstoqueFEFO() {
  // Exemplo focado no primeiro medicamento do mock para demonstrar a ordenação
  const medicamento = estoqueMultiLotes[0];
  
  // Ordenação mandatória por validade (Lógica FEFO)
  const lotesOrdenados = [...medicamento.lotes].sort(
    (a, b) => new Date(a.validade).getTime() - new Date(b.validade).getTime()
  );

  return (
    <TooltipProvider delayDuration={100}>
      <Table className="border rounded-xl overflow-hidden">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Lote (Batch ID)</TableHead>
            <TableHead>Data de Validade</TableHead>
            <TableHead className="text-right">Qtd. Disponível</TableHead>
            <TableHead className="text-center">Prioridade de Saída</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lotesOrdenados.map((lote, index) => {
            const isPrimeiro = index === 0;
            const isCritico = lote.status === "Critico";

            return (
              <TableRow key={lote.loteId} className={cn(isPrimeiro && "bg-[#1E3A8A]/5")}>
                <TableCell className="font-mono font-medium">{lote.lote}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {new Date(lote.validade).toLocaleDateString("pt-BR")}
                    {isCritico && <AlertCircle className="size-4 text-destructive animate-pulse" />}
                  </div>
                </TableCell>
                <TableCell className="text-right">{lote.qtdAtual} un.</TableCell>
                <TableCell className="flex justify-center">
                  {/* Tooltip explicando a inteligência por trás da posição do lote */}
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
    </TooltipProvider>
  );
}
