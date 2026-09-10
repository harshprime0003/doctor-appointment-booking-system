import { useEffect, useState, useCallback } from 'react';
import { LeaveApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, StatusBadge, Select } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import { formatDate, titleCase } from '../utils/format.js';

export default function ReceptionLeaves() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    LeaveApi.list(status ? { status } : {}).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [status]);
  useEffect(load, [load]);

  const decide = async (leave, decision) => {
    try {
      await LeaveApi.decide(leave.id, decision);
      toast.success(`Leave ${decision}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Leave Requests' }]} />
      <PageHeader title="Doctor leave requests" subtitle="Approve or reject time-off requests from doctors." />
      <Section flush>
        <div className="toolbar">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        <DataTable
          loading={loading}
          rows={data}
          empty={<div className="empty-state"><h3>No requests</h3><p className="muted">Leave requests will show up here.</p></div>}
          columns={[
            { key: 'doctorName', header: 'Doctor', className: 'cell-strong' },
            { key: 'from', header: 'From', render: (r) => formatDate(r.from) },
            { key: 'to', header: 'To', render: (r) => formatDate(r.to) },
            { key: 'type', header: 'Type', render: (r) => titleCase(r.type) },
            { key: 'reason', header: 'Reason', render: (r) => <span className="cell-muted">{r.reason || '—'}</span> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status === 'approved' ? 'active' : r.status === 'rejected' ? 'disabled' : 'pending'} /> },
            {
              key: 'actions', header: '', render: (r) =>
                r.status === 'pending' ? (
                  <div className="row-actions">
                    <Button size="sm" variant="success" icon="check" onClick={() => decide(r, 'approved')}>Approve</Button>
                    <Button size="sm" variant="danger" icon="x" onClick={() => decide(r, 'rejected')}>Reject</Button>
                  </div>
                ) : <span className="tiny muted">Reviewed</span>,
            },
          ]}
        />
      </Section>
    </div>
  );
}
