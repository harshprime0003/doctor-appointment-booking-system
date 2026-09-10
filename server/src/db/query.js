// A small MongoDB-like query engine used by the file-based adapter so that
// controllers can use the same query shape regardless of the storage driver.

function getPath(obj, keyPath) {
  if (!keyPath.includes('.')) return obj?.[keyPath];
  return keyPath.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), obj);
}

function matchOperator(value, op, expected) {
  switch (op) {
    case '$eq':
      return value === expected;
    case '$ne':
      return value !== expected;
    case '$gt':
      return value > expected;
    case '$gte':
      return value >= expected;
    case '$lt':
      return value < expected;
    case '$lte':
      return value <= expected;
    case '$in':
      return Array.isArray(expected) && expected.includes(value);
    case '$nin':
      return Array.isArray(expected) && !expected.includes(value);
    case '$exists':
      return (value !== undefined) === Boolean(expected);
    case '$regex': {
      const flags = typeof expected === 'object' ? expected.$options : undefined;
      const pattern = typeof expected === 'object' ? expected.source : expected;
      if (value == null) return false;
      return new RegExp(pattern, flags).test(String(value));
    }
    default:
      return false;
  }
}

function matchCondition(value, condition) {
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    const keys = Object.keys(condition);
    const isOperatorObject = keys.every((k) => k.startsWith('$'));
    if (isOperatorObject && keys.length > 0) {
      // $regex may carry a sibling $options key.
      if (keys.includes('$regex')) {
        const expected =
          '$options' in condition
            ? { source: condition.$regex, $options: condition.$options }
            : condition.$regex;
        if (!matchOperator(value, '$regex', expected)) return false;
        for (const k of keys) {
          if (k === '$regex' || k === '$options') continue;
          if (!matchOperator(value, k, condition[k])) return false;
        }
        return true;
      }
      return keys.every((op) => matchOperator(value, op, condition[op]));
    }
  }
  return value === condition;
}

export function matchesQuery(doc, query = {}) {
  return Object.entries(query).every(([key, condition]) => {
    if (key === '$or') {
      return Array.isArray(condition) && condition.some((sub) => matchesQuery(doc, sub));
    }
    if (key === '$and') {
      return Array.isArray(condition) && condition.every((sub) => matchesQuery(doc, sub));
    }
    return matchCondition(getPath(doc, key), condition);
  });
}

export function sortDocs(docs, sort) {
  if (!sort) return docs;
  const entries = Object.entries(sort);
  return [...docs].sort((a, b) => {
    for (const [field, dir] of entries) {
      const av = getPath(a, field);
      const bv = getPath(b, field);
      if (av === bv) continue;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av > bv ? 1 : -1) * (dir < 0 ? -1 : 1);
    }
    return 0;
  });
}

export function applyUpdate(doc, patch) {
  // Supports plain field patches plus $set / $inc / $push operators.
  if (patch.$set || patch.$inc || patch.$push || patch.$unset) {
    const next = { ...doc };
    if (patch.$set) Object.assign(next, patch.$set);
    if (patch.$inc) {
      for (const [k, v] of Object.entries(patch.$inc)) next[k] = (next[k] || 0) + v;
    }
    if (patch.$push) {
      for (const [k, v] of Object.entries(patch.$push)) {
        next[k] = Array.isArray(next[k]) ? [...next[k], v] : [v];
      }
    }
    if (patch.$unset) {
      for (const k of Object.keys(patch.$unset)) delete next[k];
    }
    return next;
  }
  return { ...doc, ...patch };
}
