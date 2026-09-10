import { useEffect, useState } from 'react';
import { LeaveApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, StatusBadge, Field, Input, Select } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import { formatDate, titleCase } from '../utils/format.js';
import { todayStr } from '../utils/format.js';

export default function DoctorLeaves() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const load = () => {
    setLoading(true);
    LeaveApi.list().then((r) => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'My Leaves' }]} />
      <PageHeader
        title="Leave management"
        subtitle="Block dates for holidays, vacation or emergencies. Approved leaves hide your slots."
        actions={<Button variant="primary" icon="plus" onClick={() => setShow(true)}>Request leave</Button>}
      />
      <Section flush>
        <DataTable
          loading={loading}
          rows={data}
          empty={<div className="empty-state"><h3>No leave requests</h3><p className="muted">Request time off and it will be reviewed by the front desk.</p></div>}
          columns={[
            { key: 'from', header: 'From', render: (r) => formatDate(r.from) },
            { key: 'to', header: 'To', render: (r) => formatDate(r.to) },
            { key: 'type', header: 'Type', render: (r) => titleCase(r.type) },
            { key: 'reason', header: 'Reason', render: (r) => <span className="cell-muted">{r.reason || '—'}</span> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status === 'approved' ? 'active' : r.status === 'rejected' ? 'disabled' : 'pending'} /> },
          ]}
        />
      </Section>
      {show && <RequestModal onClose={() => setShow(false)} onDone={() => { setShow(false); load(); }} />}
    </div>
  );
}

function RequestModal({ onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ from: todayStr(), to: todayStr(), type: 'leave', reason: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await LeaveApi.create(form);
      toast.success('Leave requested');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Request leave" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Submitting…' : 'Submit request'}</Button></>}>
      <div className="form-grid">
        <Field label="From"><Input type="date" value={form.from} onChange={set('from')} /></Field>
        <Field label="To"><Input type="date" value={form.to} onChange={set('to')} /></Field>
        <Field label="Type" full>
          <Select value={form.type} onChange={set('type')}>
            <option value="leave">Leave</option>
            <option value="vacation">Vacation</option>
            <option value="holiday">Holiday</option>
            <option value="emergency">Emergency</option>
          </Select>
        </Field>
        <Field label="Reason" optional full><Input value={form.reason} onChange={set('reason')} /></Field>
      </div>
    </Modal>
  );
}
