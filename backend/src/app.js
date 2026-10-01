const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { rateLimiter } = require('./middleware');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware');
const logger = require('./config/logger');

const app = express();
app.set('trust proxy', 1);

// Middleware de sécurité
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Analyse du corps de la requête
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Limitation du taux de requêtes
app.use(rateLimiter);

// Routes API
app.use(config.app.apiPrefix, routes);

// Vérification de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Le serveur fonctionne',
    timestamp: new Date().toISOString(),
  });
});

// Gestionnaire 404
app.use(notFound);

// Gestionnaire d'erreurs
app.use(errorHandler);

module.exports = app;
