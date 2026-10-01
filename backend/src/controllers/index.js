const authController = require('./authController');
const clientController = require('./clientController');
const reservationController = require('./reservationController');
const paymentController = require('./paymentController');
const roomController = require('./roomController');
const invoiceController = require('./invoiceController');
const housekeepingController = require('./housekeepingController');
const roomTypeController = require('./roomTypeController');
const paymentModeController = require('./paymentModeController');
const reservationSourceController = require('./reservationSourceController');
const documentController = require('./documentController');
const historyLogController = require('./historyLogController');
const dashboardController = require('./dashboardController');

module.exports = {
  authController,
  clientController,
  reservationController,
  paymentController,
  roomController,
  invoiceController,
  housekeepingController,
  roomTypeController,
  paymentModeController,
  reservationSourceController,
  documentController,
  historyLogController,
  dashboardController,
};
