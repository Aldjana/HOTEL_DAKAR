const express = require('express');
const router = express.Router();
const c = require('../controllers/clientController');
const { auth, requirePermission } = require('../middleware');
const v = require('../validators').client;

const read = [auth, requirePermission('clients.read')];
router.post('/', auth, requirePermission('clients.write'), v.createClientValidation, c.createClient);
router.get('/', ...read, c.getAllClients);
router.get('/search', ...read, c.searchClients);
router.get('/:id', ...read, c.getClientById);
router.get('/:id/reservations', ...read, c.getClientReservations);
router.get('/:id/history', ...read, c.getClientHistory);
router.put('/:id', auth, requirePermission('clients.write'), v.updateClientValidation, c.updateClient);
router.delete('/:id', auth, requirePermission('clients.delete'), c.deleteClient);

module.exports = router;
