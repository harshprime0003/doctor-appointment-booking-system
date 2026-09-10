import { Doctors, Appointments, Reviews, Leaves } from '../repositories/index.js';
import { asyncHandler, notFound, forbidden, badRequest } from '../utils/errors.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { buildDaySlots, availableSlots, isDateBlocked } from '../utils/slots.js';
import { logAudit } from '../utils/audit.js';

// Public directory of active doctors with rich filtering, search, sorting, pagination.
export const listDoctors = asyncHandler(async (req, res) => {
  const { search, specialty, city, maxFee, minExperience, minRating, gender, language, insurance, branchId, sort } = req.query;
  const { page, pageSize, skip, limit } = parsePagination(req.query, { defaultPageSize: 9 });

  const query = { status: 'active' };
  if (specialty) query.specialty = specialty;
  if (city) query.city = { $regex: city, $options: 'i' };
  if (gender) query.gender = gender;
  if (branchId) query.branchId = branchId;
  if (maxFee) query.consultationFee = { $lte: Number(maxFee) };
  if (minExperience) query.experienceYears = { $gte: Number(minExperience) };
  if (minRating) query.rating = { $gte: Number(minRating) };

  let all = await Doctors.find(query, { sort: sortMap(sort) });

  // Post-filters for array/keyword fields (handled in-memory for the file driver).
  if (language) all = all.filter((d) => (d.languages || []).map((l) => l.toLowerCase()).includes(language.toLowerCase()));
  if (insurance) all = all.filter((d) => (d.insurances || []).includes(insurance));
  if (search) {
    const s = search.toLowerCase();
    all = all.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(s) ||
        (d.specialty || '').toLowerCase().includes(s) ||
        (d.hospital || '').toLowerCase().includes(s) ||
        (d.city || '').toLowerCase().includes(s) ||
        (d.conditions || []).some((c) => c.toLowerCase().includes(s)) ||
        (d.tags || []).some((t) => t.toLowerCase().includes(s)),
    );
  }

  const total = all.length;
  res.json(paginated(all.slice(skip, skip + limit), total, { page, pageSize }));
});

function sortMap(sort) {
  return (
    {
      rating: { rating: -1 },
      fee_asc: { consultationFee: 1 },
      fee_desc: { consultationFee: -1 },
      experience: { experienceYears: -1 },
      name: { name: 1 },
    }[sort] || { rating: -1 }
  );
}

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctors.findById(req.params.id);
  if (!doctor) throw notFound('Doctor not found');
  const reviews = await Reviews.find({ doctorId: doctor.id }, { sort: { createdAt: -1 }, limit: 20 });
  res.json({ doctor, reviews });
});

export const getDoctorSlots = asyncHandler(async (req, res) => {
  const doctor = await Doctors.findById(req.params.id);
  if (!doctor) throw notFound('Doctor not found');
  const date = req.query.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw badRequest('A valid date (YYYY-MM-DD) is required');

  const leaves = await Leaves.find({ doctorId: doctor.id });
  if (isDateBlocked(doctor, date, leaves)) {
    return res.json({ date, slots: [], blocked: true, reason: 'Doctor unavailable (holiday/leave)' });
  }
  const all = buildDaySlots(doctor, date);
  const booked = await Appointments.find({ doctorId: doctor.id, date });
  const slots = availableSlots(all, booked, { dateStr: date });
  res.json({ date, slots, blocked: false });
});

export const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const profile = await Doctors.findByUserId(req.user.id);
  if (!profile) throw notFound('Doctor profile not found');
  res.json({ doctor: profile });
});

export const updateMyDoctorProfile = asyncHandler(async (req, res) => {
  const profile = await Doctors.findByUserId(req.user.id);
  if (!profile) throw notFound('Doctor profile not found');
  const updated = await Doctors.updateById(profile.id, req.body);
  logAudit(req, { action: 'doctor.profile.update', entity: 'doctor', entityId: profile.id });
  res.json({ doctor: updated });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('No image uploaded');
  const url = `/uploads/${req.file.filename}`;
  const profile = await Doctors.findByUserId(req.user.id);
  if (profile) await Doctors.updateById(profile.id, { avatarUrl: url });
  res.json({ avatarUrl: url });
});

export const getMyPatients = asyncHandler(async (req, res) => {
  const profile = await Doctors.findByUserId(req.user.id);
  if (!profile) throw forbidden();
  const appts = await Appointments.find({ doctorId: profile.id });
  const byPatient = new Map();
  for (const a of appts) {
    const entry = byPatient.get(a.patientId) || { patientId: a.patientId, patientName: a.patientName, visits: 0, lastVisit: null };
    entry.visits += 1;
    if (!entry.lastVisit || a.date > entry.lastVisit) entry.lastVisit = a.date;
    byPatient.set(a.patientId, entry);
  }
  res.json({ data: Array.from(byPatient.values()).sort((a, b) => (b.lastVisit > a.lastVisit ? 1 : -1)) });
});
