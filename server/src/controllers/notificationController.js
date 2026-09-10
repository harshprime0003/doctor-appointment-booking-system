import { Appointments, Prescriptions, Records, Users } from '../repositories/index.js';
import { asyncHandler } from '../utils/errors.js';
import { ROLES, APPOINTMENT_STATUS } from '../utils/constants.js';

// Computed notification feed for the current user (no persistence needed).
export const getNotifications = asyncHandler(async (req, res) => {
  const items = [];
  const today = new Date().toISOString().slice(0, 10);

  if (req.user.role === ROLES.PATIENT) {
    const appts = await Appointments.find({ patientId: req.user.id }, { sort: { date: -1 } });
    for (const a of appts) {
      if (a.date >= today && [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.PENDING].includes(a.status)) {
        items.push({
          id: `appt-${a.id}`, type: 'appointment', icon: 'calendar', color: 'indigo',
          title: a.status === APPOINTMENT_STATUS.CONFIRMED ? 'Appointment confirmed' : 'Appointment requested',
          text: `${a.doctorName} on ${a.date} at ${a.startTime}`,
          time: a.updatedAt || a.createdAt, link: `/app/appointments/${a.id}`,
        });
      }
      if (a.trackStatus === 'called' || a.trackStatus === 'in_consultation') {
        items.push({
          id: `queue-${a.id}`, type: 'queue', icon: 'ticket', color: 'teal',
          title: a.trackStatus === 'called' ? "You've been called" : "It's your turn",
          text: `Token #${a.token} with ${a.doctorName}`,
          time: a.updatedAt, link: '/app',
        });
      }
    }
    const rx = await Prescriptions.find({ patientId: req.user.id }, { sort: { createdAt: -1 }, limit: 5 });
    for (const p of rx) {
      items.push({
        id: `rx-${p.id}`, type: 'prescription', icon: 'pill', color: 'rose',
        title: 'New prescription available', text: `${p.doctorName} · ${p.diagnosis || 'Prescription'}`,
        time: p.createdAt, link: '/app/prescriptions',
      });
    }
    const recs = await Records.find({ patientId: req.user.id }, { sort: { createdAt: -1 }, limit: 5 });
    for (const r of recs) {
      if (r.uploadedByRole && r.uploadedByRole !== 'patient') {
        items.push({
          id: `rec-${r.id}`, type: 'record', icon: 'fileText', color: 'sky',
          title: 'Report added to your records', text: `${r.title} · by ${r.uploadedBy}`,
          time: r.createdAt, link: '/app/records',
        });
      }
    }
  }

  items.sort((a, b) => (String(b.time) > String(a.time) ? 1 : -1));

  const readAt = req.user.notificationsReadAt || '1970-01-01T00:00:00.000Z';
  const withRead = items.map((n) => ({ ...n, read: n.time ? String(n.time) <= String(readAt) : false }));
  const unread = withRead.filter((n) => !n.read).length;
  res.json({ data: withRead.slice(0, 30), unread });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Users.updateById(req.user.id, { notificationsReadAt: new Date().toISOString() });
  res.json({ unread: 0 });
});
