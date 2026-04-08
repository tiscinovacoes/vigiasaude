'use client';

import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldAlert, FileSignature } from "lucide-react";
import { auditoriaAPI } from "@/lib/api";
import { toast } from "sonner";

export function FormularioJustificativaAuditoria() {
  const form = useForm({
    defaultValues: {
      motivo: "",
      descricao: "",
      prioridade: "Media"
    }
  });

  async function onSubmit(data: any) {
    // Integração com a API de Auditoria do Vigia Saúde
    const response = await auditoriaAPI.createLog({
      acao: "JUSTIFICATIVA_OPERACIONAL",
      usuario: "Gestor Farmacêutico",
      modulo: "Estoque/Logística",
      descricao: `Motivo: ${data.motivo} | Detalhes: ${data.descricao}`,
      gravidade: data.prioridade
    });

    if (response.success) {
      toast.success("Justificativa registrada com sucesso e enviada para auditoria municipal.");
      form.reset();
    } else {
      toast.error("Erro ao registrar justificativa no log WORM.");
    }
  }

  return (
    <Card className="border-l-4 border-l-amber-500 shadow-md">
      <CardHeader>
        <CardTitle className="text-[#1E293B] flex items-center gap-2">
          <ShieldAlert className="text-amber-600 size-5" />
          Registro de Justificativa Oficial
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Categoria do Desvio */}
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria do Desvio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo do desvio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FEFO_BYPASS">Quebra de Regra FEFO (Urgência)</SelectItem>
                      <SelectItem value="QUALIDADE">Lote em Análise de Qualidade</SelectItem>
                      <SelectItem value="AVARIA">Avaria Identificada no Recebimento</SelectItem>
                      <SelectItem value="DIVERGENCIA">Divergência de Quantidade NF</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição Detalhada */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o motivo técnico/administrativo para esta ação..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
              <FileSignature className="mr-2 size-4" />
              Assinar e Registrar Justificativa
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
