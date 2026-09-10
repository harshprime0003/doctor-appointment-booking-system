export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatTimeRange(start, end) {
  if (!start) return '—';
  return end ? `${start} – ${end}` : start;
}

export function currency(n) {
  const value = Number(n) || 0;
  return `₹${value.toLocaleString('en-IN')}`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('');
}

export function titleCase(str = '') {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_BADGE = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-neutral',
  no_show: 'badge-danger',
  active: 'badge-success',
  inactive: 'badge-neutral',
  disabled: 'badge-danger',
};

export function statusBadgeClass(status) {
  return STATUS_BADGE[status] || 'badge-neutral';
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysStr(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
