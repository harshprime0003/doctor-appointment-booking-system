import { AuditLogs } from '../repositories/index.js';

// Fire-and-forget audit trail. Never blocks the request path.
export function logAudit(req, { action, entity, entityId, meta }) {
  const actor = req?.user;
  AuditLogs.create({
    action,
    entity,
    entityId: entityId || null,
    actorId: actor?.id || null,
    actorName: actor?.name || 'System',
    actorRole: actor?.role || 'system',
    meta: meta || {},
    ip: req?.ip || null,
  }).catch(() => {});
}
