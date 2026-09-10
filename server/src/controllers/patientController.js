import { Users } from '../repositories/index.js';
import { asyncHandler } from '../utils/errors.js';
import { sanitizeUser } from '../utils/auth.js';
import { ROLES } from '../utils/constants.js';

// Lightweight patient directory for staff (receptionist / doctor / admin).
export const listPatients = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let all = await Users.find({ role: ROLES.PATIENT }, { sort: { name: 1 } });
  if (search) {
    const s = search.toLowerCase();
    all = all.filter(
      (u) => (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s) || (u.phone || '').includes(s),
    );
  }
  res.json({ data: all.slice(0, 50).map((u) => sanitizeUser(u)) });
});
