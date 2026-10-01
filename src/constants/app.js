export const APP_CONFIG = {
  NAME: 'Hotel PMS',
  VERSION: '1.0.0',
  CURRENCY: 'FCFA',
  LOCALE: 'fr-FR',
  TIMEZONE: 'Africa/Dakar',
};

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  TIMEOUT: 30000,
};

export const UI_CONFIG = {
  ITEMS_PER_PAGE: 20,
  MAX_UPLOAD_SIZE: 1024 * 1024,
};
