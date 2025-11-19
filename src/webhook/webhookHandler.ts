import axios from 'axios';
import { IWebhookEvent } from '../types';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';

export class WebhookHandler {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = ENV.WEBHOOK_URL || '';
  }

  async send(event: IWebhookEvent): Promise<void> {
    if (!this.webhookUrl) {
      return;
    }

    try {
      await axios.post(this.webhookUrl, event, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Big-Conect-API/1.0.0'
        }
      });
    } catch (error) {
      logger.error('Error sending webhook:', error);
    }
  }

  setWebhookUrl(url: string): void {
    this.webhookUrl = url;
  }
}

export const webhookHandler = new WebhookHandler();