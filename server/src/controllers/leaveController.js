import { Leaves, Doctors } from '../repositories/index.js';
import { asyncHandler, notFound, forbidden, badRequest } from '../utils/errors.js';
import { logAudit } from '../utils/audit.js';
import { ROLES, LEAVE_STATUS } from '../utils/constants.js';

export const requestLeave = asyncHandler(async (req, res) => {
  const profile = await Doctors.findByUserId(req.user.id);
  if (!profile) throw forbidden();
  const { from, to, reason, type } = req.body;
  if (!from || !to || to < from) throw badRequest('Provide a valid date range');
  const leave = await Leaves.create({
    doctorId: profile.id,
    doctorName: profile.name,
    from,
    to,
    reason: reason || '',
    type: type || 'leave',
    status: LEAVE_STATUS.PENDING,
  });
  logAudit(req, { action: 'leave.request', entity: 'leave', entityId: leave.id });
  res.status(201).json({ leave });
});

export const listLeaves = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === ROLES.DOCTOR) {
    const profile = await Doctors.findByUserId(req.user.id);
    query.doctorId = profile?.id || '__none__';
  }
  if (req.query.status) query.status = req.query.status;
  const data = await Leaves.find(query, { sort: { createdAt: -1 } });
  res.json({ data });
});

export const decideLeave = asyncHandler(async (req, res) => {
  const leave = await Leaves.findById(req.params.id);
  if (!leave) throw notFound('Leave request not found');
  const { decision } = req.body;
  if (![LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED].includes(decision)) throw badRequest('Invalid decision');
  const updated = await Leaves.updateById(leave.id, { status: decision, decidedBy: req.user.name });
  logAudit(req, { action: 'leave.decide', entity: 'leave', entityId: leave.id, meta: { decision } });
  res.json({ leave: updated });
});
