import { AuditLogs } from '../repositories/index.js';
import { asyncHandler } from '../utils/errors.js';
import { parsePagination, paginated } from '../utils/pagination.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, entity, search } = req.query;
  const { page, pageSize, skip, limit } = parsePagination(req.query, { defaultPageSize: 20 });
  const query = {};
  if (action) query.action = action;
  if (entity) query.entity = entity;
  let all = await AuditLogs.find(query, { sort: { createdAt: -1 } });
  if (search) {
    const s = search.toLowerCase();
    all = all.filter((l) => (l.actorName || '').toLowerCase().includes(s) || (l.action || '').toLowerCase().includes(s));
  }
  res.json(paginated(all.slice(skip, skip + limit), all.length, { page, pageSize }));
});
