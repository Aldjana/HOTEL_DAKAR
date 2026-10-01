require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
if (isProd && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT_SECRET et JWT_REFRESH_SECRET sont obligatoires en production');
}

module.exports = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    apiPrefix: process.env.API_PREFIX || '/api/v1',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_pms',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_only_jwt_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_only_refresh_secret_change_me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cloudinary: {
    // Soit CLOUDINARY_URL=cloudinary://key:secret@cloud, soit les trois variables ci-dessous
    url: process.env.CLOUDINARY_URL || '',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'hotel-pms',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  },
  rateLimit: {
    // Development triggers several parallel dashboard requests; production keeps a stricter limit.
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 1000),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 100 : 1000),
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
};
