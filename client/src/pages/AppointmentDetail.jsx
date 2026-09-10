import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppointmentApi, PrescriptionApi, PaymentApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Loading, Alert, StatusBadge, Button, Badge, Field, Input, Textarea } from '../components/ui.jsx';
import Modal from '../components/Modal.jsx';
import TrackTimeline from '../components/TrackTimeline.jsx';
import PrescriptionSheet from '../components/PrescriptionSheet.jsx';
import InvoiceSheet from '../components/InvoiceSheet.jsx';
import Icon from '../components/Icon.jsx';
import { currency, formatDate, formatTimeRange, formatDateTime, titleCase } from '../utils/format.js';

export default function AppointmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [appt, setAppt] = useState(null);
  const [rx, setRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRx, setShowRx] = useState(false);
  const [writeRx, setWriteRx] = useState(false);
  const [invoice, setInvoice] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await AppointmentApi.get(id);
      setAppt(res.appointment);
      if (res.appointment.hasPrescription) {
        const list = await PrescriptionApi.list({ appointmentId: id });
        setRx(list.data[0] || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status) => {
    try {
      await AppointmentApi.updateStatus(id, { status });
      toast.success('Appointment updated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openInvoice = async () => {
    try {
      const res = await PaymentApi.invoice(id);
      setInvoice(res);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!appt) return null;

  const isDoctor = user.role === 'doctor';
  const canManage = isDoctor || user.role === 'admin' || user.role === 'receptionist';
  const canCancel = user.role === 'patient' && ['pending', 'confirmed'].includes(appt.status);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Appointments', to: '/app/appointments' }, { label: `#${appt.id.slice(0, 8)}` }]} />
      <PageHeader
        title="Appointment details"
        subtitle={<>Token <strong>#{appt.token}</strong> · <span className="mono">{appt.invoiceNo}</span></>}
        actions={
          <>
            <Button variant="ghost" icon="fileText" onClick={openInvoice}>Invoice</Button>
            {canCancel && <Button variant="danger" onClick={() => changeStatus('cancelled')}>Cancel</Button>}
            {canManage && appt.status === 'pending' && <Button variant="primary" onClick={() => changeStatus('confirmed')}>Confirm</Button>}
            {isDoctor && !appt.hasPrescription && appt.status !== 'cancelled' && <Button variant="accent" icon="pill" onClick={() => setWriteRx(true)}>Write prescription</Button>}
            {appt.hasPrescription && <Button icon="pill" onClick={() => setShowRx(true)}>View prescription</Button>}
          </>
        }
      />

      <Section title="Live status">
        <TrackTimeline trackStatus={appt.trackStatus} />
      </Section>

      <div className="grid-2">
        <Section title="Visit information">
          <dl className="desc-list">
            <dt>Status</dt>
            <dd><StatusBadge status={appt.status} /> {appt.type === 'emergency' && <Badge variant="danger">Emergency</Badge>}</dd>
            <dt>Date &amp; time</dt>
            <dd>{formatDate(appt.date)} · <span className="mono">{formatTimeRange(appt.startTime, appt.endTime)}</span></dd>
            <dt>Token</dt>
            <dd className="cell-strong">#{appt.token}</dd>
            <dt>Doctor</dt>
            <dd>{appt.doctorName} <span className="muted">· {appt.specialty}</span></dd>
            <dt>Patient</dt>
            <dd>{appt.patientName}</dd>
            <dt>Branch</dt>
            <dd>{appt.branchName || '—'}</dd>
            <dt>Amount paid</dt>
            <dd className="cell-strong">{currency(appt.amount || appt.fee)} <Badge variant="success">{titleCase(appt.paymentStatus || 'paid')}</Badge></dd>
            <dt>Booked on</dt>
            <dd>{formatDateTime(appt.createdAt)}</dd>
          </dl>
        </Section>

        <div>
          <Section title="Reason for visit">
            <p className="muted" style={{ margin: 0 }}>{appt.reason || 'No reason provided.'}</p>
          </Section>
          {canManage && (
            <Section title="Clinical notes">
              <p className="muted" style={{ margin: 0 }}>{appt.notes || 'No notes recorded.'}</p>
            </Section>
          )}
        </div>
      </div>

      {showRx && rx && (
        <Modal title="Prescription" size="lg" onClose={() => setShowRx(false)} footer={<><Button variant="ghost" onClick={() => setShowRx(false)}>Close</Button><Button variant="primary" icon="printer" onClick={() => window.print()}>Print / Save PDF</Button></>}>
          <PrescriptionSheet rx={rx} />
        </Modal>
      )}
      {invoice && (
        <Modal title="Tax Invoice" size="lg" onClose={() => setInvoice(null)} footer={<><Button variant="ghost" onClick={() => setInvoice(null)}>Close</Button><Button variant="primary" icon="printer" onClick={() => window.print()}>Print / Save PDF</Button></>}>
          <InvoiceSheet appointment={invoice.appointment} payment={invoice.payment} />
        </Modal>
      )}
      {writeRx && (
        <WritePrescriptionModal appointment={appt} onClose={() => setWriteRx(false)} onDone={() => { setWriteRx(false); load(); }} />
      )}
    </div>
  );
}

function WritePrescriptionModal({ appointment, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ diagnosis: '', advice: '', followUpDate: '', vitals: { bp: '', pulse: '', temp: '', weight: '' } });
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
  const [saving, setSaving] = useState(false);

  const setV = (k) => (e) => setForm((f) => ({ ...f, vitals: { ...f.vitals, [k]: e.target.value } }));
  const setMed = (i, k, v) => setMeds((cur) => cur.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));

  const save = async () => {
    const validMeds = meds.filter((m) => m.name.trim());
    setSaving(true);
    try {
      await PrescriptionApi.create({ appointmentId: appointment.id, ...form, medicines: validMeds });
      toast.success('Prescription saved');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Prescription · ${appointment.patientName}`}
      size="lg"
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save & sign'}</Button></>}
    >
      <Field label="Diagnosis">
        <Input value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g. Viral fever" />
      </Field>
      <div className="form-grid">
        <Field label="Blood pressure"><Input value={form.vitals.bp} onChange={setV('bp')} placeholder="120/80" /></Field>
        <Field label="Pulse"><Input value={form.vitals.pulse} onChange={setV('pulse')} placeholder="78 bpm" /></Field>
        <Field label="Temperature"><Input value={form.vitals.temp} onChange={setV('temp')} placeholder="98.6 F" /></Field>
        <Field label="Weight"><Input value={form.vitals.weight} onChange={setV('weight')} placeholder="70 kg" /></Field>
      </div>

      <div className="field-label" style={{ marginTop: 6 }}>Medicines</div>
      <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th></th></tr></thead>
          <tbody>
            {meds.map((m, i) => (
              <tr key={i}>
                <td><Input value={m.name} onChange={(e) => setMed(i, 'name', e.target.value)} placeholder="Paracetamol 500mg" /></td>
                <td><Input value={m.dosage} onChange={(e) => setMed(i, 'dosage', e.target.value)} placeholder="1 tab" style={{ width: 90 }} /></td>
                <td><Input value={m.frequency} onChange={(e) => setMed(i, 'frequency', e.target.value)} placeholder="Twice/day" style={{ width: 110 }} /></td>
                <td><Input value={m.duration} onChange={(e) => setMed(i, 'duration', e.target.value)} placeholder="3 days" style={{ width: 90 }} /></td>
                <td className="num"><Button size="sm" variant="ghost" icon="x" onClick={() => setMeds((c) => c.filter((_, idx) => idx !== i))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button size="sm" variant="ghost" icon="plus" style={{ marginTop: 8 }} onClick={() => setMeds((c) => [...c, { name: '', dosage: '', frequency: '', duration: '', notes: '' }])}>Add medicine</Button>

      <Field label="Advice" optional>
        <Textarea value={form.advice} onChange={(e) => setForm((f) => ({ ...f, advice: e.target.value }))} placeholder="Rest, fluids, follow-up if not improving" />
      </Field>
      <Field label="Follow-up date" optional>
        <Input type="date" value={form.followUpDate} onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))} />
      </Field>
    </Modal>
  );
}
