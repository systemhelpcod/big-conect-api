import axios from 'axios';
import { IWebhookEvent } from '../types';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';

export class WebhookHandler {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = ENV.WEBHOOK_URL || '';
    this.validateWebhookUrl();
  }

  private validateWebhookUrl(): void {
    if (!this.webhookUrl || this.webhookUrl.trim() === '') {
      logger.warn('⚠️  WEBHOOK_URL está vazio no .env - Webhooks não serão enviados');
      return;
    }

    try {
      new URL(this.webhookUrl);
      logger.info(`✅ Webhook URL configurado: ${this.webhookUrl}`);
    } catch (error) {
      logger.error(`❌ Webhook URL inválida no .env: "${this.webhookUrl}"`);
      this.webhookUrl = '';
    }
  }

  async send(event: IWebhookEvent): Promise<boolean> {
    // Verificar se webhook está configurado
    if (!this.webhookUrl || this.webhookUrl.trim() === '') {
      return false;
    }

    // Validar estrutura do evento
    if (!this.isValidWebhookEvent(event)) {
      logger.error('❌ Evento de webhook inválido:', event);
      return false;
    }

    try {
      logger.debug(`📤 Enviando webhook para: ${this.webhookUrl}`, {
        type: event.type,
        sessionId: event.sessionId,
        timestamp: event.timestamp
      });

      const response = await axios.post(this.webhookUrl, event, {
        timeout: 15000, // 15 segundos de timeout
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Big-Conect-API/1.0.0',
          'Accept': 'application/json',
          'X-API-Source': 'whatsapp-api'
        },
        validateStatus: (status) => status < 500 // Aceita códigos < 500 como "não-erro"
      });

      if (response.status >= 200 && response.status < 300) {
        logger.debug(`✅ Webhook enviado com sucesso - Status: ${response.status}`);
        return true;
      } else {
        logger.warn(`⚠️ Webhook respondeu com status: ${response.status} - ${response.statusText}`);
        // Não considera como erro completo, apenas loga o warning
        return true;
      }

    } catch (error: any) {
      this.handleWebhookError(error);
      return false;
    }
  }

  private isValidWebhookEvent(event: IWebhookEvent): boolean {
    return !!(event && 
              event.type && 
              event.sessionId && 
              event.data && 
              event.timestamp);
  }

  private handleWebhookError(error: any): void {
    if (error.code === 'ECONNREFUSED') {
      logger.error(`❌ Webhook: Conexão recusada - n8n não está respondendo em ${this.webhookUrl}`);
    } else if (error.code === 'ENOTFOUND') {
      logger.error(`❌ Webhook: Host não encontrado - Verifique a URL: ${this.webhookUrl}`);
    } else if (error.code === 'ECONNABORTED') {
      logger.error(`❌ Webhook: Timeout - n8n não respondeu em 15 segundos`);
    } else if (error.code === 'ETIMEDOUT') {
      logger.error(`❌ Webhook: Timeout de conexão - Servidor lento ou indisponível`);
    } else if (error.response) {
      // Servidor respondeu com erro HTTP
      logger.error(`❌ Webhook: Erro ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // Request foi feito mas não houve resposta
      logger.error('❌ Webhook: Sem resposta do n8n - Verifique se o serviço está rodando');
    } else {
      // Outros erros
      logger.error(`❌ Webhook: Erro inesperado - ${error.message}`);
    }

    // Log adicional para debug
    if (ENV.LOG_LEVEL === 'debug') {
      logger.debug('Detalhes do erro do webhook:', {
        code: error.code,
        message: error.message,
        url: this.webhookUrl
      });
    }
  }

  async sendWithRetry(event: IWebhookEvent, maxRetries: number = 2): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const success = await this.send(event);
      
      if (success) {
        return true;
      }

      if (attempt < maxRetries) {
        logger.warn(`🔄 Tentativa ${attempt}/${maxRetries} falhou, tentando novamente em 2s...`);
        await this.delay(2000);
      }
    }

    logger.error(`❌ Todas as ${maxRetries} tentativas de webhook falharam`);
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setWebhookUrl(url: string): void {
    this.webhookUrl = url;
    this.validateWebhookUrl();
  }

  getWebhookUrl(): string {
    return this.webhookUrl;
  }

  isWebhookConfigured(): boolean {
    return !!(this.webhookUrl && this.webhookUrl.trim() !== '');
  }
}

export const webhookHandler = new WebhookHandler();