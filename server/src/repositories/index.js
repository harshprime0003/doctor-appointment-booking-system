import { repo } from '../db/index.js';

// Thin domain repositories. Each returns the shared adapter-backed repository
// for its collection plus a few convenience helpers.

export const Users = {
  get col() {
    return repo('users');
  },
  findByEmail(email) {
    return this.col.findOne({ email: String(email).toLowerCase() });
  },
  create(data) {
    return this.col.create({ ...data, email: String(data.email).toLowerCase() });
  },
  findById(id) {
    return this.col.findById(id);
  },
  find(query, opts) {
    return this.col.find(query, opts);
  },
  count(query) {
    return this.col.count(query);
  },
  updateById(id, patch) {
    return this.col.updateById(id, patch);
  },
  deleteById(id) {
    return this.col.deleteById(id);
  },
};

export const Doctors = {
  get col() {
    return repo('doctors');
  },
  findByUserId(userId) {
    return this.col.findOne({ userId });
  },
  findById(id) {
    return this.col.findById(id);
  },
  create(data) {
    return this.col.create(data);
  },
  find(query, opts) {
    return this.col.find(query, opts);
  },
  count(query) {
    return this.col.count(query);
  },
  updateById(id, patch) {
    return this.col.updateById(id, patch);
  },
  deleteById(id) {
    return this.col.deleteById(id);
  },
};

export const Appointments = {
  get col() {
    return repo('appointments');
  },
  findById(id) {
    return this.col.findById(id);
  },
  create(data) {
    return this.col.create(data);
  },
  find(query, opts) {
    return this.col.find(query, opts);
  },
  count(query) {
    return this.col.count(query);
  },
  updateById(id, patch) {
    return this.col.updateById(id, patch);
  },
  deleteById(id) {
    return this.col.deleteById(id);
  },
};

export const Reviews = {
  get col() {
    return repo('reviews');
  },
  findById(id) {
    return this.col.findById(id);
  },
  create(data) {
    return this.col.create(data);
  },
  find(query, opts) {
    return this.col.find(query, opts);
  },
  count(query) {
    return this.col.count(query);
  },
  updateById(id, patch) {
    return this.col.updateById(id, patch);
  },
  deleteById(id) {
    return this.col.deleteById(id);
  },
};

// Generic repository factory for the simpler collections.
function makeRepo(name) {
  return {
    get col() {
      return repo(name);
    },
    findById(id) {
      return this.col.findById(id);
    },
    findOne(query) {
      return this.col.findOne(query);
    },
    create(data) {
      return this.col.create(data);
    },
    find(query, opts) {
      return this.col.find(query, opts);
    },
    count(query) {
      return this.col.count(query);
    },
    updateById(id, patch) {
      return this.col.updateById(id, patch);
    },
    deleteById(id) {
      return this.col.deleteById(id);
    },
    deleteMany(query) {
      return this.col.deleteMany(query);
    },
  };
}

export const Branches = makeRepo('branches');
export const Prescriptions = makeRepo('prescriptions');
export const Payments = makeRepo('payments');
export const Records = makeRepo('records'); // EHR uploads
export const Leaves = makeRepo('leaves');
export const AuditLogs = makeRepo('auditlogs');
export const Vitals = makeRepo('vitals');
