import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export class PedidoController {
  // PATCH /api/pedidos/:id/entrega
  async confirmarEntrega(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }

    try {
      const pedidoExistente = await prisma.pedidoCompra.findUnique({
        where: { id },
      });

      if (!pedidoExistente) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      if (pedidoExistente.status === 'ENTREGUE') {
        return res.status(400).json({ error: 'Pedido já está com status entregue' });
      }

      // Transação para atualizar pedido e gerar auditoria
      const result = await prisma.$transaction(async (tx) => {
        const pedidoAtualizado = await tx.pedidoCompra.update({
          where: { id },
          data: { status: 'ENTREGUE' },
        });

        await tx.auditoria.create({
          data: {
            usuarioId,
            acao: 'CONFIRMACAO_ENTREGA',
            entidadeId: id,
            dadosAntes: { status: pedidoExistente.status },
            dadosDepois: { status: 'ENTREGUE' },
            justificativa: 'Entrega confirmada pelo sistema.',
          },
        });

        return pedidoAtualizado;
      });

      return res.json(result);
    } catch (err) {
      console.error('Erro ao confirmar entrega:', err);
      return res.status(500).json({ error: 'Erro interno ao processar entrega' });
    }
  }

  // POST /api/pedidos
  async criarPedido(req: AuthRequest, res: Response) {
    const { ataId, valorTotal } = req.body;
    const usuarioId = req.user?.id;

    if (!ataId || !valorTotal) {
      return res.status(400).json({ error: 'ATA e Valor Total são obrigatórios' });
    }

    try {
      // 1. Buscar a ATA e o saldo
      const ata = await prisma.ata.findUnique({
        where: { id: ataId },
        include: {
          pedidos: {
            where: {
              status: { not: 'CANCELADO' }
            }
          }
        }
      });

      if (!ata) {
        return res.status(404).json({ error: 'ATA não encontrada' });
      }

      const totalConsumido = ata.pedidos.reduce((acc, p) => acc + Number(p.valorTotal), 0);
      const saldoDisponivel = Number(ata.valorTeto) - totalConsumido;

      // 2. Verificar se o valor solicitado ultrapassa o teto
      if (Number(valorTotal) > saldoDisponivel) {
        return res.status(400).json({
          error: 'Valor do pedido ultrapassa o saldo disponível da ATA',
          saldoDisponivel,
          valorSolicitado: valorTotal
        });
      }

      // 3. Criar pedido e auditoria
      const novoPedido = await prisma.$transaction(async (tx) => {
        const pedido = await tx.pedidoCompra.create({
          data: {
            ataId,
            valorTotal,
            status: 'PENDENTE',
          }
        });

        await tx.auditoria.create({
          data: {
            usuarioId: usuarioId!,
            acao: 'CRIACAO_PEDIDO',
            entidadeId: pedido.id,
            dadosDepois: { ataId, valorTotal, status: 'PENDENTE' },
            justificativa: 'Novo pedido de compra iniciado.',
          }
        });

        return pedido;
      });

      return res.status(201).json(novoPedido);
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      return res.status(500).json({ error: 'Erro interno ao criar pedido' });
    }
  }
}
