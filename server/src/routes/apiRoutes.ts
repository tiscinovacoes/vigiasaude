import { Router } from 'express';
import { PedidoController } from '../controllers/PedidoController';
import { AuditoriaController } from '../controllers/AuditoriaController';
import { authMiddleware, roleMiddleware } from '../middlewares/auth';

const router = Router();
const pedidoController = new PedidoController();
const auditoriaController = new AuditoriaController();

// Todas as rotas da API requerem autenticação
router.use(authMiddleware);

// Rotas de Pedidos
router.post('/pedidos', pedidoController.criarPedido);
router.patch('/pedidos/:id/entrega', pedidoController.confirmarEntrega);

// Rotas de Auditoria (Restrito a COMPRADOR)
router.get('/auditoria', roleMiddleware(['COMPRADOR']), auditoriaController.listar);

export default router;
