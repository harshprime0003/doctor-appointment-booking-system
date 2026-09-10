import { Appointments, Doctors, Leaves, Vitals, Prescriptions, Records, Payments } from '../repositories/index.js';
import { asyncHandler } from '../utils/errors.js';
import { ROLES, APPOINTMENT_STATUS, TRACK_STATUS } from '../utils/constants.js';

const today = () => new Date().toISOString().slice(0, 10);
const dayOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function summarize(appts) {
  const byStatus = {};
  for (const a of appts) byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  return byStatus;
}

// Revenue for a single date: `earned` = completed appointments, `expected` =
// all non-cancelled appointments booked for that day.
function revenueForDate(appts, dateStr) {
  const onDay = appts.filter((a) => a.date === dateStr && a.status !== APPOINTMENT_STATUS.CANCELLED);
  const earned = onDay
    .filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED)
    .reduce((s, a) => s + (a.amount || a.fee || 0), 0);
  const expected = onDay.reduce((s, a) => s + (a.amount || a.fee || 0), 0);
  return { earned, expected, count: onDay.length };
}

export const dashboard = asyncHandler(async (req, res) => {
  const t = today();

  if (req.user.role === ROLES.PATIENT) {
    const appts = await Appointments.find({ patientId: req.user.id }, { sort: { date: -1, startTime: -1 } });
    const upcoming = appts
      .filter((a) => a.date >= t && [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED].includes(a.status))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // Live queue status for the patient's active appointment today.
    let liveQueue = null;
    const activeToday = appts.find(
      (a) => a.date === t && [TRACK_STATUS.BOOKED, TRACK_STATUS.WAITING, TRACK_STATUS.CALLED, TRACK_STATUS.IN_CONSULTATION].includes(a.trackStatus),
    );
    if (activeToday) {
      const dayAppts = (await Appointments.find({ doctorId: activeToday.doctorId, date: t }))
        .filter((a) => a.status !== APPOINTMENT_STATUS.CANCELLED)
        .sort((a, b) => a.token - b.token);
      const serving = dayAppts.find((a) => a.trackStatus === TRACK_STATUS.IN_CONSULTATION)
        || dayAppts.find((a) => a.trackStatus === TRACK_STATUS.CALLED);
      const aheadOf = dayAppts.filter(
        (a) => a.token < activeToday.token && [TRACK_STATUS.BOOKED, TRACK_STATUS.WAITING, TRACK_STATUS.CALLED].includes(a.trackStatus),
      ).length;
      liveQueue = {
        appointmentId: activeToday.id,
        doctorName: activeToday.doctorName,
        yourToken: activeToday.token,
        nowServing: serving ? serving.token : null,
        trackStatus: activeToday.trackStatus,
        peopleAhead: activeToday.trackStatus === TRACK_STATUS.IN_CONSULTATION ? 0 : aheadOf,
        estimatedWaitMin: activeToday.trackStatus === TRACK_STATUS.IN_CONSULTATION ? 0 : aheadOf * 15,
        startTime: activeToday.startTime,
      };
    }

    // Extra data for the redesigned patient dashboard.
    const [vitals, prescriptions, records, topDocs] = await Promise.all([
      Vitals.find({ patientId: req.user.id }, { sort: { date: 1, createdAt: 1 } }),
      Prescriptions.find({ patientId: req.user.id }, { sort: { createdAt: -1 } }),
      Records.find({ patientId: req.user.id }),
      Doctors.find({ status: 'active' }, { sort: { rating: -1 }, limit: 3 }),
    ]);
    const latestVitals = vitals.length ? vitals[vitals.length - 1] : null;
    const medications = prescriptions[0]?.medicines || [];

    // A light-hearted "health score" derived from engagement + recency.
    const completedCount = appts.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length;
    let healthScore = 62;
    if (records.length) healthScore += 8;
    if (vitals.length) healthScore += 10;
    if (prescriptions.length) healthScore += 5;
    if (completedCount) healthScore += 8;
    if (upcoming.length) healthScore += 5;
    healthScore = Math.min(96, healthScore);

    const payments = await Payments.find({ patientId: req.user.id }, { sort: { createdAt: -1 } });
    const totalSpent = payments.reduce((s, p) => s + (p.total || 0), 0);

    // Monthly appointment + spend history (last 12 months) for charts + sparklines.
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = [];
    const spendMonthly = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const inMonth = appts.filter((a) => (a.date || '').slice(0, 7) === ym);
      monthly.push({
        label: MONTHS[d.getMonth()],
        values: {
          completed: inMonth.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
          upcoming: inMonth.filter((a) => [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.PENDING].includes(a.status)).length,
          cancelled: inMonth.filter((a) => [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.NO_SHOW].includes(a.status)).length,
        },
      });
      // Spend per month derived from completed appointments' dates (spread over time).
      spendMonthly.push(inMonth.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).reduce((s, a) => s + (a.amount || a.fee || 0), 0));
    }
    const apptSpark = monthly.map((m) => m.values.completed + m.values.upcoming + m.values.cancelled);
    const completedSpark = monthly.map((m) => m.values.completed);
    const upcomingSpark = monthly.map((m) => m.values.upcoming);
    const cancelledCount = appts.filter((a) => [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.NO_SHOW].includes(a.status)).length;

    const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : (a ? 100 : 0));
    const last = (arr) => arr[arr.length - 1] || 0;
    const prev = (arr) => arr[arr.length - 2] || 0;

    // Visits by specialty (donut) + spending by treatment.
    const specCount = new Map();
    const specSpend = new Map();
    for (const a of appts) {
      specCount.set(a.specialty, (specCount.get(a.specialty) || 0) + 1);
      if (a.status === APPOINTMENT_STATUS.COMPLETED) specSpend.set(a.specialty, (specSpend.get(a.specialty) || 0) + (a.amount || a.fee || 0));
    }
    const specialtyDonut = Array.from(specCount.entries()).map(([label, value]) => ({ label, value })).sort((x, y) => y.value - x.value).slice(0, 5);
    const spendingByTreatment = Array.from(specSpend.entries()).map(([label, value]) => ({ label, value })).sort((x, y) => y.value - x.value).slice(0, 6);

    return res.json({
      role: ROLES.PATIENT,
      monthly,
      kpis: {
        appointments: { value: appts.length, delta: pct(last(apptSpark), prev(apptSpark)), spark: apptSpark },
        completed: { value: completedCount, delta: pct(last(completedSpark), prev(completedSpark)), spark: completedSpark },
        upcoming: { value: upcoming.length, delta: pct(last(upcomingSpark), prev(upcomingSpark)), spark: upcomingSpark },
        spent: { value: totalSpent, delta: pct(last(spendMonthly), prev(spendMonthly)), spark: spendMonthly },
      },
      statLegend: { total: appts.length, completed: completedCount, upcoming: upcoming.length, cancelled: cancelledCount },
      totals: {
        total: appts.length,
        upcoming: upcoming.length,
        completed: completedCount,
        prescriptions: prescriptions.length,
        records: records.length,
      },
      byStatus: summarize(appts),
      upcoming: upcoming.slice(0, 6),
      recent: appts.slice(0, 6),
      calendar: appts.map((a) => ({ id: a.id, date: a.date, startTime: a.startTime, doctorName: a.doctorName, specialty: a.specialty, status: a.status })),
      liveQueue,
      healthScore,
      latestVitals,
      vitalsTrend: vitals.slice(-7),
      medications: medications.slice(0, 4),
      recommendedDoctors: topDocs,
      specialtyDonut,
      spendingByTreatment,
      recentPayments: payments.slice(0, 5),
    });
  }

  if (req.user.role === ROLES.DOCTOR) {
    const profile = await Doctors.findByUserId(req.user.id);
    const doctorId = profile ? profile.id : '__none__';
    const appts = await Appointments.find({ doctorId }, { sort: { date: -1, startTime: -1 } });
    const todays = appts
      .filter((a) => a.date === t)
      .sort((a, b) => (a.startTime > b.startTime ? 1 : -1));
    const patientIds = new Set(appts.map((a) => a.patientId));
    const revenue = appts
      .filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED)
      .reduce((s, a) => s + (a.fee || 0), 0);
    return res.json({
      role: ROLES.DOCTOR,
      profileStatus: profile ? profile.status : 'missing',
      totals: {
        today: todays.length,
        total: appts.length,
        pending: appts.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length,
        patients: patientIds.size,
        revenue,
        rating: profile ? profile.rating : 0,
      },
      byStatus: summarize(appts),
      today: todays,
      recent: appts.slice(0, 6),
      revenueByDay: {
        yesterday: revenueForDate(appts, dayOffset(-1)),
        today: revenueForDate(appts, t),
        tomorrow: revenueForDate(appts, dayOffset(1)),
      },
      appointmentsByDay: {
        yesterday: appts.filter((a) => a.date === dayOffset(-1)).length,
        today: todays.length,
        tomorrow: appts.filter((a) => a.date === dayOffset(1)).length,
      },
    });
  }

  if (req.user.role === ROLES.RECEPTIONIST) {
    const appts = await Appointments.find({ date: t }, { sort: { startTime: 1 } });
    const active = appts.filter((a) => a.status !== APPOINTMENT_STATUS.CANCELLED);
    const pendingLeaves = await Leaves.find({ status: 'pending' });
    return res.json({
      role: ROLES.RECEPTIONIST,
      totals: {
        today: active.length,
        waiting: active.filter((a) => [TRACK_STATUS.BOOKED, TRACK_STATUS.WAITING].includes(a.trackStatus)).length,
        inConsultation: active.filter((a) => a.trackStatus === TRACK_STATUS.IN_CONSULTATION).length,
        completed: active.filter((a) => a.trackStatus === TRACK_STATUS.COMPLETED).length,
        pendingLeaves: pendingLeaves.length,
        emergencies: active.filter((a) => a.type === 'emergency').length,
      },
      byStatus: summarize(appts),
      today: active.slice(0, 12),
    });
  }

  return res.json({ role: req.user.role });
});
