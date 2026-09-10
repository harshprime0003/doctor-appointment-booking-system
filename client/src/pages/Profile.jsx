import { useState, useRef } from 'react';
import { AuthApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Field, Input, Select, Button, Avatar } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { titleCase } from '../utils/format.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user.name || '',
    phone: user.phone || '',
    gender: user.gender || '',
    dob: user.dob || '',
    address: user.address || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const onAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await AuthApi.uploadAvatar(fd);
      setUser(res.user);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const setP = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));
  const setPw = (k) => (e) => setPwd((p) => ({ ...p, [k]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await AuthApi.updateProfile(profile);
      setUser(res.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePwd = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      await AuthApi.changePassword(pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Profile' }]} />
      <PageHeader title="Profile & settings" subtitle="Manage your account information and security." />

      <Section title="Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <Avatar name={user.name} src={user.avatarUrl} size="xl" />
          <div>
            <div className="cell-strong" style={{ fontSize: 15 }}>{user.name}</div>
            <div className="tiny muted" style={{ marginBottom: 8 }}>{user.email} · {titleCase(user.role)}</div>
            <Button size="sm" icon="camera" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : 'Change photo'}</Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
          </div>
        </div>
        <form onSubmit={saveProfile}>
          <div className="form-grid">
            <Field label="Full name">
              <Input value={profile.name} onChange={setP('name')} required />
            </Field>
            <Field label="Email">
              <Input value={user.email} disabled />
            </Field>
            <Field label="Phone" optional>
              <Input value={profile.phone} onChange={setP('phone')} />
            </Field>
            <Field label="Gender" optional>
              <Select value={profile.gender} onChange={setP('gender')}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Date of birth" optional>
              <Input type="date" value={profile.dob} onChange={setP('dob')} />
            </Field>
            <Field label="Address" optional>
              <Input value={profile.address} onChange={setP('address')} />
            </Field>
          </div>
          <div className="form-actions">
            <Button variant="primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      </Section>

      <Section title="Security">
        <form onSubmit={savePwd}>
          <div className="form-grid">
            <Field label="Current password">
              <Input type="password" value={pwd.currentPassword} onChange={setPw('currentPassword')} required />
            </Field>
            <Field label="New password" hint="At least 6 characters">
              <Input type="password" value={pwd.newPassword} onChange={setPw('newPassword')} required minLength={6} />
            </Field>
          </div>
          <div className="form-actions">
            <Button variant="primary" type="submit" disabled={savingPwd}>{savingPwd ? 'Updating…' : 'Change password'}</Button>
          </div>
        </form>
      </Section>
    </div>
  );
}
