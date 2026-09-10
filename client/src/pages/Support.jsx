import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, Input, Textarea, Field } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

const TOPICS = [
  { icon: 'calendar', color: 'indigo', title: 'Appointments', text: 'Booking, rescheduling and cancellations.' },
  { icon: 'creditCard', color: 'emerald', title: 'Payments & refunds', text: 'Invoices, payment methods and refunds.' },
  { icon: 'pill', color: 'rose', title: 'Prescriptions', text: 'Accessing and downloading prescriptions.' },
  { icon: 'fileText', color: 'sky', title: 'Health records', text: 'Uploading and sharing your reports.' },
];

const FAQ = [
  { q: 'How do I reschedule an appointment?', a: 'Open My Appointments, select the visit and choose reschedule, then pick a new slot.' },
  { q: 'Is my health data secure?', a: 'Yes — access is role-based and records are only visible to you and your treating doctor.' },
  { q: 'How do refunds work?', a: 'Consultation fees are non-refundable per policy; billing issues are resolved within 3–5 days.' },
];

export default function Support() {
  const toast = useToast();
  const [msg, setMsg] = useState('');
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Help & Support' }]} />
      <PageHeader title="Help & Support" subtitle="Find answers or reach our care team 24/7." />

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {TOPICS.map((tp) => (
          <div className="feature-card" key={tp.title}>
            <span className={`stat-icon si-${tp.color}`}><Icon name={tp.icon} size={20} /></span>
            <h3 style={{ fontSize: 14.5 }}>{tp.title}</h3>
            <p className="muted tiny" style={{ margin: 0 }}>{tp.text}</p>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <Section title="Frequently asked questions">
          {FAQ.map((f, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i < FAQ.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="cell-strong" style={{ display: 'flex', gap: 8 }}><Icon name="alert" size={15} style={{ color: 'var(--primary)', marginTop: 2 }} /> {f.q}</div>
              <p className="muted" style={{ margin: '6px 0 0 23px' }}>{f.a}</p>
            </div>
          ))}
        </Section>
        <div>
          <Section title="Contact us">
            <div className="contact-info-card" style={{ marginBottom: 10 }}>
              <span className="stat-icon si-teal"><Icon name="phone" size={18} /></span>
              <div><div className="cell-strong">24/7 Helpline</div><div className="tiny muted">+91 80 4000 1000</div></div>
            </div>
            <div className="contact-info-card">
              <span className="stat-icon si-indigo"><Icon name="mail" size={18} /></span>
              <div><div className="cell-strong">Email support</div><div className="tiny muted">support@medibook.test</div></div>
            </div>
          </Section>
          <Section title="Send a message">
            <Field label="How can we help?"><Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Describe your issue…" /></Field>
            <Button variant="primary" onClick={() => { setMsg(''); toast.success('Message sent — we will reply shortly.'); }}>Submit</Button>
          </Section>
        </div>
      </div>
    </div>
  );
}
