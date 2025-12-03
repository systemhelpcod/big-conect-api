import { Router } from 'express';
import { SessionController } from '../controllers/sessionController';

const router = Router();
const sessionController = new SessionController();

// Criar sessão
router.post('/sessions', sessionController.createSession.bind(sessionController));

// Listar todas as sessões
router.get('/sessions', sessionController.getSessions.bind(sessionController));

// Obter QR Code da sessão
router.get('/sessions/:sessionId/qr', sessionController.getSessionQR.bind(sessionController));

// Obter status da sessão
router.get('/sessions/:sessionId/status', sessionController.getSessionStatus.bind(sessionController));

// Deletar sessão
router.delete('/sessions/:sessionId', sessionController.deleteSession.bind(sessionController));

export default router;
