import { logger } from './logger';

export class AntiBanHelper {
  private static messageCounts: Map<string, { count: number; lastReset: Date }> = new Map();
  private static sessionActivities: Map<string, Date> = new Map();

  // Limites de segurança
  private static readonly MESSAGE_LIMITS = {
    PER_MINUTE: 30,
    PER_HOUR: 200,
    PER_DAY: 1000
  };

  private static readonly COOLDOWNS = {
    BETWEEN_MESSAGES: { min: 1000, max: 5000 }, // 1-5 segundos entre mensagens
    BETWEEN_SESSIONS: { min: 5000, max: 15000 }, // 5-15 segundos entre criações de sessão
    BULK_OPERATIONS: 60000 // 1 minuto entre operações em massa
  };

  static async messageCooldown(sessionId: string): Promise<void> {
    const lastActivity = this.sessionActivities.get(sessionId);
    const now = new Date();
    
    if (lastActivity) {
      const timeDiff = now.getTime() - lastActivity.getTime();
      const minCooldown = this.COOLDOWNS.BETWEEN_MESSAGES.min;
      
      if (timeDiff < minCooldown) {
        const waitTime = minCooldown - timeDiff + Math.random() * 1000;
        await this.delay(waitTime);
      }
    }
    
    this.sessionActivities.set(sessionId, now);
  }

  static canSendMessage(sessionId: string): { allowed: boolean; reason?: string; waitTime?: number } {
    const now = new Date();
    const sessionData = this.messageCounts.get(sessionId) || { count: 0, lastReset: now };
    
    // Reset contadores se passou 1 minuto
    if (now.getTime() - sessionData.lastReset.getTime() > 60000) {
      sessionData.count = 0;
      sessionData.lastReset = now;
    }
    
    // Verificar limites
    if (sessionData.count >= this.MESSAGE_LIMITS.PER_MINUTE) {
      const waitTime = 60000 - (now.getTime() - sessionData.lastReset.getTime());
      return { 
        allowed: false, 
        reason: 'Limite de mensagens por minuto excedido',
        waitTime
      };
    }
    
    sessionData.count++;
    this.messageCounts.set(sessionId, sessionData);
    
    return { allowed: true };
  }

  static async simulateHumanBehavior(): Promise<void> {
    // Comportamentos humanos aleatórios
    const behaviors = [
      () => this.delay(1000 + Math.random() * 3000), // Pequena pausa
      () => this.delay(500 + Math.random() * 1500),  // Pausa muito curta
      () => { /* Sem pausa */ }
    ];
    
    const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
    await randomBehavior();
  }

  static getRandomCooldown(type: 'message' | 'session' | 'bulk'): number {
    switch (type) {
      case 'message':
        return this.COOLDOWNS.BETWEEN_MESSAGES.min + 
               Math.random() * (this.COOLDOWNS.BETWEEN_MESSAGES.max - this.COOLDOWNS.BETWEEN_MESSAGES.min);
      case 'session':
        return this.COOLDOWNS.BETWEEN_SESSIONS.min + 
               Math.random() * (this.COOLDOWNS.BETWEEN_SESSIONS.max - this.COOLDOWNS.BETWEEN_SESSIONS.min);
      case 'bulk':
        return this.COOLDOWNS.BULK_OPERATIONS;
      default:
        return 2000;
    }
  }

  static validatePhoneNumber(phone: string): boolean {
    // Validar formato internacional
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return false;
    }
    
    // Verificar se não é um número sequencial (1111111111)
    if (/^(\d)\1+$/.test(cleanPhone)) {
      return false;
    }
    
    // Verificar se não é um número de teste comum
    const testNumbers = ['1234567890', '1111111111', '9999999999', '5555555555'];
    if (testNumbers.includes(cleanPhone)) {
      return false;
    }
    
    return true;
  }

  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static rotateIPStrategy(): void {
    // Estratégia para rotação de IP (implementar conforme necessidade)
    logger.info('Estratégia de rotação de IP acionada');
  }

  static getSafeMessageInterval(): number {
    // Intervalo seguro entre mensagens baseado na hora do dia
    const hour = new Date().getHours();
    
    if (hour >= 22 || hour <= 6) { // Madrugada
      return 5000 + Math.random() * 10000; // 5-15 segundos
    } else if (hour >= 7 && hour <= 9) { // Manhã cedo
      return 3000 + Math.random() * 7000; // 3-10 segundos
    } else if (hour >= 18 && hour <= 21) { // Noite
      return 4000 + Math.random() * 8000; // 4-12 segundos
    } else { // Horário comercial
      return 2000 + Math.random() * 5000; // 2-7 segundos
    }
  }
}