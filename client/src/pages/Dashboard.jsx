import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { DashboardApi } from '../api/dashboard.js';
import { AdminApi } from '../api/endpoints.js';
import { PageHeader } from '../components/Breadcrumbs.jsx';
import { StatCard, Section, Loading, Alert, StatusBadge, Stars, Badge, Avatar, Button } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Icon from '../components/Icon.jsx';
import Sparkline from '../components/Sparkline.jsx';
import SpecialtyChip from '../components/SpecialtyChip.jsx';
import StatTile from '../components/StatTile.jsx';
import KpiCard from '../components/KpiCard.jsx';
import Calendar from '../components/Calendar.jsx';
import { BarChart, Donut } from '../components/Charts.jsx';
import { currency, formatDate, formatTimeRange, titleCase } from '../utils/format.js';
import { doctorAvatar } from '../utils/doctor.js';

const SPEC_COLORS = ['#6366f1', '#14b8a6', '#8b5cf6', '#f59e0b', '#f43f5e', '#0ea5e9'];
const APPT_SERIES = [
  { key: 'completed', color: '#14b8a6', label: 'Completed' },
  { key: 'ongoing', color: '#6366f1', label: 'Ongoing' },
  { key: 'rescheduled', color: '#8b5cf6', label: 'Cancelled' },
];
const PT_SERIES = [
  { key: 'completed', color: '#14b8a6', label: 'Completed' },
  { key: 'upcoming', color: '#3b82f6', label: 'Upcoming' },
  { key: 'cancelled', color: '#1e3a8a', label: 'Cancelled' },
];

function ChartLegend({ series, data }) {
  const totals = {};
  (data || []).forEach((d) => series.forEach((s) => { totals[s.key] = (totals[s.key] || 0) + (d.values[s.key] || 0); }));
  return (
    <div className="chart-legend">
      {series.map((s) => (
        <span className="lg" key={s.key}><span className="sw" style={{ background: s.color }} /> {s.label} <strong>{totals[s.key] || 0}</strong></span>
      ))}
    </div>
  );
}

function MiniBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130, padding: '8px 4px' }}>
      {data.map((d) => (
        <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div className="tiny muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{d.count}</div>
          <div title={`${d.date}: ${d.count}`} style={{ width: '100%', maxWidth: 42, height: `${(d.count / max) * 88}px`, minHeight: 4, background: 'var(--primary)', borderRadius: '4px 4px 0 0' }} />
          <div className="tiny muted">{new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</div>
        </div>
      ))}
    </div>
  );
}

const apptColumns = (t) => [
  { key: 'date', header: t('col.date'), render: (r) => formatDate(r.date) },
  { key: 'time', header: t('col.time'), render: (r) => <span className="mono">{formatTimeRange(r.startTime, r.endTime)}</span> },
  { key: 'with', header: t('col.with'), render: (r) => r.doctorName || r.patientName },
  { key: 'status', header: t('col.status'), render: (r) => <StatusBadge status={r.status} /> },
];

function PatientLiveQueue({ initial }) {
  const [lq, setLq] = useState(initial);
  useEffect(() => {
    if (!initial) return undefined;
    const poll = () => DashboardApi.get().then((d) => setLq(d.liveQueue)).catch(() => {});
    const id = setInterval(poll, 12000);
    return () => clearInterval(id);
  }, [initial]);
  if (!lq) return null;
  const isServing = lq.trackStatus === 'in_consultation';
  const isCalled = lq.trackStatus === 'called';
  return (
    <div className="live-queue-card">
      <div className="lq-left">
        <div className="lq-badge"><span className="ns-live-dot" /> LIVE QUEUE</div>
        <div className="lq-title">
          {isServing ? "It's your turn now" : isCalled ? 'You have been called' : `You're in the queue with ${lq.doctorName}`}
        </div>
        <div className="lq-sub">{lq.doctorName} · {lq.startTime}</div>
        <div className="lq-metrics">
          <div><strong>#{lq.yourToken}</strong><span>Your token</span></div>
          <div><strong>{lq.nowServing != null ? `#${lq.nowServing}` : '—'}</strong><span>Now serving</span></div>
          <div><strong>{lq.peopleAhead}</strong><span>Ahead of you</span></div>
          <div><strong>~{lq.estimatedWaitMin}m</strong><span>Est. wait</span></div>
        </div>
      </div>
      <div className={`lq-token-badge${isServing ? ' serving' : ''}`}>
        <Icon name={isServing ? 'stethoscope' : 'ticket'} size={26} />
        <div className="lq-token-num">#{lq.yourToken}</div>
      </div>
    </div>
  );
}

function HealthRing({ score = 0 }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const [p, setP] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setP(score), 150);
    return () => clearTimeout(id);
  }, [score]);
  const dash = (p / 100) * c;
  return (
    <div className="health-ring-wrap">
      <div className="health-ring">
        <svg className="hr-spin" width="132" height="132" viewBox="0 0 132 132">
          <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="7" strokeDasharray="2 8" strokeLinecap="round" />
        </svg>
        <svg width="132" height="132" viewBox="0 0 132 132" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="10" />
          <circle
            cx="66" cy="66" r={r} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`} transform="rotate(-90 66 66)"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="hr-center">
          <div className="hr-score">{score}</div>
          <div className="hr-out">of 100</div>
        </div>
      </div>
      <div className="hr-caption">Health Score</div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { to: '/app/doctors', label: 'Find a Doctor', icon: 'stethoscope', cls: 'qa-indigo' },
  { to: '/app/symptom-checker', label: 'AI Symptom Checker', icon: 'activity', cls: 'qa-violet' },
  { to: '/app/appointments', label: 'My Appointments', icon: 'calendar', cls: 'qa-teal' },
  { to: '/app/prescriptions', label: 'Prescriptions', icon: 'pill', cls: 'qa-rose' },
  { to: '/app/records', label: 'Health Records', icon: 'fileText', cls: 'qa-sky' },
  { to: '/app/vitals', label: 'Vitals Tracker', icon: 'heart', cls: 'qa-amber' },
];

const TIPS = [
  { cls: 'tip-1', icon: 'activity', title: 'Stay hydrated', text: 'Aim for 8 glasses of water a day to keep energy levels up.' },
  { cls: 'tip-2', icon: 'heart', title: 'Move daily', text: '30 minutes of brisk walking improves heart health.' },
  { cls: 'tip-3', icon: 'clock', title: 'Sleep well', text: '7–8 hours of sleep boosts immunity and focus.' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function PatientDashboard({ data }) {
  const { t } = useI18n();
  const cols = apptColumns(t);
  const k = data.kpis || {};
  const leg = data.statLegend || {};
  const donut = (data.specialtyDonut || []).map((d, i) => ({ ...d, color: SPEC_COLORS[i % SPEC_COLORS.length] }));
  const cal = data.calendar || [];
  const marked = new Set(cal.filter((a) => a.status !== 'cancelled' && a.status !== 'no_show').map((a) => a.date));
  const [selDate, setSelDate] = useState(null);
  const dayItems = selDate ? cal.filter((a) => a.date === selDate) : (data.upcoming || []);
  const kget = (key) => k[key] || { value: 0, delta: 0, spark: [] };

  return (
    <>
      <div className="tile-grid">
        <KpiCard label="Appointments" value={kget('appointments').value} icon="calendar" color="#6366f1" chartType="bar" rounded chartColor="#6366f1" accent="#f97316" delta={`${Math.abs(kget('appointments').delta)}%`} deltaUp={kget('appointments').delta >= 0} spark={kget('appointments').spark} />
        <KpiCard label="Upcoming" value={kget('upcoming').value} icon="clock" color="#f97316" chartType="area" chartColor="#f97316" delta={`${Math.abs(kget('upcoming').delta)}%`} deltaUp={kget('upcoming').delta >= 0} spark={kget('appointments').spark} />
        <KpiCard label="Completed" value={kget('completed').value} icon="checkCircle" color="#06b6d4" chartType="bar" chartColor="#06b6d4" delta={`${Math.abs(kget('completed').delta)}%`} deltaUp={kget('completed').delta >= 0} spark={kget('completed').spark} />
        <KpiCard label="Total Spent" value={currency(kget('spent').value)} icon="dollar" color="#22c55e" chartType="area" chartColor="#22c55e" delta={`${Math.abs(kget('spent').delta)}%`} deltaUp={kget('spent').delta >= 0} spark={kget('spent').spark} />
      </div>

      {/* Statistics chart + calendar side by side (equal height, compact) */}
      <div className="grid-2 eq" style={{ marginBottom: 20 }}>
        <div className="dash-card col-card" style={{ margin: 0 }}>
          <div className="dash-card-head" style={{ padding: '12px 16px' }}>
            <h3>Appointment Statistics</h3>
            <div className="stat-legend">
              <div className="sl"><div className="sl-top"><span className="sl-dot" style={{ background: '#6366f1' }} /> All</div><div className="sl-num">{leg.total || 0}</div></div>
              <div className="sl"><div className="sl-top"><span className="sl-dot" style={{ background: '#14b8a6' }} /> Completed</div><div className="sl-num">{leg.completed || 0}</div></div>
              <div className="sl"><div className="sl-top"><span className="sl-dot" style={{ background: '#3b82f6' }} /> Upcoming</div><div className="sl-num">{leg.upcoming || 0}</div></div>
              <div className="sl"><div className="sl-top"><span className="sl-dot" style={{ background: '#1e3a8a' }} /> Cancelled</div><div className="sl-num">{leg.cancelled || 0}</div></div>
            </div>
          </div>
          <div className="dash-card-body chart-fill" style={{ padding: '8px 14px 10px' }}><BarChart data={data.monthly || []} series={PT_SERIES} height={300} fill /></div>
        </div>

        <div className="dash-card col-card" style={{ margin: 0 }}>
          <div className="dash-card-head" style={{ padding: '12px 16px' }}><h3>Appointments</h3><Link to="/app/appointments" className="btn btn-sm btn-ghost">{t('common.viewAll')}</Link></div>
          <div className="dash-card-body" style={{ padding: '8px 14px 6px' }}>
            <Calendar marked={marked} selected={selDate} onSelect={(d) => setSelDate((cur) => (cur === d ? null : d))} />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px 12px' }}>
            <div className="tiny muted" style={{ margin: '2px 0 6px', fontWeight: 600 }}>{selDate ? `On ${formatDate(selDate)}` : 'Upcoming visits'}</div>
            {dayItems.length === 0 ? (
              <p className="muted tiny" style={{ margin: '4px 0' }}>No appointments.</p>
            ) : dayItems.slice(0, 2).map((a) => (
              <div className="appt-mini" key={a.id} style={{ padding: '8px 0' }}>
                <span className="am-bar" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cell-strong">{a.doctorName}</div>
                  <div className="tiny muted">{formatDate(a.date)} · {a.startTime} · {a.specialty}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="dash-card">
          <div className="dash-card-head"><h3>Recommended doctors</h3><Link to="/app/doctors" className="btn btn-sm btn-ghost">Browse</Link></div>
          <div className="dash-card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {(data.recommendedDoctors || []).map((d) => (
              <div className="rec-doc" key={d.id}>
                <Avatar name={d.name} src={doctorAvatar(d)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cell-strong">{d.name}</div>
                  <div style={{ marginTop: 2 }}><SpecialtyChip specialty={d.specialty} /></div>
                </div>
                <Link to={`/app/doctors/${d.id}`} className="btn btn-primary btn-sm">Book</Link>
              </div>
            ))}
            {(!data.recommendedDoctors || data.recommendedDoctors.length === 0) && <p className="muted tiny">—</p>}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head"><h3>Visits by specialty</h3></div>
          <div className="dash-card-body">
            {donut.length ? <Donut segments={donut} centerValue={leg.total || 0} centerLabel="Visits" size={150} /> : <p className="muted tiny">—</p>}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head"><h3>Spending by treatment</h3></div>
          <div className="dash-card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {(data.spendingByTreatment || []).map((it, i) => (
              <div className="income-row" key={it.label}>
                <span className="income-dot" style={{ background: `${SPEC_COLORS[i % SPEC_COLORS.length]}1a`, color: SPEC_COLORS[i % SPEC_COLORS.length] }}><Icon name="activity" size={15} /></span>
                <div style={{ flex: 1, minWidth: 0 }} className="cell-strong">{it.label}</div>
                <div className="cell-strong">{currency(it.value)}</div>
              </div>
            ))}
            {(!data.spendingByTreatment || data.spendingByTreatment.length === 0) && <p className="muted tiny">No completed visits yet.</p>}
          </div>
        </div>

      </div>

      <div className="grid-2">
        <div className="dash-card">
          <div className="dash-card-head"><h3>My appointments</h3><Link to="/app/appointments" className="btn btn-sm btn-ghost">{t('common.viewAll')}</Link></div>
          <DataTable columns={cols} rows={data.recent} empty={<div className="empty-state"><p className="muted">—</p></div>} />
        </div>
        <div className="dash-card">
          <div className="dash-card-head"><h3>Recent transactions</h3><Link to="/app/billing" className="btn btn-sm btn-ghost">Billing</Link></div>
          <div className="dash-card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {(data.recentPayments || []).map((p) => (
              <div className="income-row" key={p.id}>
                <span className="income-dot" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}><Icon name="creditCard" size={15} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cell-strong">{p.doctorName}</div>
                  <div className="tiny muted mono">{p.invoiceNo}</div>
                </div>
                <div className="cell-strong" style={{ color: 'var(--success)' }}>{currency(p.total)}</div>
              </div>
            ))}
            {(!data.recentPayments || data.recentPayments.length === 0) && <p className="muted tiny">No transactions yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

function DayToggle({ value, onChange }) {
  const { t } = useI18n();
  return (
    <div className="lang-switch">
      {['yesterday', 'today', 'tomorrow'].map((d) => (
        <button key={d} className={value === d ? 'active' : ''} onClick={() => onChange(d)}>
          {t(`common.${d}`)}
        </button>
      ))}
    </div>
  );
}

function DoctorDashboard({ data }) {
  const { t } = useI18n();
  const cols = apptColumns(t);
  const [revDay, setRevDay] = useState('today');
  const rev = (data.revenueByDay && data.revenueByDay[revDay]) || { earned: 0, expected: 0, count: 0 };
  const apptDay = (data.appointmentsByDay && data.appointmentsByDay[revDay]) ?? 0;
  return (
    <>
      {data.profileStatus === 'pending' && (
        <Alert variant="warning">Your public profile is pending administrator approval. Patients cannot book you until it is activated.</Alert>
      )}
      <div className="tile-grid">
        <StatTile label={t('dash.todaysAppointments')} value={data.totals.today} icon="calendar" color="teal" sub="scheduled today" />
        <StatTile label={t('dash.pendingRequests')} value={data.totals.pending} icon="clock" color="amber" sub="awaiting confirmation" />
        <StatTile label={t('dash.totalPatients')} value={data.totals.patients} icon="users" color="indigo" sub="unique patients" />
        <StatTile label={t('dash.totalRevenue')} value={currency(data.totals.revenue)} icon="dollar" color="emerald" sub={`Rating ${data.totals.rating || 0}★`} />
      </div>

      <Section title={t('dash.revenueByDay')} actions={<DayToggle value={revDay} onChange={setRevDay} />}>
        <div className="grid-3">
          <div className="stat-card" style={{ margin: 0 }}>
            <div className="stat-icon si-emerald"><Icon name="dollar" size={20} /></div>
            <div>
              <div className="label">{t('dash.earned')} ({t(`common.${revDay}`)})</div>
              <div className="value">{currency(rev.earned)}</div>
            </div>
          </div>
          <div className="stat-card" style={{ margin: 0 }}>
            <div className="stat-icon si-amber"><Icon name="trendingUp" size={20} /></div>
            <div>
              <div className="label">{t('dash.expected')} ({t(`common.${revDay}`)})</div>
              <div className="value">{currency(rev.expected)}</div>
            </div>
          </div>
          <div className="stat-card" style={{ margin: 0 }}>
            <div className="stat-icon si-indigo"><Icon name="calendar" size={20} /></div>
            <div>
              <div className="label">{t('dash.appointments')} ({t(`common.${revDay}`)})</div>
              <div className="value">{apptDay}</div>
              <div className="meta"><Link to={`/app/appointments?day=${revDay}`}>{t('common.viewAll')}</Link></div>
            </div>
          </div>
        </div>
      </Section>

      <div className="grid-2">
        <Section title={t('dash.todaysSchedule')} flush actions={<Link to="/app/queue" className="btn btn-sm btn-ghost">{t('nav.queue')}</Link>}>
          <DataTable
            columns={[
              { key: 'time', header: t('col.time'), render: (r) => <span className="mono">{formatTimeRange(r.startTime, r.endTime)}</span> },
              { key: 'patientName', header: t('col.patient') },
              { key: 'reason', header: t('col.reason'), render: (r) => <span className="cell-muted">{r.reason || '—'}</span> },
              { key: 'status', header: t('col.status'), render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={data.today}
            empty={<div className="empty-state"><p className="muted">—</p></div>}
          />
        </Section>
        <Section title={t('dash.recentAppointments')} flush>
          <DataTable columns={cols.map((c) => (c.key === 'with' ? { ...c, header: t('col.patient'), render: (r) => r.patientName } : c))} rows={data.recent} empty={<div className="empty-state"><p className="muted">—</p></div>} />
        </Section>
      </div>
    </>
  );
}

function ReceptionDashboard({ data }) {
  const { t } = useI18n();
  return (
    <>
      <div className="tile-grid">
        <StatTile label={t('dash.todaysAppointments')} value={data.totals.today} icon="calendar" color="teal" sub="across all doctors" />
        <StatTile label={t('dash.waitingInQueue')} value={data.totals.waiting} icon="clock" color="amber" sub="patients waiting" />
        <StatTile label={t('dash.inConsultation')} value={data.totals.inConsultation} icon="stethoscope" color="indigo" sub="being seen now" />
        <StatTile label={t('dash.emergenciesToday')} value={data.totals.emergencies} icon="zap" color="rose" sub="priority cases" />
      </div>
      <Section title={t('dash.todaysAppointments')} flush actions={<Link to="/app/queue" className="btn btn-sm btn-ghost">{t('nav.queue')}</Link>}>
        <DataTable
          columns={[
            { key: 'token', header: 'Token', render: (r) => <span className="queue-token" style={{ width: 30, height: 30, fontSize: 13 }}>{r.token}</span> },
            { key: 'time', header: t('col.time'), render: (r) => <span className="mono">{r.startTime}</span> },
            { key: 'patientName', header: t('col.patient') },
            { key: 'doctorName', header: t('col.doctor'), render: (r) => <span className="cell-muted">{r.doctorName}</span> },
            { key: 'type', header: t('col.type'), render: (r) => (r.type === 'emergency' ? <Badge variant="danger">{t('status.emergency')}</Badge> : <Badge variant="neutral">{t('status.regular')}</Badge>) },
            { key: 'status', header: t('col.status'), render: (r) => <StatusBadge status={r.status} /> },
          ]}
          rows={data.today}
          empty={<div className="empty-state"><p className="muted">—</p></div>}
        />
      </Section>
    </>
  );
}

function AdminDashboard({ stats }) {
  const { t } = useI18n();
  const s = stats.totals;
  const spark = stats.trendCounts || [];
  const donut = (stats.specialtyDonut || []).map((d, i) => ({ ...d, color: SPEC_COLORS[i % SPEC_COLORS.length] }));
  return (
    <>
      <div className="tile-grid">
        <StatTile label="Doctors" value={s.doctors} icon="stethoscope" color="orange" spark={spark} sub={s.pendingDoctors ? `${s.pendingDoctors} pending approval` : 'All approved'} />
        <StatTile label="Patients" value={s.patients} icon="users" color="rose" spark={spark} sparkType="area" sub="Registered patients" />
        <StatTile label="Appointments" value={s.appointments} icon="calendar" color="teal" delta={`${Math.abs(stats.apptDelta || 0)}%`} deltaUp={(stats.apptDelta || 0) >= 0} spark={spark} sub="in last 7 days" />
        <StatTile label="Revenue" value={currency(s.revenue)} icon="dollar" color="emerald" spark={spark} sparkType="area" sub="from completed visits" />
      </div>

      {s.pendingDoctors > 0 && (
        <Alert variant="info">{s.pendingDoctors} doctor {s.pendingDoctors === 1 ? 'profile is' : 'profiles are'} awaiting approval. <Link to="/app/admin/doctors?status=pending">Review now</Link>.</Alert>
      )}

      <div className="grid-2">
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>Appointment Statistics</h3>
            <ChartLegend series={APPT_SERIES} data={stats.monthly} />
          </div>
          <div className="dash-card-body"><BarChart data={stats.monthly || []} series={APPT_SERIES} /></div>
        </div>
        <div className="dash-card">
          <div className="dash-card-head"><h3>Upcoming appointments</h3><Link to="/app/admin/appointments" className="btn btn-sm btn-ghost">{t('common.viewAll')}</Link></div>
          <div className="dash-card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {(stats.recentAppointments || []).slice(0, 5).map((a) => (
              <div className="appt-mini" key={a.id}>
                <span className="am-bar" style={{ background: SPEC_COLORS[0] }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cell-strong">{a.patientName} <span className="muted tiny">→ {a.doctorName}</span></div>
                  <div className="tiny muted">{formatDate(a.date)} · {a.startTime}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
            {(!stats.recentAppointments || stats.recentAppointments.length === 0) && <p className="muted tiny">—</p>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="dash-card">
          <div className="dash-card-head"><h3>Patients by specialty</h3></div>
          <div className="dash-card-body">
            <Donut segments={donut} centerValue={s.appointments} centerLabel="Appointments" />
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-head"><h3>Income by treatment</h3><Link to="/app/admin/payments" className="btn btn-sm btn-ghost">{t('nav.payments')}</Link></div>
          <div className="dash-card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {(stats.incomeBySpecialty || []).map((it, i) => (
              <div className="income-row" key={it.label}>
                <span className="income-dot" style={{ background: `${SPEC_COLORS[i % SPEC_COLORS.length]}1a`, color: SPEC_COLORS[i % SPEC_COLORS.length] }}><Icon name="activity" size={16} /></span>
                <div style={{ flex: 1 }} className="cell-strong">{it.label}</div>
                <div className="cell-strong">{currency(it.value)}</div>
              </div>
            ))}
            {(!stats.incomeBySpecialty || stats.incomeBySpecialty.length === 0) && <p className="muted tiny">No completed visits yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="dash-card">
          <div className="dash-card-head"><h3>{t('dash.topDoctors')}</h3></div>
          <DataTable
            columns={[
              { key: 'doctorName', header: t('col.doctor'), className: 'cell-strong' },
              { key: 'specialty', header: t('col.specialty'), render: (r) => <SpecialtyChip specialty={r.specialty} /> },
              { key: 'visits', header: t('col.visits'), align: 'right', className: 'num' },
              { key: 'revenue', header: t('col.revenue'), align: 'right', className: 'num', render: (r) => currency(r.revenue) },
            ]}
            rows={stats.topDoctors || []}
            rowKey="doctorId"
            empty={<div className="empty-state"><p className="muted">—</p></div>}
          />
        </div>
        <div className="dash-card">
          <div className="dash-card-head"><h3>{t('dash.recentActivity')}</h3><Link to="/app/admin/appointments" className="btn btn-sm btn-ghost">{t('common.all')}</Link></div>
          <DataTable
            columns={[
              { key: 'patientName', header: t('col.patient'), className: 'cell-strong' },
              { key: 'doctorName', header: t('col.doctor'), render: (r) => <span className="cell-muted">{r.doctorName}</span> },
              { key: 'date', header: t('col.date'), render: (r) => formatDate(r.date) },
              { key: 'status', header: t('col.status'), render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={stats.recentAppointments || []}
            empty={<div className="empty-state"><p className="muted">—</p></div>}
          />
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        if (user.role === 'admin') {
          const s = await AdminApi.stats();
          if (active) setStats(s);
        } else {
          const d = await DashboardApi.get();
          if (active) setData(d);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user.role]);

  return (
    <div>
      <PageHeader
        title={t('nav.dashboard')}
        subtitle={t(`greeting.${user.role}`)}
        actions={
          user.role === 'patient' ? (
            <>
              <Link to="/app/symptom-checker" className="btn"><Icon name="activity" size={15} /> Symptom Checker</Link>
              <Link to="/app/doctors" className="btn btn-primary"><Icon name="plus" size={15} /> New Appointment</Link>
            </>
          ) : user.role === 'doctor' ? (
            <Link to="/app/schedule" className="btn btn-primary"><Icon name="clock" size={15} /> Schedule Availability</Link>
          ) : user.role === 'admin' ? (
            <Link to="/app/admin/appointments" className="btn btn-primary"><Icon name="plus" size={15} /> New Appointment</Link>
          ) : null
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : user.role === 'admin' ? (
        <AdminDashboard stats={stats} />
      ) : user.role === 'doctor' ? (
        <DoctorDashboard data={data} />
      ) : user.role === 'receptionist' ? (
        <ReceptionDashboard data={data} />
      ) : (
        <PatientDashboard data={data} />
      )}
    </div>
  );
}
