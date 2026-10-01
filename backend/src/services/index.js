const authService = require('./authService');
const clientService = require('./clientService');
const reservationService = require('./reservationService');
const paymentService = require('./paymentService');
const roomService = require('./roomService');
const invoiceService = require('./invoiceService');
const housekeepingService = require('./housekeepingService');
const roomTypeService = require('./roomTypeService');
const paymentModeService = require('./paymentModeService');
const reservationSourceService = require('./reservationSourceService');
const documentService = require('./documentService');
const historyLogService = require('./historyLogService');
const dashboardService = require('./dashboardService');

module.exports = {
  authService,
  clientService,
  reservationService,
  paymentService,
  roomService,
  invoiceService,
  housekeepingService,
  roomTypeService,
  paymentModeService,
  reservationSourceService,
  documentService,
  historyLogService,
  dashboardService,
};
