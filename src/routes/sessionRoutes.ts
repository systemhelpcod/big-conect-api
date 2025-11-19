import { Router } from 'express';
import { SessionController } from '../controllers/sessionController';

const router = Router();
const sessionController = new SessionController();

router.post('/sessions', sessionController.createSession.bind(sessionController));
router.get('/sessions', sessionController.getSessions.bind(sessionController));
router.get('/sessions/:sessionId/qr', sessionController.getSessionQR.bind(sessionController));
router.get('/sessions/:sessionId/status', sessionController.getSessionStatus.bind(sessionController));
router.delete('/sessions/:sessionId', sessionController.deleteSession.bind(sessionController));

export default router;