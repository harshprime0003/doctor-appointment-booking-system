import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AppointmentApi, ReviewApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Input, Select, Button, StatusBadge, Pagination, Field, Textarea, Stars } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icon.jsx';
import { currency, formatDate, formatTimeRange, todayStr, addDaysStr } from '../utils/format.js';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

const DAY_TO_DATE = { yesterday: () => addDaysStr(-1), today: () => todayStr(), tomorrow: () => addDaysStr(1) };
function dayFromDate(date) {
  if (!date) return '';
  if (date === todayStr()) return 'today';
  if (date === addDaysStr(-1)) return 'yesterday';
  if (date === addDaysStr(1)) return 'tomorrow';
  return '';
}

export default function Appointments() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user.role === 'admin';
  const isDoctor = user.role === 'doctor';
  const isPatient = user.role === 'patient';

  const [searchParams] = useSearchParams();
  const initialDay = searchParams.get('day');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    date: initialDay && DAY_TO_DATE[initialDay] ? DAY_TO_DATE[initialDay]() : '',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);

  const [statusModal, setStatusModal] = useState(null); // appointment
  const [reviewModal, setReviewModal] = useState(null); // appointment

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.date) params.date = filters.date;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await AppointmentApi.list(params);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const activeDay = dayFromDate(filters.date);
  const setDay = (day) =>
    setFilters((f) => ({ ...f, date: activeDay === day ? '' : DAY_TO_DATE[day](), from: '', to: '' }));

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(1), [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const cancel = async (appt) => {
    try {
      await AppointmentApi.updateStatus(appt.id, { status: 'cancelled' });
      toast.success('Appointment cancelled');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const withCol = isPatient
    ? { key: 'doctorName', header: t('col.doctor'), render: (r) => (<div><div className="cell-strong">{r.doctorName}</div><div className="tiny muted">{r.specialty}</div></div>) }
    : { key: 'patientName', header: t('col.patient'), render: (r) => (<div><div className="cell-strong">{r.patientName}</div>{r.reason && <div className="tiny muted">{r.reason}</div>}</div>) };

  const columns = [
    { key: 'date', header: t('col.date'), render: (r) => formatDate(r.date) },
    { key: 'time', header: t('col.time'), render: (r) => <span className="mono">{formatTimeRange(r.startTime, r.endTime)}</span> },
    withCol,
    ...(isAdmin ? [{ key: 'both', header: t('col.doctor'), render: (r) => <span className="cell-muted">{r.doctorName}</span> }] : []),
    { key: 'fee', header: t('col.fee'), align: 'right', className: 'num', render: (r) => currency(r.fee) },
    { key: 'status', header: t('col.status'), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="row-actions">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/app/appointments/${r.id}`)}>
            {t('common.view')}
          </Button>
          {(isDoctor || isAdmin) && !['completed', 'cancelled'].includes(r.status) && (
            <Button size="sm" onClick={() => setStatusModal(r)}>{t('common.update')}</Button>
          )}
          {isPatient && ['pending', 'confirmed'].includes(r.status) && (
            <Button size="sm" variant="danger" onClick={() => cancel(r)}>{t('common.cancel')}</Button>
          )}
          {isPatient && r.status === 'completed' && (
            <Button size="sm" onClick={() => setReviewModal(r)}>{t('common.review')}</Button>
          )}
        </div>
      ),
    },
  ];

  const crumbLabel = isAdmin ? t('appt.all') : t('appt.mine');

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: crumbLabel }]} />
      <PageHeader
        title={crumbLabel}
        subtitle={isPatient ? t('page.appointmentsSubPatient') : isDoctor ? t('page.appointmentsSubDoctor') : t('page.appointmentsSubAdmin')}
        actions={isPatient ? <Link to="/app/doctors" className="btn btn-primary" style={{ height: 34 }}><Icon name="plus" size={15} /> {t('common.book')}</Link> : null}
      />

      <Section flush>
        <div className="toolbar">
          {!isPatient && (
            <div className="search">
              <Icon name="search" size={15} />
              <Input placeholder={isDoctor ? 'Search patient' : 'Search patient or doctor'} value={filters.search} onChange={set('search')} />
            </div>
          )}
          <Select value={filters.status} onChange={set('status')}>
            <option value="">{t('filter.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </Select>
          <div className="lang-switch">
            {['yesterday', 'today', 'tomorrow'].map((d) => (
              <button key={d} type="button" className={activeDay === d ? 'active' : ''} onClick={() => setDay(d)}>
                {t(`common.${d}`)}
              </button>
            ))}
          </div>
          {filters.date && (
            <Button size="sm" variant="ghost" icon="x" onClick={() => setFilters((f) => ({ ...f, date: '' }))}>{t('common.clear')}</Button>
          )}
          <span className="toolbar-spacer" />
          <label className="tiny muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {t('common.from')} <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, date: '' }))} style={{ width: 150 }} />
          </label>
          <label className="tiny muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {t('common.to')} <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, date: '' }))} style={{ width: 150 }} />
          </label>
        </div>
        <DataTable columns={columns} rows={result.data} loading={loading} />
        <Pagination pagination={result.pagination} onChange={setPage} />
      </Section>

      {statusModal && (
        <StatusModal appointment={statusModal} onClose={() => setStatusModal(null)} onDone={() => { setStatusModal(null); load(); }} />
      )}
      {reviewModal && (
        <ReviewModal appointment={reviewModal} onClose={() => setReviewModal(null)} onDone={() => { setReviewModal(null); load(); }} />
      )}
    </div>
  );
}

function StatusModal({ appointment, onClose, onDone }) {
  const toast = useToast();
  const [status, setStatus] = useState(appointment.status === 'pending' ? 'confirmed' : appointment.status);
  const [notes, setNotes] = useState(appointment.notes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await AppointmentApi.updateStatus(appointment.id, { status, notes });
      toast.success('Appointment updated');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Update appointment"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </>
      }
    >
      <div className="tiny muted" style={{ marginBottom: 12 }}>
        {appointment.patientName} · {formatDate(appointment.date)} · {formatTimeRange(appointment.startTime, appointment.endTime)}
      </div>
      <Field label="Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No show</option>
        </Select>
      </Field>
      <Field label="Clinical notes" optional>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes visible to the care team" />
      </Field>
    </Modal>
  );
}

function ReviewModal({ appointment, onClose, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await ReviewApi.create({ appointmentId: appointment.id, rating, comment });
      toast.success('Thanks for your review');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Review ${appointment.doctorName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Submitting…' : 'Submit review'}</Button>
        </>
      }
    >
      <Field label="Rating">
        <Stars value={rating} onChange={setRating} size={22} />
      </Field>
      <Field label="Comment" optional>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience" />
      </Field>
    </Modal>
  );
}
