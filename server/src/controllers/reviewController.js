import { Reviews, Appointments, Doctors } from '../repositories/index.js';
import { asyncHandler, notFound, badRequest, forbidden, conflict } from '../utils/errors.js';
import { APPOINTMENT_STATUS } from '../utils/constants.js';

export const createReview = asyncHandler(async (req, res) => {
  const { appointmentId, rating, comment } = req.body;
  const appt = await Appointments.findById(appointmentId);
  if (!appt) throw notFound('Appointment not found');
  if (appt.patientId !== req.user.id) throw forbidden();
  if (appt.status !== APPOINTMENT_STATUS.COMPLETED) {
    throw badRequest('You can only review completed appointments');
  }
  const existing = await Reviews.find({ appointmentId });
  if (existing.length) throw conflict('You have already reviewed this appointment');

  const review = await Reviews.create({
    doctorId: appt.doctorId,
    doctorName: appt.doctorName,
    patientId: req.user.id,
    patientName: req.user.name,
    appointmentId,
    rating,
    comment: comment || '',
  });

  // Recompute the doctor's rating aggregate.
  const all = await Reviews.find({ doctorId: appt.doctorId });
  const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  await Doctors.updateById(appt.doctorId, {
    rating: Math.round(avg * 10) / 10,
    ratingCount: all.length,
  });

  res.status(201).json({ review });
});
