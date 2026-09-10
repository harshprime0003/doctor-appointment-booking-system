import { useEffect, useState, useRef } from 'react';
import { PatientApi, RecordApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Input, Select, Field, Button, Avatar, Loading, EmptyState, Badge } from '../components/ui.jsx';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icon.jsx';
import { formatDate } from '../utils/format.js';

const TYPES = [
  { value: 'lab_report', label: 'Lab Report' }, { value: 'prescription', label: 'Prescription' },
  { value: 'x_ray', label: 'X-Ray' }, { value: 'mri', label: 'MRI' }, { value: 'ct_scan', label: 'CT Scan' },
  { value: 'vaccination', label: 'Vaccination' }, { value: 'other', label: 'Other' },
];
const typeLabel = (t) => TYPES.find((x) => x.value === t)?.label || 'Other';

function useDebounced(v, d = 300) {
  const [s, setS] = useState(v);
  useEffect(() => { const t = setTimeout(() => setS(v), d); return () => clearTimeout(t); }, [v, d]);
  return s;
}

export default function ReceptionRecords() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const dq = useDebounced(search);
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    PatientApi.list({ search: dq }).then((r) => setPatients(r.data)).catch(() => {});
  }, [dq]);

  const loadRecords = (patient) => {
    setSelected(patient);
    setLoadingRecs(true);
    RecordApi.list({ patientId: patient.id }).then((r) => setRecords(r.data)).finally(() => setLoadingRecs(false));
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Patient Records' }]} />
      <PageHeader title="Patient Health Records" subtitle="Look up a patient to view or upload their reports." />

      <div className="grid-2">
        <Section title="Patients" flush>
          <div className="toolbar">
            <div className="search"><Icon name="search" size={15} /><Input placeholder="Search name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {patients.length === 0 ? (
              <EmptyState icon="users" title="No patients found" />
            ) : (
              patients.map((p) => (
                <button key={p.id} className={`patient-row${selected?.id === p.id ? ' active' : ''}`} onClick={() => loadRecords(p)}>
                  <Avatar name={p.name} src={p.avatarUrl} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div className="cell-strong">{p.name}</div>
                    <div className="tiny muted">{p.email}{p.phone ? ` · ${p.phone}` : ''}</div>
                  </div>
                  <Icon name="chevronRight" size={15} />
                </button>
              ))
            )}
          </div>
        </Section>

        <Section
          title={selected ? `Records · ${selected.name}` : 'Records'}
          actions={selected ? <Button size="sm" variant="primary" icon="upload" onClick={() => setShowUpload(true)}>Upload</Button> : null}
          flush
        >
          {!selected ? (
            <EmptyState icon="fileText" title="Select a patient" message="Choose a patient to see their records." />
          ) : loadingRecs ? (
            <Loading />
          ) : records.length === 0 ? (
            <EmptyState icon="fileText" title="No records" message="This patient has no records yet." action={<Button size="sm" variant="primary" icon="upload" onClick={() => setShowUpload(true)}>Upload report</Button>} />
          ) : (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {records.map((r) => (
                <div className="file-item" key={r.id}>
                  <span className="file-icon"><Icon name={r.mimeType?.includes('image') ? 'image' : 'fileText'} size={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong">{r.title}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                      <Badge variant="accent">{typeLabel(r.type)}</Badge>
                      <span className="tiny muted">{formatDate((r.createdAt || '').slice(0, 10))}</span>
                      {r.uploadedByRole && r.uploadedByRole !== 'patient' && <span className="tiny muted">· by {r.uploadedBy}</span>}
                    </div>
                  </div>
                  {r.fileUrl && <a className="btn btn-sm btn-ghost" href={r.fileUrl} target="_blank" rel="noreferrer"><Icon name="download" size={14} /></a>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {showUpload && selected && (
        <UploadModal patient={selected} onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); loadRecords(selected); }} />
      )}
    </div>
  );
}

function UploadModal({ patient, onClose, onDone }) {
  const toast = useToast();
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'lab_report', notes: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!file) return toast.error('Please choose a file');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('patientId', patient.id);
      fd.append('title', form.title || file.name);
      fd.append('type', form.type);
      fd.append('notes', form.notes);
      await RecordApi.upload(fd);
      toast.success('Report uploaded');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Upload report · ${patient.name}`} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</Button></>}>
      <div className="dropzone" onClick={() => inputRef.current?.click()}>
        <Icon name="upload" size={26} />
        <div style={{ marginTop: 8, fontWeight: 600, color: 'var(--text)' }}>{file ? file.name : 'Click to choose a file'}</div>
        <div className="tiny">PDF or image, up to 10 MB</div>
        <input ref={inputRef} type="file" accept=".pdf,image/*" hidden onChange={(e) => setFile(e.target.files[0])} />
      </div>
      <div style={{ marginTop: 16 }} className="form-grid">
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
        <Field label="Type">
          <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>
        <Field label="Notes" optional full><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}
