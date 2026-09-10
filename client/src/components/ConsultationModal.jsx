import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { Button, Field, Input, Textarea, Loading, EmptyState, Badge, StatusBadge } from './ui.jsx';
import Icon from './Icon.jsx';
import { RecordApi, PrescriptionApi, AppointmentApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, titleCase } from '../utils/format.js';

const TABS = [
  { id: 'overview', label: 'Visit', icon: 'clipboard' },
  { id: 'reports', label: 'Reports', icon: 'fileText' },
  { id: 'history', label: 'History', icon: 'clock' },
  { id: 'prescription', label: 'Prescription', icon: 'pill' },
];

const RECORD_LABEL = { lab_report: 'Lab Report', prescription: 'Prescription', x_ray: 'X-Ray', mri: 'MRI', ct_scan: 'CT Scan', vaccination: 'Vaccination', other: 'Other' };

export default function ConsultationModal({ appointment, onClose, onCompleted }) {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [records, setRecords] = useState([]);
  const [history, setHistory] = useState([]);
  const [pastRx, setPastRx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rxSaved, setRxSaved] = useState(appointment.hasPrescription || false);
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState(appointment.notes || '');
  const [form, setForm] = useState({ diagnosis: '', advice: '', followUpDate: '', vitals: { bp: '', pulse: '', temp: '', weight: '' } });
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);

  useEffect(() => {
    (async () => {
      try {
        const [rec, hist, rx] = await Promise.all([
          RecordApi.list({ patientId: appointment.patientId }).catch(() => ({ data: [] })),
          AppointmentApi.list({ patientId: appointment.patientId, pageSize: 50 }).catch(() => ({ data: [] })),
          PrescriptionApi.list({ patientId: appointment.patientId }).catch(() => ({ data: [] })),
        ]);
        setRecords(rec.data || []);
        setHistory((hist.data || []).filter((a) => a.id !== appointment.id));
        setPastRx(rx.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [appointment.id, appointment.patientId]);

  const setV = (k) => (e) => setForm((f) => ({ ...f, vitals: { ...f.vitals, [k]: e.target.value } }));
  const setMed = (i, k, v) => setMeds((cur) => cur.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));
  const hasRxContent = meds.some((m) => m.name.trim()) || form.diagnosis.trim();

  const savePrescription = async () => {
    const validMeds = meds.filter((m) => m.name.trim());
    if (!validMeds.length && !form.diagnosis.trim()) {
      toast.error('Add a diagnosis or at least one medicine');
      return false;
    }
    await PrescriptionApi.create({ appointmentId: appointment.id, ...form, medicines: validMeds });
    setRxSaved(true);
    return true;
  };

  const handleSaveRx = async () => {
    setSaving(true);
    try {
      if (await savePrescription()) toast.success('Prescription saved & signed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const complete = async () => {
    // Encourage a prescription; allow completing without one after confirmation.
    if (!rxSaved && !hasRxContent) {
      const ok = window.confirm('Complete this consultation without a prescription?');
      if (!ok) return;
    }
    setSaving(true);
    try {
      if (!rxSaved && hasRxContent) await savePrescription();
      await AppointmentApi.updateStatus(appointment.id, { status: 'completed', notes });
      toast.success('Consultation completed');
      onCompleted();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title=""
      size="lg"
      onClose={onClose}
      footer={
        <>
          <div style={{ marginRight: 'auto', fontSize: 12.5 }} className="muted">
            {rxSaved ? <><Icon name="checkCircle" size={14} style={{ color: 'var(--success)', verticalAlign: 'middle' }} /> Prescription on file</> : 'No prescription yet'}
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="accent" icon="pill" onClick={handleSaveRx} disabled={saving || rxSaved}>Save prescription</Button>
          <Button variant="success" icon="check" onClick={complete} disabled={saving}>{saving ? 'Saving…' : 'Complete consultation'}</Button>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -4, marginBottom: 12 }}>
        <span className="queue-token">{appointment.token}</span>
        <div>
          <div className="cell-strong" style={{ fontSize: 16 }}>{appointment.patientName}</div>
          <div className="tiny muted">{formatDate(appointment.date)} · {appointment.startTime} · <StatusBadge status={appointment.status} /></div>
        </div>
        {appointment.type === 'emergency' && <Badge variant="danger">Emergency</Badge>}
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map((tb) => (
          <button key={tb.id} className={`tab${tab === tb.id ? ' active' : ''}`} onClick={() => setTab(tb.id)}>
            {tb.label}
            {tb.id === 'reports' && records.length > 0 && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>{records.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {tab === 'overview' && (
            <div>
              <dl className="desc-list">
                <dt>Reason for visit</dt><dd>{appointment.reason || '—'}</dd>
                <dt>Type</dt><dd>{titleCase(appointment.type || 'regular')}</dd>
                <dt>Specialty</dt><dd>{appointment.specialty}</dd>
              </dl>
              <Field label="Clinical notes" optional>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations, examination findings…" />
              </Field>
            </div>
          )}

          {tab === 'reports' && (
            records.length === 0 ? (
              <EmptyState icon="fileText" title="No reports uploaded" message="This patient hasn't uploaded any health records." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {records.map((r) => (
                  <div className="file-item" key={r.id}>
                    <span className="file-icon"><Icon name={r.mimeType?.includes('image') ? 'image' : 'fileText'} size={18} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cell-strong">{r.title}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                        <Badge variant="accent">{RECORD_LABEL[r.type] || 'Other'}</Badge>
                        <span className="tiny muted">{formatDate((r.createdAt || '').slice(0, 10))}</span>
                      </div>
                      {r.ocrText && <div className="tiny muted" style={{ marginTop: 4 }}>{r.ocrText}</div>}
                    </div>
                    {r.fileUrl && <a className="btn btn-sm btn-ghost" href={r.fileUrl} target="_blank" rel="noreferrer"><Icon name="download" size={14} /></a>}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'history' && (
            <div>
              <div className="field-label">Past visits with you</div>
              {history.length === 0 ? (
                <p className="muted tiny">No previous visits.</p>
              ) : (
                <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Reason</th><th>Status</th></tr></thead>
                    <tbody>
                      {history.slice(0, 8).map((a) => (
                        <tr key={a.id}><td>{formatDate(a.date)}</td><td className="cell-muted">{a.reason || '—'}</td><td><StatusBadge status={a.status} /></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="field-label">Past prescriptions</div>
              {pastRx.length === 0 ? (
                <p className="muted tiny">No past prescriptions.</p>
              ) : (
                pastRx.slice(0, 5).map((rx) => (
                  <div key={rx.id} className="condition-card" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="cell-strong">{rx.diagnosis || 'Prescription'}</span>
                      <span className="tiny muted">{formatDate(rx.date)}</span>
                    </div>
                    <div className="tiny muted" style={{ marginTop: 4 }}>
                      {(rx.medicines || []).map((m) => m.name).join(', ') || 'No medicines'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'prescription' && (
            <div>
              {rxSaved && <div className="alert alert-success"><Icon name="checkCircle" size={16} /> A prescription has already been saved for this visit.</div>}
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
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
