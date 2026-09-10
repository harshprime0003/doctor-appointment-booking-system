import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { MetaApi } from '../api/endpoints.js';
import { Field, Input, Select, Button, Alert } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient', phone: '', gender: '', specialty: '', experienceYears: '', consultationFee: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { MetaApi.get().then((m) => setSpecialties(m.specialties)).catch(() => {}); }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);
      const user = await register(payload);
      toast.success('Account created');
      if (user.role === 'doctor') toast.info('Your doctor profile is pending administrator approval.');
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = form.role === 'doctor';

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <h1>Create your account</h1>
        <p className="sub">Patients can book instantly. Doctors get a workspace once approved.</p>
        {error && <Alert variant="error">{error}</Alert>}
        <form onSubmit={submit}>
          <Field label="I am registering as">
            <div style={{ display: 'flex', gap: 8 }}>
              {['patient', 'doctor'].map((r) => (
                <button type="button" key={r} className={`btn${form.role === r ? ' btn-primary' : ''}`} style={{ flex: 1 }} onClick={() => setForm((f) => ({ ...f, role: r }))}>
                  <Icon name={r === 'doctor' ? 'stethoscope' : 'user'} size={15} />
                  {r === 'doctor' ? 'Doctor' : 'Patient'}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Full name"><Input name="name" value={form.name} onChange={onChange} required placeholder="Jane Doe" /></Field>
          <div className="form-grid">
            <Field label="Email"><Input type="email" name="email" value={form.email} onChange={onChange} required placeholder="you@example.com" /></Field>
            <Field label="Password"><Input type="password" name="password" value={form.password} onChange={onChange} required minLength={6} placeholder="Min. 6 characters" /></Field>
            <Field label="Phone" optional><Input name="phone" value={form.phone} onChange={onChange} placeholder="98765 43210" /></Field>
            <Field label="Gender" optional>
              <Select name="gender" value={form.gender} onChange={onChange}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
          </div>
          {isDoctor && (
            <div className="form-grid" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <Field label="Specialty" full>
                <Select name="specialty" value={form.specialty} onChange={onChange} required>
                  <option value="">Select a specialty</option>
                  {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Experience (years)"><Input type="number" name="experienceYears" value={form.experienceYears} onChange={onChange} min="0" placeholder="0" /></Field>
              <Field label="Consultation fee (₹)"><Input type="number" name="consultationFee" value={form.consultationFee} onChange={onChange} min="0" placeholder="500" /></Field>
            </div>
          )}
          <Button variant="primary" className="btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <div className="auth-alt">Already have an account? <Link to="/login">Sign in</Link></div>
      </div>
    </div>
  );
}
