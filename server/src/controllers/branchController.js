import { Branches, Doctors } from '../repositories/index.js';
import { asyncHandler, notFound } from '../utils/errors.js';
import { logAudit } from '../utils/audit.js';

export const listBranches = asyncHandler(async (req, res) => {
  const data = await Branches.find({}, { sort: { name: 1 } });
  res.json({ data });
});

export const createBranch = asyncHandler(async (req, res) => {
  const { name, city, address, phone } = req.body;
  const branch = await Branches.create({ name, city, address: address || '', phone: phone || '', status: 'active' });
  logAudit(req, { action: 'branch.create', entity: 'branch', entityId: branch.id });
  res.status(201).json({ branch });
});

export const updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branches.findById(req.params.id);
  if (!branch) throw notFound('Branch not found');
  const updated = await Branches.updateById(branch.id, req.body);
  // Keep denormalized branch name on doctors in sync.
  if (req.body.name) {
    const docs = await Doctors.find({ branchId: branch.id });
    for (const d of docs) await Doctors.updateById(d.id, { branchName: req.body.name });
  }
  logAudit(req, { action: 'branch.update', entity: 'branch', entityId: branch.id });
  res.json({ branch: updated });
});
