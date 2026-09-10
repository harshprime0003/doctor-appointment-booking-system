import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';
import { applyUpdate } from '../query.js';

// MongoDB adapter. Uses the native driver via a mongoose connection so the same
// mongo-style query objects used by the file adapter pass straight through.
// Documents use a string `id` field (not `_id`) so both drivers are identical
// from the application's perspective.

function stripMongoId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

export function createMongoDb({ uri, dbName }) {
  if (!uri) {
    throw new Error('MONGODB_URI is required when DB_DRIVER=mongo');
  }

  let db = null;

  function collection(name) {
    if (!db) throw new Error('MongoDB not connected. Call connect() first.');
    return db.collection(name);
  }

  function repository(name) {
    const ensureIndex = collection.bind(null, name);

    return {
      async create(doc) {
        const now = new Date().toISOString();
        const record = {
          id: doc.id || uuid(),
          ...doc,
          createdAt: doc.createdAt || now,
          updatedAt: now,
        };
        await ensureIndex().insertOne(record);
        return stripMongoId(record);
      },

      async findById(id) {
        return stripMongoId(await collection(name).findOne({ id }));
      },

      async findOne(query = {}) {
        return stripMongoId(await collection(name).findOne(query));
      },

      async find(query = {}, opts = {}) {
        let cursor = collection(name).find(query);
        if (opts.sort) cursor = cursor.sort(opts.sort);
        if (opts.skip) cursor = cursor.skip(opts.skip);
        if (opts.limit != null) cursor = cursor.limit(opts.limit);
        const docs = await cursor.toArray();
        return docs.map(stripMongoId);
      },

      async count(query = {}) {
        return collection(name).countDocuments(query);
      },

      async updateById(id, patch) {
        const current = await collection(name).findOne({ id });
        if (!current) return null;
        const next = { ...applyUpdate(stripMongoId(current), patch), id, updatedAt: new Date().toISOString() };
        await collection(name).replaceOne({ id }, next);
        return next;
      },

      async updateOne(query, patch) {
        const current = await collection(name).findOne(query);
        if (!current) return null;
        const id = current.id;
        const next = { ...applyUpdate(stripMongoId(current), patch), id, updatedAt: new Date().toISOString() };
        await collection(name).replaceOne({ id }, next);
        return next;
      },

      async deleteById(id) {
        const res = await collection(name).deleteOne({ id });
        return res.deletedCount > 0;
      },

      async deleteMany(query = {}) {
        const res = await collection(name).deleteMany(query);
        return res.deletedCount;
      },
    };
  }

  return {
    driver: 'mongo',
    repository,
    async connect() {
      await mongoose.connect(uri, { dbName });
      db = mongoose.connection.db;
      // Unique index on the application-level id.
      for (const name of [
        'users',
        'doctors',
        'appointments',
        'reviews',
        'branches',
        'prescriptions',
        'payments',
        'records',
        'leaves',
        'auditlogs',
        'vitals',
      ]) {
        await db.collection(name).createIndex({ id: 1 }, { unique: true });
      }
    },
    async disconnect() {
      await mongoose.disconnect();
      db = null;
    },
  };
}
