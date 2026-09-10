import { useEffect, useState, useRef } from 'react';
import { DoctorApi, MetaApi, DoctorAvatarApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Loading, Field, Input, Select, Textarea, Button, Alert, StatusBadge, Avatar } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { doctorAvatar } from '../utils/doctor.js';

export default function DoctorPublicProfile() {
  const toast = useToast();
  const fileRef = useRef();
  const [meta, setMeta] = useState({ specialties: [], languages: [], insurances: [] });
  const [doctor, setDoctor] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hydrate = (d) => setForm({
    name: d.name || '', specialty: d.specialty || '', qualifications: d.qualifications || '',
    experienceYears: d.experienceYears ?? 0, consultationFee: d.consultationFee ?? 0,
    city: d.city || '', hospital: d.hospital || '', gender: d.gender || '',
    clinicAddress: d.clinicAddress || '', languages: (d.languages || []).join(', '),
    insurances: (d.insurances || []).join(', '), conditions: (d.conditions || []).join(', '), bio: d.bio || '',
  });

  useEffect(() => {
    Promise.all([DoctorApi.myProfile(), MetaApi.get()])
      .then(([res, m]) => { setDoctor(res.doctor); setMeta(m); hydrate(res.doctor); })
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        insurances: form.insurances.split(',').map((s) => s.trim()).filter(Boolean),
        conditions: form.conditions.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (!payload.gender) delete payload.gender;
      const res = await DoctorApi.updateMyProfile(payload);
      setDoctor(res.doctor);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await DoctorAvatarApi.upload(fd);
      setDoctor((d) => ({ ...d, avatarUrl: res.avatarUrl }));
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading || !form) return <Loading />;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Public Profile' }]} />
      <PageHeader title="Public profile" subtitle="This is what patients see in the directory." actions={<StatusBadge status={doctor.status} />} />

      {doctor.status === 'pending' && <Alert variant="warning">Your profile is pending approval and is not yet visible to patients.</Alert>}
      {doctor.status === 'inactive' && <Alert variant="danger">Your profile has been deactivated by an administrator.</Alert>}

      <Section title="Profile photo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={doctor.name} src={doctorAvatar(doctor)} size="xl" />
          <div>
            <Button icon="camera" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload new photo'}</Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
            <div className="field-hint">JPG, PNG or WEBP up to 4 MB. A clear headshot works best.</div>
          </div>
        </div>
      </Section>

      <Section title="Professional details">
        <form onSubmit={save}>
          <div className="form-grid">
            <Field label="Display name"><Input value={form.name} onChange={set('name')} required /></Field>
            <Field label="Specialty">
              <Select value={form.specialty} onChange={set('specialty')} required>
                {meta.specialties.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={set('gender')}>
                <option value="">Not specified</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Experience (years)"><Input type="number" min="0" value={form.experienceYears} onChange={set('experienceYears')} /></Field>
            <Field label="Consultation fee (₹)"><Input type="number" min="0" value={form.consultationFee} onChange={set('consultationFee')} /></Field>
            <Field label="Qualifications"><Input value={form.qualifications} onChange={set('qualifications')} placeholder="MBBS, MD" /></Field>
            <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
            <Field label="Hospital / Branch"><Input value={form.hospital} onChange={set('hospital')} /></Field>
            <Field label="Clinic address" full><Input value={form.clinicAddress} onChange={set('clinicAddress')} /></Field>
            <Field label="Languages" hint="Comma separated"><Input value={form.languages} onChange={set('languages')} placeholder="English, Hindi" /></Field>
            <Field label="Insurance accepted" hint="Comma separated"><Input value={form.insurances} onChange={set('insurances')} placeholder="Star Health, HDFC Ergo" /></Field>
            <Field label="Conditions treated" hint="Comma separated (helps search)" full><Input value={form.conditions} onChange={set('conditions')} placeholder="fever, chest pain, diabetes" /></Field>
            <Field label="Biography" full><Textarea value={form.bio} onChange={set('bio')} maxLength={1000} /></Field>
          </div>
          <div className="form-actions"><Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button></div>
        </form>
      </Section>
    </div>
  );
}
