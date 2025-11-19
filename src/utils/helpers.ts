import { randomBytes } from 'crypto';

export function generateSessionId(): string {
  return randomBytes(16).toString('hex');
}

export function isValidPhoneNumber(phone: string): boolean {
  const regex = /^[1-9][0-9]{9,14}$/;
  return regex.test(phone.replace(/\D/g, ''));
}

export function formatJid(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `${cleanPhone}@s.whatsapp.net`;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}