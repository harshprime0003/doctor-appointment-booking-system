import { Users, Doctors, Appointments, Branches, Payments } from '../repositories/index.js';
import { hashPassword, sanitizeUser } from '../utils/auth.js';
import { asyncHandler, notFound, conflict, badRequest } from '../utils/errors.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { logAudit } from '../utils/audit.js';
import { ROLES, APPOINTMENT_STATUS, SPECIALTIES } from '../utils/constants.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search, status } = req.query;
  const { page, pageSize, skip, limit } = parsePagination(req.query);
  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  const all = await Users.find(query, { sort: { createdAt: -1 } });
  const total = all.length;
  const data = all.slice(skip, skip + limit).map(sanitizeUser);
  res.json(paginated(data, total, { page, pageSize }));
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'disabled'].includes(status)) throw badRequest('Invalid status');
  const user = await Users.findById(req.params.id);
  if (!user) throw notFound('User not found');
  const updated = await Users.updateById(user.id, { status });
  res.json({ user: sanitizeUser(updated) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await Users.findById(req.params.id);
  if (!user) throw notFound('User not found');
  if (user.role === ROLES.DOCTOR) {
    const profile = await Doctors.findByUserId(user.id);
    if (profile) await Doctors.deleteById(profile.id);
  }
  await Users.deleteById(user.id);
  res.json({ message: 'User removed' });
});

export const listAllDoctors = asyncHandler(async (req, res) => {
  const { search, specialty, status } = req.query;
  const { page, pageSize, skip, limit } = parsePagination(req.query);
  const query = {};
  if (specialty) query.specialty = specialty;
  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: 'i' };
  const all = await Doctors.find(query, { sort: { createdAt: -1 } });
  const total = all.length;
  res.json(paginated(all.slice(skip, skip + limit), total, { page, pageSize }));
});

export const updateDoctorStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'pending'].includes(status)) throw badRequest('Invalid status');
  const doctor = await Doctors.findById(req.params.id);
  if (!doctor) throw notFound('Doctor not found');
  const updated = await Doctors.updateById(doctor.id, { status });
  logAudit(req, { action: 'doctor.status', entity: 'doctor', entityId: doctor.id, meta: { status } });
  res.json({ doctor: updated });
});

// Admin edit of a doctor's key details.
export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctors.findById(req.params.id);
  if (!doctor) throw notFound('Doctor not found');
  const allowed = {};
  const { specialty, consultationFee, experienceYears, qualifications, city, hospital, status } = req.body;
  if (specialty !== undefined) {
    if (!SPECIALTIES.includes(specialty)) throw badRequest('Invalid specialty');
    allowed.specialty = specialty;
  }
  if (consultationFee !== undefined) allowed.consultationFee = Number(consultationFee);
  if (experienceYears !== undefined) allowed.experienceYears = Number(experienceYears);
  if (qualifications !== undefined) allowed.qualifications = qualifications;
  if (city !== undefined) allowed.city = city;
  if (hospital !== undefined) allowed.hospital = hospital;
  if (status !== undefined && ['active', 'inactive', 'pending'].includes(status)) allowed.status = status;
  const updated = await Doctors.updateById(doctor.id, allowed);
  logAudit(req, { action: 'doctor.update', entity: 'doctor', entityId: doctor.id, meta: allowed });
  res.json({ doctor: updated });
});

// All payments with revenue summary.
export const listPayments = asyncHandler(async (req, res) => {
  const { search, method } = req.query;
  const { page, pageSize, skip, limit } = parsePagination(req.query, { defaultPageSize: 15 });
  const query = {};
  if (method) query.method = method;
  let all = await Payments.find(query, { sort: { createdAt: -1 } });
  if (search) {
    const s = search.toLowerCase();
    all = all.filter(
      (p) => (p.patientName || '').toLowerCase().includes(s) ||
        (p.doctorName || '').toLowerCase().includes(s) ||
        (p.invoiceNo || '').toLowerCase().includes(s),
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  const summary = {
    totalCollected: all.reduce((s, p) => s + (p.total || 0), 0),
    totalGst: all.reduce((s, p) => s + (p.gst || 0), 0),
    count: all.length,
    todayCollected: all.filter((p) => (p.createdAt || '').slice(0, 10) === today).reduce((s, p) => s + (p.total || 0), 0),
  };
  res.json({ ...paginated(all.slice(skip, skip + limit), all.length, { page, pageSize }), summary });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, specialty, experienceYears, consultationFee, qualifications, city, gender, hospital, branchId } = req.body;
  const existing = await Users.findByEmail(email);
  if (existing) throw conflict('An account with this email already exists');
  const passwordHash = await hashPassword(password);
  const user = await Users.create({ name, email, passwordHash, role: ROLES.DOCTOR, status: 'active' });

  let branchName = null;
  if (branchId) {
    const branch = await Branches.findById(branchId);
    branchName = branch?.name || null;
  }

  const doctor = await Doctors.create({
    userId: user.id,
    name,
    email: user.email,
    specialty,
    experienceYears,
    consultationFee,
    qualifications: qualifications || '',
    city: city || '',
    gender: gender || undefined,
    hospital: hospital || '',
    branchId: branchId || null,
    branchName,
    avatarUrl: '',
    bio: '',
    clinicAddress: '',
    languages: ['English'],
    insurances: [],
    conditions: [],
    availability: [],
    breaks: [],
    blockedDates: [],
    successRate: 85,
    status: 'active',
    rating: 0,
    ratingCount: 0,
  });
  res.status(201).json({ user: sanitizeUser(user), doctor });
});

export const createReceptionist = asyncHandler(async (req, res) => {
  const { name, email, password, branchId } = req.body;
  const existing = await Users.findByEmail(email);
  if (existing) throw conflict('An account with this email already exists');
  const passwordHash = await hashPassword(password);
  let branchName = null;
  if (branchId) {
    const branch = await Branches.findById(branchId);
    branchName = branch?.name || null;
  }
  const user = await Users.create({
    name,
    email,
    passwordHash,
    role: ROLES.RECEPTIONIST,
    branchId: branchId || null,
    branchName,
    status: 'active',
  });
  res.status(201).json({ user: sanitizeUser(user) });
});

export const adminStats = asyncHandler(async (req, res) => {
  const [patients, doctors, pendingDoctors, appts] = await Promise.all([
    Users.count({ role: ROLES.PATIENT }),
    Doctors.count({ status: 'active' }),
    Doctors.count({ status: 'pending' }),
    Appointments.find({}),
  ]);

  const byStatus = {};
  let revenue = 0;
  for (const a of appts) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    if (a.status === APPOINTMENT_STATUS.COMPLETED) revenue += a.fee || 0;
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = appts.filter((a) => a.date === today).length;

  // Appointments over the last 7 days for a simple trend.
  const trend = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: appts.filter((a) => a.date === key).length });
  }

  // Top doctors by revenue (completed appointments).
  const revByDoctor = new Map();
  for (const a of appts) {
    if (a.status !== APPOINTMENT_STATUS.COMPLETED) continue;
    const cur = revByDoctor.get(a.doctorId) || { doctorId: a.doctorId, doctorName: a.doctorName, specialty: a.specialty, revenue: 0, visits: 0 };
    cur.revenue += a.amount || a.fee || 0;
    cur.visits += 1;
    revByDoctor.set(a.doctorId, cur);
  }
  const topDoctors = Array.from(revByDoctor.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const recentAppointments = [...appts]
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, 6);

  // Monthly appointment statistics (last 8 months) for the stacked bar chart.
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = [];
  for (let i = 7; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const inMonth = appts.filter((a) => (a.date || '').slice(0, 7) === ym);
    monthly.push({
      label: MONTHS[d.getMonth()],
      values: {
        completed: inMonth.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
        ongoing: inMonth.filter((a) => [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.PENDING].includes(a.status)).length,
        rescheduled: inMonth.filter((a) => [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.NO_SHOW].includes(a.status)).length,
      },
    });
  }

  // Income by specialty (from completed visits) + patients per specialty (donut).
  const incomeMap = new Map();
  const specialtyCount = new Map();
  for (const a of appts) {
    specialtyCount.set(a.specialty, (specialtyCount.get(a.specialty) || 0) + 1);
    if (a.status === APPOINTMENT_STATUS.COMPLETED) {
      incomeMap.set(a.specialty, (incomeMap.get(a.specialty) || 0) + (a.amount || a.fee || 0));
    }
  }
  const incomeBySpecialty = Array.from(incomeMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const specialtyDonut = Array.from(specialtyCount.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Deltas + sparks (last 7 days vs previous 7).
  const countInRange = (arr, days, offset = 0) => {
    const start = new Date(); start.setDate(start.getDate() - days - offset);
    const end = new Date(); end.setDate(end.getDate() - offset);
    const s = start.toISOString().slice(0, 10), e = end.toISOString().slice(0, 10);
    return arr.filter((x) => x >= s && x <= e).length;
  };
  const apptDates = appts.map((a) => a.date);
  const last7 = countInRange(apptDates, 7);
  const prev7 = countInRange(apptDates, 7, 7);
  const apptDelta = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : (last7 ? 100 : 0);

  res.json({
    totals: {
      patients,
      doctors,
      pendingDoctors,
      appointments: appts.length,
      todayAppointments: todayCount,
      revenue,
      receptionists: await Users.count({ role: ROLES.RECEPTIONIST }),
    },
    appointmentsByStatus: byStatus,
    trend,
    trendCounts: trend.map((x) => x.count),
    apptDelta,
    monthly,
    incomeBySpecialty,
    specialtyDonut,
    topDoctors,
    recentAppointments,
  });
});
