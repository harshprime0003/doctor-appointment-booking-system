import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..', '..');

const driver = (process.env.DB_DRIVER || 'file').toLowerCase();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4800,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    driver: driver === 'mongo' || driver === 'mongodb' ? 'mongo' : 'file',
    fileDir: path.isAbsolute(process.env.FILE_DB_DIR || '')
      ? process.env.FILE_DB_DIR
      : path.resolve(serverRoot, process.env.FILE_DB_DIR || './data'),
    mongoUri: process.env.MONGODB_URI || '',
    mongoDbName: process.env.MONGODB_DB_NAME || 'doctor_appointments',
  },
  serverRoot,
};

export default config;
