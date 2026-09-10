import { Doctors, Payments, Appointments } from '../repositories/index.js';
import { asyncHandler, notFound, badRequest } from '../utils/errors.js';
import { computeCharges } from '../utils/billing.js';
import { APPOINTMENT_TYPE } from '../utils/constants.js';

// Returns the price breakdown for a prospective booking (used by the checkout UI).
export const quote = asyncHandler(async (req, res) => {
  const { doctorId, type } = req.body;
  const doctor = await Doctors.findById(doctorId);
  if (!doctor) throw notFound('Doctor not found');
  const charges = computeCharges(doctor.consultationFee, type || APPOINTMENT_TYPE.REGULAR);
  res.json({
    doctorName: doctor.name,
    orderId: `order_${Math.random().toString(36).slice(2, 12)}`,
    currency: 'INR',
    ...charges,
  });
});

// A patient's own payment history + spend summary.
export const myPayments = asyncHandler(async (req, res) => {
  const all = await Payments.find({ patientId: req.user.id }, { sort: { createdAt: -1 } });
  const summary = {
    totalSpent: all.reduce((s, p) => s + (p.total || 0), 0),
    count: all.length,
    lastPayment: all[0] || null,
  };
  res.json({ data: all, summary });
});

// Returns the invoice for a paid appointment.
export const getInvoice = asyncHandler(async (req, res) => {
  const appt = await Appointments.findById(req.params.id);
  if (!appt) throw notFound('Appointment not found');
  if (req.user.role === 'patient' && appt.patientId !== req.user.id) throw notFound('Appointment not found');
  const payment = appt.paymentId ? await Payments.findById(appt.paymentId) : null;
  if (!payment) throw badRequest('No invoice available for this appointment');
  res.json({ appointment: appt, payment });
});
