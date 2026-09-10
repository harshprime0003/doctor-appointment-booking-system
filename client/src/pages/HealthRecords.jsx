import { useEffect, useState, useRef } from 'react';
import { RecordApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, Field, Input, Select, Badge, Loading, EmptyState } from '../components/ui.jsx';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icon.jsx';
import { formatDate } from '../utils/format.js';

const TYPES = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'x_ray', label: 'X-Ray' },
  { value: 'mri', label: 'MRI' },
  { value: 'ct_scan', label: 'CT Scan' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'other', label: 'Other' },
];
const typeLabel = (t) => TYPES.find((x) => x.value === t)?.label || 'Other';

export default function HealthRecords() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);

  const load = () => {
    setLoading(true);
    RecordApi.list().then((r) => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (rec) => {
    try {
      await RecordApi.remove(rec.id);
      toast.success('Record removed');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Health Records' }]} />
      <PageHeader
        title="Electronic Health Records"
        subtitle="Store lab reports, scans, prescriptions and vaccination records securely."
        actions={<Button variant="primary" icon="upload" onClick={() => setShowUpload(true)}>Upload report</Button>}
      />

      <Section flush>
        {loading ? (
          <Loading />
        ) : data.length === 0 ? (
          <EmptyState icon="fileText" title="No records yet" message="Upload your first medical report to keep it handy." action={<Button variant="primary" icon="upload" onClick={() => setShowUpload(true)}>Upload report</Button>} />
        ) : (
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
            {data.map((r) => (
              <div className="file-item" key={r.id}>
                <span className="file-icon"><Icon name={r.mimeType?.includes('image') ? 'image' : 'fileText'} size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cell-strong" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                    <Badge variant="accent">{typeLabel(r.type)}</Badge>
                    <span className="tiny muted">{formatDate((r.createdAt || '').slice(0, 10))}</span>
                  </div>
                  {r.ocrText && <div className="tiny muted" style={{ marginTop: 4 }}><Icon name="activity" size={11} /> {r.ocrText}</div>}
                </div>
                <div className="row-actions">
                  <Button size="sm" variant="ghost" icon="fileText" onClick={() => setView(r)} />
                  <Button size="sm" variant="ghost" icon="edit" onClick={() => setEdit(r)} />
                  <Button size="sm" variant="danger" icon="trash" onClick={() => remove(r)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); load(); }} />}
      {view && <ViewModal record={view} onClose={() => setView(null)} />}
      {edit && <EditModal record={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />}
    </div>
  );
}

function ViewModal({ record, onClose }) {
  const isImage = record.mimeType?.includes('image') && record.fileUrl;
  return (
    <Modal title={record.title} onClose={onClose} footer={<>{record.fileUrl && <a className="btn" href={record.fileUrl} target="_blank" rel="noreferrer"><Icon name="download" size={14} /> Open file</a>}<Button variant="ghost" onClick={onClose}>Close</Button></>}>
      <dl className="desc-list">
        <dt>Type</dt><dd><Badge variant="accent">{typeLabel(record.type)}</Badge></dd>
        <dt>Date</dt><dd>{formatDate((record.createdAt || '').slice(0, 10))}</dd>
        <dt>File</dt><dd className="tiny mono">{record.fileName || '—'}</dd>
        {record.uploadedBy && (<><dt>Uploaded by</dt><dd>{record.uploadedBy} <span className="muted tiny">({record.uploadedByRole || 'patient'})</span></dd></>)}
        {record.notes && (<><dt>Notes</dt><dd>{record.notes}</dd></>)}
      </dl>
      {record.ocrText && (
        <div className="alert alert-info" style={{ marginTop: 14 }}><Icon name="activity" size={16} /> <div><strong>Auto-extract:</strong> {record.ocrText}</div></div>
      )}
      {isImage && <img src={record.fileUrl} alt={record.title} style={{ width: '100%', marginTop: 14, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />}
    </Modal>
  );
}

function EditModal({ record, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: record.title || '', type: record.type || 'other', notes: record.notes || '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await RecordApi.update(record.id, form);
      toast.success('Record updated');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit record" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></>}>
      <Field label="Title"><Input value={form.title} onChange={set('title')} /></Field>
      <Field label="Type">
        <Select value={form.type} onChange={set('type')}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </Field>
      <Field label="Notes" optional><Input value={form.notes} onChange={set('notes')} /></Field>
    </Modal>
  );
}

function UploadModal({ onClose, onDone }) {
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
    <Modal
      title="Upload medical report"
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</Button></>}
    >
      <div className="dropzone" onClick={() => inputRef.current?.click()}>
        <Icon name="upload" size={26} />
        <div style={{ marginTop: 8, fontWeight: 600, color: 'var(--text)' }}>{file ? file.name : 'Click to choose a file'}</div>
        <div className="tiny">PDF or image, up to 10 MB</div>
        <input ref={inputRef} type="file" accept=".pdf,image/*" hidden onChange={(e) => setFile(e.target.files[0])} />
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="form-grid">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Blood test — Jan 2026" />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Notes" optional full>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
        <p className="tiny muted" style={{ margin: 0 }}><Icon name="activity" size={11} /> OCR auto-extraction runs on upload when enabled.</p>
      </div>
    </Modal>
  );
}
