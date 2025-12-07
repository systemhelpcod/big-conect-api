import { Router } from 'express';
import { SessionController } from '../controllers/sessionController';

const router = Router();
const sessionController = new SessionController();

// Criar sessão
router.post(
  '/sessions',
  sessionController.createSession.bind(sessionController)
);

// Listar todas as sessões
router.get(
  '/sessions',
  sessionController.getSessions.bind(sessionController)
);

// Obter QR Code da sessão
router.get(
  '/sessions/:sessionId/qr',
  sessionController.getSessionQR.bind(sessionController)
);

// Obter status da sessão
router.get(
  '/sessions/:sessionId/status',
  sessionController.getSessionStatus.bind(sessionController)
);

// Recriar sessão + gerar novo QR (para reconexão)
router.post(
  '/sessions/:sessionId/reconnect',
  sessionController.reconnectSession.bind(sessionController)
);

// Deletar sessão
router.delete(
  '/sessions/:sessionId',
  sessionController.deleteSession.bind(sessionController)
);

// Configurar webhook individual da sessão
router.post(
  '/sessions/:sessionId/webhook',
  sessionController.setSessionWebhook.bind(sessionController)
);

// ⭐ Deletar webhook individual da sessão
router.delete(
  '/sessions/:sessionId/webhook',
  sessionController.deleteSessionWebhook.bind(sessionController)
);

export default router;
