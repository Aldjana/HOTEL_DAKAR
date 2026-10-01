export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  PLANNING: '/planning',
  RESERVATIONS: '/reservations',
  NEW_RESERVATION: '/reservations/new',
  ROOMS: '/rooms',
  CLIENTS: '/clients',
  PAYMENTS: '/payments',
  CASH: '/cash',
  INVOICES: '/invoices',
  HOUSEKEEPING: '/housekeeping',
  REPORTS: '/reports',
  SETTINGS: '/settings',
};

export const reservationPath = (id, sub = '') => `/reservations/${id}${sub ? `/${sub}` : ''}`;
export const clientPath = (id) => `/clients/${id}`;
export const invoicePath = (id) => `/invoices/${id}`;
