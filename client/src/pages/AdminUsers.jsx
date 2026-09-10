import { useEffect, useState, useCallback } from 'react';
import { AdminApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Input, Select, Button, StatusBadge, Pagination, Avatar, Badge, Field } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icon.jsx';
import { formatDate, titleCase } from '../utils/format.js';

const ROLE_BADGE = { admin: 'info', doctor: 'neutral', patient: 'neutral' };

export default function AdminUsers() {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showStaff, setShowStaff] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      setResult(await AdminApi.users(params));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(1), [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const toggleStatus = async (user) => {
    const next = user.status === 'disabled' ? 'active' : 'disabled';
    try {
      await AdminApi.updateUserStatus(user.id, next);
      toast.success(`User ${next === 'active' ? 'enabled' : 'disabled'}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const doDelete = async () => {
    try {
      await AdminApi.deleteUser(confirmDelete.id);
      toast.success('User removed');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Users' }]} />
      <PageHeader title="Users" subtitle="All accounts across the platform." actions={<Button variant="primary" icon="plus" onClick={() => setShowStaff(true)}>Add receptionist</Button>} />

      <Section flush>
        <div className="toolbar">
          <div className="search">
            <Icon name="search" size={15} />
            <Input placeholder="Search name or email" value={filters.search} onChange={set('search')} />
          </div>
          <Select value={filters.role} onChange={set('role')}>
            <option value="">All roles</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </Select>
          <Select value={filters.status} onChange={set('status')}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
        </div>
        <DataTable
          loading={loading}
          rows={result.data}
          columns={[
            {
              key: 'name',
              header: 'User',
              render: (r) => (
                <div className="user-cell">
                  <Avatar name={r.name} />
                  <div>
                    <div className="name">{r.name}</div>
                    <div className="sub">{r.email}</div>
                  </div>
                </div>
              ),
            },
            { key: 'role', header: 'Role', render: (r) => <Badge variant={ROLE_BADGE[r.role]}>{titleCase(r.role)}</Badge> },
            { key: 'phone', header: 'Phone', render: (r) => <span className="cell-muted">{r.phone || '—'}</span> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status || 'active'} /> },
            { key: 'createdAt', header: 'Joined', render: (r) => formatDate((r.createdAt || '').slice(0, 10)) },
            {
              key: 'actions',
              header: '',
              render: (r) =>
                r.role === 'admin' ? (
                  <span className="tiny muted">—</span>
                ) : (
                  <div className="row-actions">
                    <Button size="sm" onClick={() => toggleStatus(r)}>{r.status === 'disabled' ? 'Enable' : 'Disable'}</Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirmDelete(r)} icon="trash" />
                  </div>
                ),
            },
          ]}
        />
        <Pagination pagination={result.pagination} onChange={setPage} />
      </Section>

      {showStaff && <StaffModal onClose={() => setShowStaff(false)} onDone={() => { setShowStaff(false); load(); }} />}

      {confirmDelete && (
        <Modal
          title="Remove user"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={doDelete}>Remove user</Button>
            </>
          }
        >
          <p style={{ margin: 0 }}>
            Are you sure you want to permanently remove <strong>{confirmDelete.name}</strong>? This also deletes their doctor profile if applicable. This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

function StaffModal({ onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await AdminApi.createReceptionist(form);
      toast.success('Receptionist account created');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add receptionist"
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create account'}</Button></>}
    >
      <Field label="Full name"><Input value={form.name} onChange={set('name')} /></Field>
      <div className="form-grid">
        <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Temporary password"><Input type="text" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" /></Field>
      </div>
    </Modal>
  );
}
