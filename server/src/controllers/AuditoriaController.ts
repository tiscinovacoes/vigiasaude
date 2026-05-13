import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export class AuditoriaController {
  // GET /api/auditoria
  async listar(req: AuthRequest, res: Response) {
    try {
      const logs = await prisma.auditoria.findMany({
        orderBy: {
          dataHora: 'desc',
        },
        include: {
          usuario: {
            select: {
              nome: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.json(logs);
    } catch (err) {
      console.error('Erro ao buscar auditoria:', err);
      return res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
    }
  }
}
