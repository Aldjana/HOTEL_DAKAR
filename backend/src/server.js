const app = require('./app');
const config = require('./config');
const { connectDB, disconnectDB } = require('./config/database');
const logger = require('./config/logger');

const startServer = async () => {
  try {
    // Connecter à MongoDB
    await connectDB();
    // Entretien des données au démarrage : une erreur ici est journalisée mais n'empêche pas le serveur de démarrer.
    for (const [label, task] of [
      ['données de référence', () => require('./services/defaultsService').ensureDefaults()],
      ['tâches de maintenance', () => require('./services/roomService').ensureMaintenanceTasks()],
    ]) {
      try { await task(); } catch (err) { logger.error(`Démarrage — ${label} : ${err.message}`, err); }
    }
    
    // Démarrer le serveur
    const server = app.listen(config.app.port, () => {
      logger.info(`Serveur démarré sur le port ${config.app.port} (${config.app.env}) — ${config.app.apiPrefix}`);
    });
    
    // Arrêt gracieux
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} reçu. Arrêt gracieux en cours...`);
      
      server.close(async () => {
        logger.info('Serveur HTTP fermé');
        
        try {
          await disconnectDB();
          logger.info('Connexion à la base de données fermée');
          process.exit(0);
        } catch (error) {
          logger.error('Erreur lors de l\'arrêt de la base de données:', error);
          process.exit(1);
        }
      });
      
      // Forcer l'arrêt après 10 secondes
      setTimeout(() => {
        logger.error('Forçage de l\'arrêt après expiration du délai...');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Échec du démarrage du serveur:', error);
    console.error('Échec du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
