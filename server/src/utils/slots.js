// Slot / availability helpers. Times are "HH:MM" 24h strings; dates are "YYYY-MM-DD".

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function weekdayOf(dateStr) {
  return new Date(`${dateStr}T00:00:00`).getDay();
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Is the doctor fully unavailable on this date (holiday / vacation / approved leave)?
export function isDateBlocked(doctor, dateStr, leaves = []) {
  const blocked = doctor.blockedDates || [];
  if (blocked.includes(dateStr)) return true;
  return leaves.some((l) => l.status === 'approved' && dateStr >= l.from && dateStr <= l.to);
}

// Build the full set of possible slots for a doctor on a given date, excluding
// break windows configured on the doctor.
export function buildDaySlots(doctor, dateStr) {
  const availability = doctor.availability || [];
  const breaks = doctor.breaks || [];
  const day = weekdayOf(dateStr);
  const blocks = availability.filter((b) => Number(b.day) === day);
  const dayBreaks = breaks.filter((b) => Number(b.day) === day);
  const slots = [];
  for (const block of blocks) {
    const step = Number(block.slotMinutes) || 30;
    const start = toMinutes(block.startTime);
    const end = toMinutes(block.endTime);
    for (let t = start; t + step <= end; t += step) {
      const inBreak = dayBreaks.some((br) => overlaps(t, t + step, toMinutes(br.startTime), toMinutes(br.endTime)));
      if (!inBreak) slots.push({ startTime: toHHMM(t), endTime: toHHMM(t + step) });
    }
  }
  return slots.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}

export function availableSlots(allSlots, bookedAppointments = [], { dateStr, now = new Date() } = {}) {
  const bookedStarts = new Set(
    bookedAppointments.filter((a) => a.status !== 'cancelled').map((a) => a.startTime),
  );
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = now.toISOString().slice(0, 10);
  return allSlots.filter((s) => {
    if (bookedStarts.has(s.startTime)) return false;
    if (dateStr === todayStr && toMinutes(s.startTime) <= nowMinutes) return false;
    return true;
  });
}
