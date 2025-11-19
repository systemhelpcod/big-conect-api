export const AntiBanConfig = {
  // Limites de mensagens
  MESSAGE_LIMITS: {
    PER_MINUTE: 25,
    PER_HOUR: 180,
    PER_DAY: 800,
    PER_SESSION: 5000
  },

  // Comportamento
  HUMAN_LIKE_DELAYS: {
    BETWEEN_MESSAGES: { min: 2000, max: 8000 },
    BETWEEN_SESSIONS: { min: 10000, max: 30000 },
    TYPING_INDICATION: { min: 1000, max: 3000 }
  },

  // User Agents - Rodar a cada 24h
  USER_AGENT_ROTATION_HOURS: 24,

  // Reconexões
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: { min: 5000, max: 15000 },

  // Validações
  VALIDATION: {
    MIN_PHONE_LENGTH: 10,
    MAX_PHONE_LENGTH: 15,
    ALLOWED_COUNTRIES: ['55', '1', '44', '33', '49', '39', '34', '7'] // BR, US, UK, FR, DE, IT, ES, RU
  }
};