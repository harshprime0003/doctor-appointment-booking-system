import { Vitals } from '../repositories/index.js';
import { asyncHandler, notFound, forbidden, badRequest } from '../utils/errors.js';
import { ROLES } from '../utils/constants.js';

export const listVitals = asyncHandler(async (req, res) => {
  let patientId = req.user.id;
  if (req.user.role !== ROLES.PATIENT) {
    if (!req.query.patientId) throw badRequest('patientId is required');
    patientId = req.query.patientId;
  }
  const data = await Vitals.find({ patientId }, { sort: { date: 1, createdAt: 1 } });
  res.json({ data });
});

export const addVitals = asyncHandler(async (req, res) => {
  const { date, bp, pulse, weight, sugar, temp, spo2 } = req.body;
  const entry = await Vitals.create({
    patientId: req.user.id,
    patientName: req.user.name,
    date: date || new Date().toISOString().slice(0, 10),
    bp: bp || '',
    pulse: pulse ? Number(pulse) : null,
    weight: weight ? Number(weight) : null,
    sugar: sugar ? Number(sugar) : null,
    temp: temp ? Number(temp) : null,
    spo2: spo2 ? Number(spo2) : null,
  });
  res.status(201).json({ vital: entry });
});

export const deleteVitals = asyncHandler(async (req, res) => {
  const entry = await Vitals.findById(req.params.id);
  if (!entry) throw notFound('Entry not found');
  if (entry.patientId !== req.user.id) throw forbidden();
  await Vitals.deleteById(entry.id);
  res.json({ message: 'Removed' });
});
