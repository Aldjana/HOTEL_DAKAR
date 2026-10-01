require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connexion à MongoDB établie avec succès.');
  } catch (error) {
    console.error('❌ Impossible de se connecter à MongoDB:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ Connexion à MongoDB fermée.');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de MongoDB:', error);
  }
};

module.exports = { connectDB, disconnectDB, mongoose };
