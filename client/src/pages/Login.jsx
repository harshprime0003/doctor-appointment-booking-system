import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field, Input, Button, Alert } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const expired = new URLSearchParams(location.search).get('expired');

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      toast.success('Signed in successfully');
      navigate(location.state?.from?.pathname || '/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="sub">Sign in to continue to your MediBook workspace.</p>
        {expired && !error && <Alert variant="warning">Your session expired. Please sign in again.</Alert>}
        {error && <Alert variant="error">{error}</Alert>}
        <form onSubmit={submit}>
          <Field label="Email address">
            <Input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@clinic.test" required autoComplete="email" />
          </Field>
          <Field label="Password">
            <Input type="password" name="password" value={form.password} onChange={onChange} placeholder="••••••••" required autoComplete="current-password" />
          </Field>
          <Button variant="primary" className="btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="auth-alt">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
