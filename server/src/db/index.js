import config from '../config/env.js';
import { createFileDb } from './adapters/fileAdapter.js';
import { createMongoDb } from './adapters/mongoAdapter.js';

let instance = null;

export function getDb() {
  if (instance) return instance;
  if (config.db.driver === 'mongo') {
    instance = createMongoDb({ uri: config.db.mongoUri, dbName: config.db.mongoDbName });
  } else {
    instance = createFileDb(config.db.fileDir);
  }
  return instance;
}

export async function connectDb() {
  const db = getDb();
  await db.connect();
  return db;
}

export async function disconnectDb() {
  if (instance) await instance.disconnect();
}

// Lazily-created repositories shared across the app.
const repoCache = new Map();
export function repo(collection) {
  if (!repoCache.has(collection)) {
    repoCache.set(collection, getDb().repository(collection));
  }
  return repoCache.get(collection);
}
