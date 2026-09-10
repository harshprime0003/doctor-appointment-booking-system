import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { matchesQuery, sortDocs, applyUpdate } from '../query.js';

// Simple JSON-file backed store. Each collection is a single <name>.json file
// holding an array of documents. Writes are serialized per collection to avoid
// interleaving. This is intentionally dependency-free so the project runs with
// zero external services.

export function createFileDb(dir) {
  const locks = new Map(); // collection -> Promise chain
  const cache = new Map(); // collection -> array

  async function ensureDir() {
    await fs.mkdir(dir, { recursive: true });
  }

  function fileFor(collection) {
    return path.join(dir, `${collection}.json`);
  }

  async function load(collection) {
    if (cache.has(collection)) return cache.get(collection);
    await ensureDir();
    try {
      const raw = await fs.readFile(fileFor(collection), 'utf8');
      const data = JSON.parse(raw);
      cache.set(collection, Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.code === 'ENOENT') cache.set(collection, []);
      else throw err;
    }
    return cache.get(collection);
  }

  async function persist(collection) {
    await ensureDir();
    const data = cache.get(collection) || [];
    const tmp = `${fileFor(collection)}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, fileFor(collection));
  }

  // Serialize mutating operations per collection.
  function withLock(collection, fn) {
    const prev = locks.get(collection) || Promise.resolve();
    const next = prev.then(fn, fn);
    locks.set(
      collection,
      next.then(
        () => {},
        () => {},
      ),
    );
    return next;
  }

  function repository(collection) {
    return {
      async create(doc) {
        return withLock(collection, async () => {
          const data = await load(collection);
          const now = new Date().toISOString();
          const record = {
            id: doc.id || uuid(),
            ...doc,
            createdAt: doc.createdAt || now,
            updatedAt: now,
          };
          data.push(record);
          await persist(collection);
          return { ...record };
        });
      },

      async findById(id) {
        const data = await load(collection);
        const found = data.find((d) => d.id === id);
        return found ? { ...found } : null;
      },

      async findOne(query = {}) {
        const data = await load(collection);
        const found = data.find((d) => matchesQuery(d, query));
        return found ? { ...found } : null;
      },

      async find(query = {}, opts = {}) {
        const data = await load(collection);
        let result = data.filter((d) => matchesQuery(d, query));
        if (opts.sort) result = sortDocs(result, opts.sort);
        if (opts.skip) result = result.slice(opts.skip);
        if (opts.limit != null) result = result.slice(0, opts.limit);
        return result.map((d) => ({ ...d }));
      },

      async count(query = {}) {
        const data = await load(collection);
        return data.filter((d) => matchesQuery(d, query)).length;
      },

      async updateById(id, patch) {
        return withLock(collection, async () => {
          const data = await load(collection);
          const idx = data.findIndex((d) => d.id === id);
          if (idx === -1) return null;
          data[idx] = { ...applyUpdate(data[idx], patch), id, updatedAt: new Date().toISOString() };
          await persist(collection);
          return { ...data[idx] };
        });
      },

      async updateOne(query, patch) {
        return withLock(collection, async () => {
          const data = await load(collection);
          const idx = data.findIndex((d) => matchesQuery(d, query));
          if (idx === -1) return null;
          const id = data[idx].id;
          data[idx] = { ...applyUpdate(data[idx], patch), id, updatedAt: new Date().toISOString() };
          await persist(collection);
          return { ...data[idx] };
        });
      },

      async deleteById(id) {
        return withLock(collection, async () => {
          const data = await load(collection);
          const idx = data.findIndex((d) => d.id === id);
          if (idx === -1) return false;
          data.splice(idx, 1);
          await persist(collection);
          return true;
        });
      },

      async deleteMany(query = {}) {
        return withLock(collection, async () => {
          const data = await load(collection);
          const before = data.length;
          const kept = data.filter((d) => !matchesQuery(d, query));
          cache.set(collection, kept);
          await persist(collection);
          return before - kept.length;
        });
      },
    };
  }

  return {
    driver: 'file',
    repository,
    async connect() {
      await ensureDir();
    },
    async disconnect() {
      cache.clear();
    },
  };
}
