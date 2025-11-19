// /root/api/big2/beta/api-big-conect/src/routes/messageRoutes.ts
import { Router } from 'express';
import { MessageController } from '../controllers/messageController';

const router = Router();
const messageController = new MessageController();

// Middleware de rate limiting básico
const rateLimitMiddleware = (req: any, res: any, next: any) => {
  // Implementar lógica de rate limiting aqui se necessário
  next();
};

router.post('/:sessionId/messages/text', rateLimitMiddleware, messageController.sendText.bind(messageController));
router.post('/:sessionId/messages/media', rateLimitMiddleware, messageController.sendMedia.bind(messageController));
router.post('/:sessionId/messages/buttons', rateLimitMiddleware, messageController.sendButtons.bind(messageController));
router.post('/:sessionId/messages/template', rateLimitMiddleware, messageController.sendTemplate.bind(messageController));
router.post('/:sessionId/messages/bulk', rateLimitMiddleware, messageController.sendBulkMessages.bind(messageController));
router.post('/:sessionId/messages/list', rateLimitMiddleware, messageController.sendListMessage.bind(messageController));
router.post('/:sessionId/messages/reaction', rateLimitMiddleware, messageController.sendReaction.bind(messageController));

export default router;