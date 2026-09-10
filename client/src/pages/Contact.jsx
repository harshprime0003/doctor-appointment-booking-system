import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Field, Input, Textarea, Button } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';

const INFO = [
  { icon: 'mapPin', title: 'Head office', lines: ['12 MG Road', 'Bengaluru 560001, India'] },
  { icon: 'phone', title: 'Phone', lines: ['+91 80 4000 1000', 'Mon–Sat, 9am–7pm'] },
  { icon: 'mail', title: 'Email', lines: ['support@medibook.test', 'sales@medibook.test'] },
];

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success('Thanks! We will get back to you shortly.');
    }, 700);
  };

  return (
    <div className="home">
      <section className="pub-hero-sm">
        <span className="hero-eyebrow"><Icon name="mail" size={13} /> Contact</span>
        <h1>Get in touch</h1>
        <p>Questions about booking, partnering your clinic, or anything else? Send us a message.</p>
      </section>

      <section className="pub-section">
        <div className="contact-grid">
          <div className="contact-form-wrap">
            <h2 style={{ marginBottom: 16 }}>Send a message</h2>
            <form onSubmit={submit}>
              <div className="form-grid">
                <Field label="Your name"><Input value={form.name} onChange={set('name')} required /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required /></Field>
                <Field label="Subject" full><Input value={form.subject} onChange={set('subject')} placeholder="How can we help?" /></Field>
                <Field label="Message" full><Textarea value={form.message} onChange={set('message')} required placeholder="Write your message…" /></Field>
              </div>
              <Button variant="primary" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</Button>
            </form>
          </div>
          <div className="contact-info">
            {INFO.map((i) => (
              <div className="contact-info-card" key={i.title}>
                <span className="stat-icon si-teal"><Icon name={i.icon} size={18} /></span>
                <div>
                  <div className="cell-strong">{i.title}</div>
                  {i.lines.map((l) => <div className="tiny muted" key={l}>{l}</div>)}
                </div>
              </div>
            ))}
            <div className="contact-map"><Icon name="mapPin" size={22} /> Bengaluru · Mumbai · Delhi</div>
          </div>
        </div>
      </section>
    </div>
  );
}
