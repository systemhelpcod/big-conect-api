import axios from 'axios';
import { IWebhookEvent } from '../types';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';
import { SessionConfig } from '../utils/sessionConfig';

export class WebhookHandler {
  private globalWebhookUrl: string;

  constructor() {
    this.globalWebhookUrl = ENV.WEBHOOK_URL || '';
    this.validateWebhookUrl();
  }

  private validateWebhookUrl(): void {
    if (!this.globalWebhookUrl || this.globalWebhookUrl.trim() === '') {
      logger.warn('⚠️  WEBHOOK_URL global está vazio no .env');
      return;
    }

    try {
      new URL(this.globalWebhookUrl);
      logger.info(`🌐 Webhook GLOBAL configurado: ${this.globalWebhookUrl}`);
    } catch (error) {
      logger.error(`❌ Webhook global inválido no .env: "${this.globalWebhookUrl}"`);
      this.globalWebhookUrl = '';
    }
  }

  private getWebhookForSession(sessionId: string): string {
    const cfg = SessionConfig.load(sessionId);
    return cfg.webhook || this.globalWebhookUrl;
  }

  async send(event: IWebhookEvent): Promise<boolean> {
    const url = this.getWebhookForSession(event.sessionId);

    if (!url) return false;

    if (!this.isValidWebhookEvent(event)) {
      logger.error('❌ Evento inválido de webhook:', event);
      return false;
    }

    try {
      logger.debug(`📤 Webhook enviado para ${url}`, {
        type: event.type,
        sessionId: event.sessionId
      });

      const response = await axios.post(url, event, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Big-Conect-API/1.0.0',
          'X-API-Source': 'whatsapp-api'
        }
      });

      logger.debug(`Webhook status: ${response.status}`);
      return true;

    } catch (error: any) {
      logger.error(`⚠️ Webhook falhou: ${error.message}`);
      return false;
    }
  }

  isValidWebhookEvent(event: IWebhookEvent): boolean {
    return !!(event && event.type && event.sessionId && event.data && event.timestamp);
  }
}

export const webhookHandler = new WebhookHandler();
