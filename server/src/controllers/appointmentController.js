import { Appointments, Doctors, Payments, Leaves } from '../repositories/index.js';
import { asyncHandler, notFound, badRequest, forbidden, conflict } from '../utils/errors.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { buildDaySlots, availableSlots, isDateBlocked } from '../utils/slots.js';
import { computeCharges, makeInvoiceNo, makeTxnId } from '../utils/billing.js';
import { logAudit } from '../utils/audit.js';
import {
  ROLES,
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
  TRACK_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
} from '../utils/constants.js';

export const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, startTime, reason, type = 'regular', paymentMethod = 'upi' } = req.body;
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw badRequest('Invalid payment method');

  const doctor = await Doctors.findById(doctorId);
  if (!doctor || doctor.status !== 'active') throw notFound('Doctor not available for booking');

  const leaves = await Leaves.find({ doctorId });
  if (isDateBlocked(doctor, date, leaves)) throw badRequest('The doctor is not available on this date');

  const daySlots = buildDaySlots(doctor, date);
  const slot = daySlots.find((s) => s.startTime === startTime);
  if (!slot) throw badRequest("The selected time is not part of the doctor's schedule");

  const booked = await Appointments.find({ doctorId, date });
  const free = availableSlots(daySlots, booked, { dateStr: date });
  if (!free.some((s) => s.startTime === startTime)) {
    throw conflict('This slot has just been booked. Please choose another time.');
  }

  const charges = computeCharges(doctor.consultationFee, type);

  // Simulated payment (dummy gateway) — always succeeds.
  const payment = await Payments.create({
    patientId: req.user.id,
    patientName: req.user.name,
    doctorId,
    doctorName: doctor.name,
    method: paymentMethod,
    status: PAYMENT_STATUS.PAID,
    txnId: makeTxnId(),
    invoiceNo: makeInvoiceNo(),
    ...charges,
    gstNumber: '29ABCDE1234F1Z5',
    provider: 'MediPay (test)',
  });

  const activeToday = booked.filter((a) => a.status !== APPOINTMENT_STATUS.CANCELLED).length;

  const appt = await Appointments.create({
    patientId: req.user.id,
    patientName: req.user.name,
    doctorId,
    doctorName: doctor.name,
    specialty: doctor.specialty,
    branchId: doctor.branchId || null,
    branchName: doctor.branchName || null,
    date,
    startTime,
    endTime: slot.endTime,
    type,
    fee: charges.fee,
    amount: charges.total,
    reason: reason || '',
    notes: '',
    status: type === APPOINTMENT_TYPE.EMERGENCY ? APPOINTMENT_STATUS.CONFIRMED : APPOINTMENT_STATUS.PENDING,
    trackStatus: TRACK_STATUS.BOOKED,
    token: activeToday + 1,
    priority: type === APPOINTMENT_TYPE.EMERGENCY,
    paymentId: payment.id,
    paymentStatus: PAYMENT_STATUS.PAID,
    invoiceNo: payment.invoiceNo,
  });

  await Payments.updateById(payment.id, { appointmentId: appt.id });
  logAudit(req, { action: 'appointment.create', entity: 'appointment', entityId: appt.id, meta: { doctorId, date, type } });

  res.status(201).json({ appointment: appt, payment });
});

function scopeQuery(user) {
  if (user.role === ROLES.PATIENT) return { patientId: user.id };
  if (user.role === ROLES.DOCTOR) return null;
  return {}; // admin + receptionist: all
}

export const listAppointments = asyncHandler(async (req, res) => {
  const { status, date, search, from, to, trackStatus, type } = req.query;
  const { page, pageSize, skip, limit } = parsePagination(req.query);

  let query = scopeQuery(req.user);
  if (query === null) {
    const profile = await Doctors.findByUserId(req.user.id);
    query = { doctorId: profile ? profile.id : '__none__' };
  }
  query = { ...query };
  if (req.query.patientId && req.user.role !== ROLES.PATIENT) query.patientId = req.query.patientId;
  if (status) query.status = status;
  if (trackStatus) query.trackStatus = trackStatus;
  if (type) query.type = type;
  if (date) query.date = date;
  if (from) query.date = { ...(query.date || {}), $gte: from };
  if (to) query.date = { ...(query.date || {}), $lte: to };

  let all = await Appointments.find(query, { sort: { date: -1, startTime: -1 } });
  if (search) {
    const s = search.toLowerCase();
    all = all.filter(
      (a) => (a.patientName || '').toLowerCase().includes(s) || (a.doctorName || '').toLowerCase().includes(s),
    );
  }
  const total = all.length;
  res.json(paginated(all.slice(skip, skip + limit), total, { page, pageSize }));
});

export const getAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointments.findById(req.params.id);
  if (!appt) throw notFound('Appointment not found');
  await assertCanAccess(req.user, appt);
  res.json({ appointment: appt });
});

async function assertCanAccess(user, appt) {
  if (user.role === ROLES.ADMIN || user.role === ROLES.RECEPTIONIST) return;
  if (user.role === ROLES.PATIENT && appt.patientId === user.id) return;
  if (user.role === ROLES.DOCTOR) {
    const profile = await Doctors.findByUserId(user.id);
    if (profile && appt.doctorId === profile.id) return;
  }
  throw forbidden();
}

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appt = await Appointments.findById(req.params.id);
  if (!appt) throw notFound('Appointment not found');
  const { status, notes } = req.body;

  if (req.user.role === ROLES.PATIENT) {
    if (appt.patientId !== req.user.id) throw forbidden();
    if (status !== APPOINTMENT_STATUS.CANCELLED) throw forbidden('Patients can only cancel appointments');
    if ([APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED].includes(appt.status)) {
      throw badRequest('This appointment can no longer be changed');
    }
  } else {
    await assertCanAccess(req.user, appt);
  }

  const patch = { status };
  if (notes !== undefined) patch.notes = notes;
  if (status === APPOINTMENT_STATUS.CANCELLED) patch.trackStatus = TRACK_STATUS.CANCELLED;
  if (status === APPOINTMENT_STATUS.COMPLETED) patch.trackStatus = TRACK_STATUS.COMPLETED;
  const updated = await Appointments.updateById(appt.id, patch);
  logAudit(req, { action: 'appointment.status', entity: 'appointment', entityId: appt.id, meta: { status } });
  res.json({ appointment: updated });
});

// Live tracking transitions (waiting -> called -> in_consultation -> completed).
export const updateTracking = asyncHandler(async (req, res) => {
  const appt = await Appointments.findById(req.params.id);
  if (!appt) throw notFound('Appointment not found');
  if (![ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN].includes(req.user.role)) throw forbidden();
  await assertCanAccess(req.user, appt);

  const { trackStatus } = req.body;
  const allowed = Object.values(TRACK_STATUS);
  if (!allowed.includes(trackStatus)) throw badRequest('Invalid tracking status');

  const patch = { trackStatus };
  if (trackStatus === TRACK_STATUS.COMPLETED) patch.status = APPOINTMENT_STATUS.COMPLETED;
  if (trackStatus === TRACK_STATUS.IN_CONSULTATION && appt.status === APPOINTMENT_STATUS.PENDING) {
    patch.status = APPOINTMENT_STATUS.CONFIRMED;
  }
  const updated = await Appointments.updateById(appt.id, patch);
  logAudit(req, { action: 'appointment.track', entity: 'appointment', entityId: appt.id, meta: { trackStatus } });
  res.json({ appointment: updated });
});

// Live queue/token board for a doctor on a given date.
export const getQueue = asyncHandler(async (req, res) => {
  let { doctorId, date } = req.query;
  date = date || new Date().toISOString().slice(0, 10);

  if (!doctorId && req.user.role === ROLES.DOCTOR) {
    const profile = await Doctors.findByUserId(req.user.id);
    doctorId = profile?.id;
  }
  if (!doctorId) throw badRequest('doctorId is required');

  const doctor = await Doctors.findById(doctorId);
  const appts = await Appointments.find({ doctorId, date }, { sort: { token: 1 } });
  const active = appts.filter((a) => a.status !== APPOINTMENT_STATUS.CANCELLED);

  const serving = active.find((a) => a.trackStatus === TRACK_STATUS.IN_CONSULTATION);
  const called = active.find((a) => a.trackStatus === TRACK_STATUS.CALLED);
  const waiting = active.filter((a) => [TRACK_STATUS.BOOKED, TRACK_STATUS.WAITING].includes(a.trackStatus));
  const completed = active.filter((a) => a.trackStatus === TRACK_STATUS.COMPLETED);

  const avgMinutes = 15;
  const queue = active.map((a, idx) => ({
    id: a.id,
    token: a.token,
    patientName: a.patientName,
    startTime: a.startTime,
    trackStatus: a.trackStatus,
    status: a.status,
    type: a.type,
    estimatedWaitMin: [TRACK_STATUS.BOOKED, TRACK_STATUS.WAITING].includes(a.trackStatus)
      ? waiting.findIndex((w) => w.id === a.id) * avgMinutes + avgMinutes
      : 0,
  }));

  res.json({
    doctorId,
    doctorName: doctor?.name,
    date,
    nowServing: serving ? serving.token : called ? called.token : null,
    servingPatient: serving?.patientName || called?.patientName || null,
    counts: { waiting: waiting.length, completed: completed.length, total: active.length },
    queue,
  });
});
