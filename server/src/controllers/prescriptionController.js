import { Prescriptions, Appointments, Doctors } from '../repositories/index.js';
import { asyncHandler, notFound, forbidden, badRequest } from '../utils/errors.js';
import { logAudit } from '../utils/audit.js';
import { ROLES } from '../utils/constants.js';

export const createPrescription = asyncHandler(async (req, res) => {
  const profile = await Doctors.findByUserId(req.user.id);
  if (!profile) throw forbidden();

  const { appointmentId, diagnosis, medicines, advice, followUpDate, vitals } = req.body;
  const appt = await Appointments.findById(appointmentId);
  if (!appt) throw notFound('Appointment not found');
  if (appt.doctorId !== profile.id) throw forbidden('You can only prescribe for your own appointments');

  const rx = await Prescriptions.create({
    appointmentId,
    doctorId: profile.id,
    doctorName: profile.name,
    doctorQualifications: profile.qualifications || '',
    specialty: profile.specialty,
    patientId: appt.patientId,
    patientName: appt.patientName,
    date: appt.date,
    diagnosis: diagnosis || '',
    vitals: vitals || {},
    medicines: medicines || [],
    advice: advice || '',
    followUpDate: followUpDate || '',
    signature: `Dr. ${profile.name}`,
  });

  await Appointments.updateById(appointmentId, { hasPrescription: true });
  logAudit(req, { action: 'prescription.create', entity: 'prescription', entityId: rx.id, meta: { appointmentId } });
  res.status(201).json({ prescription: rx });
});

export const listPrescriptions = asyncHandler(async (req, res) => {
  const { appointmentId, patientId } = req.query;
  const query = {};
  if (appointmentId) query.appointmentId = appointmentId;

  if (req.user.role === ROLES.PATIENT) {
    query.patientId = req.user.id;
  } else if (req.user.role === ROLES.DOCTOR) {
    const profile = await Doctors.findByUserId(req.user.id);
    query.doctorId = profile?.id || '__none__';
    if (patientId) query.patientId = patientId;
  } else if (patientId) {
    query.patientId = patientId;
  }

  const list = await Prescriptions.find(query, { sort: { createdAt: -1 } });
  res.json({ data: list });
});

export const getPrescription = asyncHandler(async (req, res) => {
  const rx = await Prescriptions.findById(req.params.id);
  if (!rx) throw notFound('Prescription not found');
  if (req.user.role === ROLES.PATIENT && rx.patientId !== req.user.id) throw forbidden();
  if (req.user.role === ROLES.DOCTOR) {
    const profile = await Doctors.findByUserId(req.user.id);
    if (rx.doctorId !== profile?.id) throw forbidden();
  }
  res.json({ prescription: rx });
});
