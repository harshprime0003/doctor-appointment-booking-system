import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DoctorApi, AppointmentApi, MetaApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { Section, Loading, Alert, Stars, Button, Field, Textarea, Input, EmptyState, Avatar, Badge } from '../components/ui.jsx';
import SpecialtyChip from '../components/SpecialtyChip.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import Icon from '../components/Icon.jsx';
import { currency, formatDate, todayStr, addDaysStr, formatDateTime } from '../utils/format.js';
import { WEEKDAY_LABELS } from '../utils/weekdays.js';
import { doctorAvatar } from '../utils/doctor.js';

function to12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emergencySurcharge, setEmergencySurcharge] = useState(300);

  const [availDay, setAvailDay] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [type, setType] = useState('regular');
  const [showPay, setShowPay] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    MetaApi.get().then((m) => setEmergencySurcharge(m.emergencySurcharge)).catch(() => {});
    (async () => {
      setLoading(true);
      try {
        const res = await DoctorApi.get(id);
        setDoctor(res.doctor);
        setReviews(res.reviews || []);
        const days = [...new Set((res.doctor.availability || []).map((a) => Number(a.day)))].sort();
        setAvailDay(days[0] ?? 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const loadSlots = useCallback(async () => {
    if (!date) return;
    setSlotsLoading(true);
    setSelected(null);
    try {
      const res = await DoctorApi.slots(id, date);
      setSlots(res.slots);
      setBlocked(res.blocked);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [id, date]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const confirmBooking = async (paymentMethod) => {
    setShowPay(false);
    setBooking(true);
    try {
      await AppointmentApi.create({ doctorId: id, date, startTime: selected.startTime, reason, type, paymentMethod });
      toast.success('Payment successful — appointment booked');
      navigate('/app/appointments');
    } catch (err) {
      toast.error(err.message || 'Could not book appointment');
      loadSlots();
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <Loading label="Loading doctor…" />;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!doctor) return null;

  const availability = doctor.availability || [];
  const availableDays = [...new Set(availability.map((a) => Number(a.day)))].sort();
  const dayBlocks = availability.filter((a) => Number(a.day) === availDay);
  const total = doctor.consultationFee + (type === 'emergency' ? emergencySurcharge : 0);

  const aboutRows = [
    { icon: 'clipboard', label: 'Medical Registration', value: `MED-${doctor.id.slice(0, 8).toUpperCase()}` },
    { icon: 'briefcase', label: 'Experience', value: `${doctor.experienceYears}+ Years` },
    { icon: 'dollar', label: 'Consultation Fee', value: currency(doctor.consultationFee) },
    { icon: 'mapPin', label: 'Location', value: doctor.city || '—' },
    { icon: 'building', label: 'Hospital', value: doctor.hospital || doctor.branchName || '—' },
    { icon: 'globe', label: 'Languages', value: (doctor.languages || []).join(', ') || '—' },
    { icon: 'user', label: 'Gender', value: doctor.gender ? doctor.gender[0].toUpperCase() + doctor.gender.slice(1) : '—' },
    { icon: 'star', label: 'Rating', value: `${doctor.rating || 0} (${doctor.ratingCount || 0} reviews)` },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Find a Doctor', to: '/app/doctors' }, { label: doctor.name }]} />

      {/* Header card */}
      <div className="dd-hero">
        <div className="dd-hero-inner">
          <img className="dd-photo" src={doctorAvatar(doctor)} alt={doctor.name} />
          <div style={{ minWidth: 0 }}>
            <div className="dd-id">#DT{doctor.id.slice(0, 4).toUpperCase()}</div>
            <div className="dd-name">{doctor.name} <SpecialtyChip specialty={doctor.specialty} /></div>
            <div className="dd-meta">{doctor.qualifications || 'MBBS'}</div>
            <div className="dd-meta" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="building" size={13} /> {doctor.hospital || doctor.branchName || 'Clinic'}</span>
              <Badge variant="success" dot>Available</Badge>
              <Stars value={doctor.rating} count={doctor.ratingCount} size={13} />
            </div>
          </div>
          <div className="dd-charge">
            <div className="tiny muted">Consultation Charge</div>
            <div className="amt">{currency(doctor.consultationFee)} <span className="tiny muted">/ 30 Min</span></div>
            <a href="#book" className="btn btn-primary" style={{ marginTop: 8 }}><Icon name="calendar" size={15} /> Book Appointment</a>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          {/* Availability tabs */}
          <Section title="Availability" flush>
            <div className="tabs" style={{ padding: '0 16px', marginBottom: 0 }}>
              {(availableDays.length ? availableDays : [1, 2, 3, 4, 5]).map((d) => (
                <button key={d} className={`tab${availDay === d ? ' active' : ''}`} onClick={() => setAvailDay(d)}>{WEEKDAY_LABELS[d]}</button>
              ))}
            </div>
            <div className="section-body">
              {dayBlocks.length === 0 ? (
                <p className="muted tiny" style={{ margin: 0 }}>Not available on {WEEKDAY_LABELS[availDay]}.</p>
              ) : (
                <div className="slot-grid">
                  {dayBlocks.map((b, i) => (
                    <span key={i} className="slot" style={{ cursor: 'default', display: 'grid', placeItems: 'center', width: 'auto', padding: '0 10px' }}>
                      {to12h(b.startTime)} - {to12h(b.endTime)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section title="Short Bio">
            <p className="muted" style={{ margin: 0 }}>{doctor.bio || 'No biography provided.'}</p>
            {(doctor.conditions || []).length > 0 && (
              <>
                <div className="field-label" style={{ marginTop: 14 }}>Treats</div>
                <div className="inline-list">{doctor.conditions.map((c) => <span className="chip" key={c}>{c}</span>)}</div>
              </>
            )}
          </Section>

          <Section title="Education & Experience">
            <div className="timeline-item">
              <div className="cell-strong">{doctor.qualifications || 'Medical Degree'}</div>
              <div className="tiny muted">Medical College · {Math.max(1990, 2026 - doctor.experienceYears - 5)}</div>
            </div>
            <div className="timeline-item">
              <div className="cell-strong">{doctor.experienceYears}+ years in {doctor.specialty}</div>
              <div className="tiny muted">{doctor.hospital || doctor.branchName || 'Clinic'}</div>
            </div>
          </Section>

          <Section title={`Patient reviews (${reviews.length})`} flush>
            {reviews.length === 0 ? (
              <EmptyState icon="star" title="No reviews yet" message="Reviews appear after completed appointments." />
            ) : (
              reviews.map((r) => (
                <div key={r.id} style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={r.patientName} />
                      <div><div className="cell-strong tiny">{r.patientName}</div><Stars value={r.rating} size={12} /></div>
                    </div>
                    <span className="tiny muted">{formatDateTime(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="muted" style={{ margin: '8px 0 0' }}>{r.comment}</p>}
                </div>
              ))
            )}
          </Section>
        </div>

        <div>
          {/* About card */}
          <Section title="About">
            <div className="about-card">
              {aboutRows.map((r) => (
                <div className="about-row" key={r.label}>
                  <span className="ar-ico"><Icon name={r.icon} size={16} /></span>
                  <div>
                    <div className="ar-label">{r.label}</div>
                    <div className="ar-value">{r.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Booking */}
          <div id="book" />
          <Section title="Book an appointment">
            <Field label="Appointment type">
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className={`btn${type === 'regular' ? ' btn-primary' : ''}`} style={{ flex: 1 }} onClick={() => setType('regular')}><Icon name="calendar" size={15} /> Regular</button>
                <button type="button" className={`btn${type === 'emergency' ? ' btn-warning' : ''}`} style={{ flex: 1 }} onClick={() => setType('emergency')}><Icon name="zap" size={15} /> Emergency</button>
              </div>
              {type === 'emergency' && <div className="field-hint">Priority booking with a {currency(emergencySurcharge)} surcharge.</div>}
            </Field>
            <Field label="Select date">
              <Input type="date" value={date} min={todayStr()} max={addDaysStr(60)} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <div className="field">
              <label className="field-label">Available slots · {formatDate(date)}</label>
              {slotsLoading ? <Loading /> : blocked ? (
                <Alert variant="warning">The doctor is on leave / holiday on this date.</Alert>
              ) : slots.length === 0 ? (
                <div className="alert alert-info" style={{ marginBottom: 0 }}><Icon name="alert" size={16} /> No open slots for this date. Try another day.</div>
              ) : (
                <div className="slot-grid">
                  {slots.map((sl) => (
                    <button type="button" key={sl.startTime} className={`slot${selected?.startTime === sl.startTime ? ' selected' : ''}`} onClick={() => setSelected(sl)}>{sl.startTime}</button>
                  ))}
                </div>
              )}
            </div>
            <Field label="Reason for visit" optional>
              <Textarea placeholder="Briefly describe your symptoms" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
            </Field>
            {selected && (
              <div className="pay-breakdown">
                <div className="pay-row"><span>{formatDate(date)} · {selected.startTime}–{selected.endTime}</span></div>
                <div className="pay-row"><span>Consultation</span><span>{currency(doctor.consultationFee)}</span></div>
                {type === 'emergency' && <div className="pay-row"><span>Emergency priority</span><span>{currency(emergencySurcharge)}</span></div>}
                <div className="pay-row total"><span>Payable (+GST)</span><span>{currency(total)}</span></div>
              </div>
            )}
            <Button variant="primary" className="btn-block btn-lg" disabled={!selected || booking} onClick={() => setShowPay(true)}>
              <Icon name="creditCard" size={16} /> {booking ? 'Booking…' : 'Proceed to payment'}
            </Button>
          </Section>
        </div>
      </div>

      {showPay && selected && <PaymentModal doctorId={id} type={type} onClose={() => setShowPay(false)} onPaid={confirmBooking} />}
    </div>
  );
}
