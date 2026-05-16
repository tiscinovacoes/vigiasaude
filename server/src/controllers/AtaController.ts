import { Request, Response } from 'express';
import prisma from '../config/prisma';

export class AtaController {
  // GET /api/atas
  async listar(req: Request, res: Response) {
    try {
      // Simulação simples, mas pegando do banco real
      // Na vida real, o "fornecedorNome" viria de uma tabela Fornecedores, 
      // aqui estamos apenas devolvendo a Ata
      const atas = await prisma.ata.findMany({
        orderBy: { criadoEm: 'desc' },
      });
      
      // Mapear para incluir fornecedorNome (mockado por enquanto ou vindo de campo fixo se existisse)
      const result = atas.map(ata => ({
        ...ata,
        fornecedorNome: 'Fornecedor Exemplo' // Placeholder até termos a tabela de fornecedores
      }));

      return res.json(result);
    } catch (err) {
      console.error('Erro ao listar atas:', err);
      return res.status(500).json({ error: 'Erro interno ao listar atas' });
    }
  }

  // GET /api/atas/:id
  async detalhes(req: Request, res: Response) {
    const id = req.params.id;
    try {
      const ata = await prisma.ata.findUnique({
        where: { id },
        include: {
          medicamentos: true,
          pedidos: true
        }
      });

      if (!ata) {
        return res.status(404).json({ error: 'Ata não encontrada' });
      }

      return res.json({
        ...ata,
        fornecedorNome: 'Fornecedor Exemplo'
      });
    } catch (err) {
      console.error('Erro ao buscar detalhes da ata:', err);
      return res.status(500).json({ error: 'Erro interno ao buscar detalhes' });
    }
  }
}
