import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, Input, Badge } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { currency } from '../utils/format.js';

const CATEGORIES = [
  { name: 'Fever & Pain', icon: 'activity', color: 'rose' },
  { name: 'Cold & Cough', icon: 'heart', color: 'sky' },
  { name: 'Vitamins', icon: 'pill', color: 'amber' },
  { name: 'Diabetes', icon: 'dollar', color: 'teal' },
  { name: 'Skin Care', icon: 'user', color: 'violet' },
  { name: 'Devices', icon: 'activity', color: 'indigo' },
];

const MEDS = [
  { name: 'Paracetamol 500mg', pack: 'Strip of 15', price: 30, color: 'rose' },
  { name: 'Cetirizine 10mg', pack: 'Strip of 10', price: 25, color: 'sky' },
  { name: 'Vitamin D3 60K', pack: '4 capsules', price: 149, color: 'amber' },
  { name: 'Pantoprazole 40mg', pack: 'Strip of 15', price: 95, color: 'teal' },
  { name: 'Multivitamin Daily', pack: '30 tablets', price: 210, color: 'violet' },
  { name: 'Digital Thermometer', pack: '1 unit', price: 199, color: 'indigo' },
];

export default function Pharmacy() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const list = MEDS.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Pharmacy' }]} />
      <PageHeader title="Pharmacy" subtitle="Order medicines and health products delivered to your door." />

      <div className="tip-card tip-2" style={{ marginBottom: 20 }}>
        <Icon name="pill" size={22} />
        <div>
          <div style={{ fontWeight: 750, fontSize: 15 }}>Upload a prescription to order</div>
          <div className="tiny" style={{ opacity: 0.92 }}>Flat 20% off on first order · Free delivery above ₹499</div>
        </div>
      </div>

      <Section title="Shop by category" flush>
        <div className="section-body">
          <div className="grid-3">
            {CATEGORIES.map((c) => (
              <button key={c.name} className="feature-card" style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg)' }} onClick={() => toast.info(`${c.name} catalogue`)}>
                <span className={`stat-icon si-${c.color}`}><Icon name={c.icon} size={20} /></span>
                <h3 style={{ fontSize: 14, marginTop: 8 }}>{c.name}</h3>
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section flush>
        <div className="toolbar">
          <div className="search"><Icon name="search" size={15} /><Input placeholder="Search medicines" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        <div className="section-body">
          <div className="grid-3">
            {list.map((m) => (
              <div className="feature-card" key={m.name}>
                <span className={`stat-icon si-${m.color}`}><Icon name="pill" size={20} /></span>
                <h3 style={{ fontSize: 14.5 }}>{m.name}</h3>
                <div className="tiny muted" style={{ marginBottom: 10 }}>{m.pack}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="cell-strong" style={{ fontSize: 16 }}>{currency(m.price)}</span>
                  <Button size="sm" variant="primary" icon="plus" onClick={() => toast.success(`${m.name} added to cart`)}>Add</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
