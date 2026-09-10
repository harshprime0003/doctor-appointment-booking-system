import path from 'node:path';
import { Records, Doctors, Appointments, Users } from '../repositories/index.js';
import { asyncHandler, notFound, forbidden, badRequest } from '../utils/errors.js';
import { logAudit } from '../utils/audit.js';
import { ROLES } from '../utils/constants.js';

const RECORD_TYPES = ['lab_report', 'prescription', 'x_ray', 'mri', 'ct_scan', 'vaccination', 'other'];

// Naive OCR-style extraction stub: for demo we surface basic file metadata and a
// short note. Real OCR could plug in here (Tesseract, cloud OCR) without changing
// the API shape.
function fakeOcr(file, title) {
  const ext = path.extname(file.originalname).replace('.', '').toUpperCase();
  return `Detected ${ext} document "${title}". Auto-extract will index text when OCR is enabled.`;
}

export const uploadRecord = asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('No file uploaded');
  const { title, type, notes } = req.body;
  if (type && !RECORD_TYPES.includes(type)) throw badRequest('Invalid record type');

  // Patients upload for themselves; staff (receptionist/admin) upload for a patient.
  let patientId = req.user.id;
  let patientName = req.user.name;
  if (req.user.role !== ROLES.PATIENT) {
    if (!req.body.patientId) throw badRequest('patientId is required');
    const patient = await Users.findById(req.body.patientId);
    if (!patient || patient.role !== ROLES.PATIENT) throw notFound('Patient not found');
    patientId = patient.id;
    patientName = patient.name;
  }

  const record = await Records.create({
    patientId,
    patientName,
    uploadedBy: req.user.name,
    uploadedByRole: req.user.role,
    title: title || req.file.originalname,
    type: type || 'other',
    notes: notes || '',
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    ocrText: fakeOcr(req.file, title || req.file.originalname),
  });
  logAudit(req, { action: 'record.upload', entity: 'record', entityId: record.id, meta: { type, patientId } });
  res.status(201).json({ record });
});

export const updateRecord = asyncHandler(async (req, res) => {
  const record = await Records.findById(req.params.id);
  if (!record) throw notFound('Record not found');
  if (req.user.role === ROLES.PATIENT && record.patientId !== req.user.id) throw forbidden();
  const patch = {};
  const { title, type, notes } = req.body;
  if (title !== undefined) patch.title = title;
  if (type !== undefined) {
    if (!RECORD_TYPES.includes(type)) throw badRequest('Invalid record type');
    patch.type = type;
  }
  if (notes !== undefined) patch.notes = notes;
  const updated = await Records.updateById(record.id, patch);
  logAudit(req, { action: 'record.update', entity: 'record', entityId: record.id });
  res.json({ record: updated });
});

export const listRecords = asyncHandler(async (req, res) => {
  let patientId = req.user.id;
  if (req.user.role !== ROLES.PATIENT) {
    if (!req.query.patientId) throw badRequest('patientId is required');
    patientId = req.query.patientId;
    // A doctor may only view records of patients who have an appointment with them.
    if (req.user.role === ROLES.DOCTOR) {
      const profile = await Doctors.findByUserId(req.user.id);
      const link = await Appointments.find({ doctorId: profile?.id, patientId }, { limit: 1 });
      if (!link.length) throw forbidden('You can only view records of your own patients');
    }
  }
  const query = { patientId };
  if (req.query.type) query.type = req.query.type;
  const data = await Records.find(query, { sort: { createdAt: -1 } });
  res.json({ data });
});

export const deleteRecord = asyncHandler(async (req, res) => {
  const record = await Records.findById(req.params.id);
  if (!record) throw notFound('Record not found');
  if (req.user.role === ROLES.PATIENT && record.patientId !== req.user.id) throw forbidden();
  await Records.deleteById(record.id);
  res.json({ message: 'Record removed' });
});
