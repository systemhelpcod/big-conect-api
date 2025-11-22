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

// ========== ROTAS DE MENSAGENS ==========

// Mensagem de texto simples
router.post('/:sessionId/messages/text', rateLimitMiddleware, messageController.sendText.bind(messageController));

// Mensagens de mídia (audio, video, image, document, sticker)
router.post('/:sessionId/messages/media', rateLimitMiddleware, messageController.sendMedia.bind(messageController));

// Mensagens interativas com botões
router.post('/:sessionId/messages/buttons', rateLimitMiddleware, messageController.sendButtons.bind(messageController));

// Mensagens de template
router.post('/:sessionId/messages/template', rateLimitMiddleware, messageController.sendTemplate.bind(messageController));

// Mensagens em massa (bulk)
router.post('/:sessionId/messages/bulk', rateLimitMiddleware, messageController.sendBulkMessages.bind(messageController));

// Mensagens com lista
router.post('/:sessionId/messages/list', rateLimitMiddleware, messageController.sendListMessage.bind(messageController));

// Reações a mensagens
router.post('/:sessionId/messages/reaction', rateLimitMiddleware, messageController.sendReaction.bind(messageController));

export default router;