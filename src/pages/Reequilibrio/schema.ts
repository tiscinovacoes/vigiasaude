import { z } from 'zod';

export const reequilibrioSchema = z.object({
  novoPreco: z.number({
    message: "O novo preço é obrigatório",
  }).positive("O preço deve ser maior que zero"),
  justificativa: z.string()
    .min(30, "A justificativa deve ter no mínimo 30 caracteres")
    .max(1000, "A justificativa deve ter no máximo 1000 caracteres"),
  itemAtaId: z.string().min(1, "Selecione um item da ata"),
});

export type ReequilibrioFormData = z.infer<typeof reequilibrioSchema>;
