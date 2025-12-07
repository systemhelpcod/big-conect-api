import { Router } from 'express';
import { webhookHandler } from '../webhook/webhookHandler';

const router = Router();

router.post('/sessions/:sessionId/webhook', (req, res) => {
  const { sessionId } = req.params;
  const { url } = req.body;

  const ok = webhookHandler.setSessionWebhook(sessionId, url);

  if (!ok) {
    return res.status(400).json({
      success: false,
      error: "URL inválida"
    });
  }

  return res.json({
    success: true,
    message: "Webhook atualizado com sucesso",
    sessionId,
    url
  });
});

router.delete('/sessions/:sessionId/webhook', (req, res) => {
  const { sessionId } = req.params;
  webhookHandler.clearSessionWebhook(sessionId);
  res.json({ success: true, message: "Webhook removido da sessão" });
});

export default router;
