import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminApi, MetaApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Input, Select, Button, StatusBadge, Pagination, Avatar, Field, Stars } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icon.jsx';
import { currency } from '../utils/format.js';

export default function AdminDoctors() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [specialties, setSpecialties] = useState([]);
  const [filters, setFilters] = useState({ search: '', specialty: '', status: searchParams.get('status') || '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    MetaApi.get().then((m) => setSpecialties(m.specialties)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.specialty) params.specialty = filters.specialty;
      if (filters.status) params.status = filters.status;
      setResult(await AdminApi.doctors(params));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(1), [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const changeStatus = async (doctor, status) => {
    try {
      await AdminApi.updateDoctorStatus(doctor.id, status);
      toast.success(`Doctor ${status === 'active' ? 'activated' : status}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Doctors' }]} />
      <PageHeader
        title="Doctors"
        subtitle="Approve new registrations and manage the doctor directory."
        actions={<Button variant="primary" icon="plus" onClick={() => setShowCreate(true)}>Add doctor</Button>}
      />

      <Section flush>
        <div className="toolbar">
          <div className="search">
            <Icon name="search" size={15} />
            <Input placeholder="Search by name" value={filters.search} onChange={set('search')} />
          </div>
          <Select value={filters.specialty} onChange={set('specialty')}>
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={filters.status} onChange={set('status')}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <DataTable
          loading={loading}
          rows={result.data}
          columns={[
            {
              key: 'name',
              header: 'Doctor',
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
            { key: 'specialty', header: 'Specialty' },
            { key: 'experienceYears', header: 'Exp.', align: 'right', className: 'num', render: (r) => `${r.experienceYears} yrs` },
            { key: 'consultationFee', header: 'Fee', align: 'right', className: 'num', render: (r) => currency(r.consultationFee) },
            { key: 'rating', header: 'Rating', render: (r) => <Stars value={r.rating} count={r.ratingCount} size={12} /> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div className="row-actions">
                  <Button size="sm" variant="ghost" icon="edit" onClick={() => setEdit(r)}>Edit</Button>
                  {r.status === 'pending' && <Button size="sm" variant="primary" onClick={() => changeStatus(r, 'active')}>Approve</Button>}
                  {r.status === 'active' && <Button size="sm" onClick={() => changeStatus(r, 'inactive')}>Deactivate</Button>}
                  {r.status === 'inactive' && <Button size="sm" onClick={() => changeStatus(r, 'active')}>Reactivate</Button>}
                </div>
              ),
            },
          ]}
        />
        <Pagination pagination={result.pagination} onChange={setPage} />
      </Section>

      {showCreate && (
        <CreateDoctorModal specialties={specialties} onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); load(); }} />
      )}
      {edit && (
        <EditDoctorModal doctor={edit} specialties={specialties} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />
      )}
    </div>
  );
}

function EditDoctorModal({ doctor, specialties, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({
    specialty: doctor.specialty,
    consultationFee: doctor.consultationFee,
    experienceYears: doctor.experienceYears,
    qualifications: doctor.qualifications || '',
    city: doctor.city || '',
    hospital: doctor.hospital || '',
    status: doctor.status,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await AdminApi.updateDoctor(doctor.id, { ...form, consultationFee: Number(form.consultationFee), experienceYears: Number(form.experienceYears) });
      toast.success('Doctor updated');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Edit ${doctor.name}`}
      size="lg"
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button></>}
    >
      <div className="form-grid">
        <Field label="Specialty">
          <Select value={form.specialty} onChange={set('specialty')}>
            {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </Select>
        </Field>
        <Field label="Consultation fee (₹)"><Input type="number" min="0" value={form.consultationFee} onChange={set('consultationFee')} /></Field>
        <Field label="Experience (years)"><Input type="number" min="0" value={form.experienceYears} onChange={set('experienceYears')} /></Field>
        <Field label="Qualifications"><Input value={form.qualifications} onChange={set('qualifications')} /></Field>
        <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
        <Field label="Hospital" full><Input value={form.hospital} onChange={set('hospital')} /></Field>
      </div>
    </Modal>
  );
}

function CreateDoctorModal({ specialties, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', specialty: specialties[0] || '', experienceYears: 0, consultationFee: 500, qualifications: '', city: '', gender: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, experienceYears: Number(form.experienceYears), consultationFee: Number(form.consultationFee) };
      if (!payload.gender) delete payload.gender;
      await AdminApi.createDoctor(payload);
      toast.success('Doctor created and activated');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add a doctor"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create doctor'}</Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Full name" full>
          <Input value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={set('email')} required />
        </Field>
        <Field label="Temporary password">
          <Input type="text" value={form.password} onChange={set('password')} required placeholder="Min. 6 characters" />
        </Field>
        <Field label="Specialty">
          <Select value={form.specialty} onChange={set('specialty')}>
            {specialties.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="City">
          <Input value={form.city} onChange={set('city')} />
        </Field>
        <Field label="Gender">
          <Select value={form.gender} onChange={set('gender')}>
            <option value="">Not specified</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Experience (years)">
          <Input type="number" min="0" value={form.experienceYears} onChange={set('experienceYears')} />
        </Field>
        <Field label="Consultation fee (₹)">
          <Input type="number" min="0" value={form.consultationFee} onChange={set('consultationFee')} />
        </Field>
        <Field label="Qualifications" full>
          <Input value={form.qualifications} onChange={set('qualifications')} placeholder="MBBS, MD" />
        </Field>
      </div>
    </Modal>
  );
}
