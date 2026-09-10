import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, Badge, Input } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { currency } from '../utils/format.js';

const PACKAGES = [
  { name: 'Full Body Checkup', tests: 62, price: 1999, mrp: 3500, color: 'indigo', popular: true, desc: 'Complete health screening incl. CBC, lipid, liver, kidney & thyroid.' },
  { name: 'Diabetes Care', tests: 14, price: 899, mrp: 1500, color: 'amber', desc: 'HbA1c, fasting & PP glucose, and more.' },
  { name: 'Heart Health', tests: 20, price: 1499, mrp: 2400, color: 'rose', desc: 'Lipid profile, ECG, and cardiac markers.' },
  { name: 'Thyroid Profile', tests: 3, price: 499, mrp: 800, color: 'teal', desc: 'T3, T4 and TSH levels.' },
  { name: 'Vitamin Profile', tests: 4, price: 1299, mrp: 2000, color: 'violet', desc: 'Vitamin B12, D and more.' },
  { name: 'Liver Function', tests: 11, price: 599, mrp: 1000, color: 'sky', desc: 'Bilirubin, SGOT, SGPT and proteins.' },
];

export default function LabTests() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const list = PACKAGES.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Lab Tests' }]} />
      <PageHeader title="Lab Tests" subtitle="Book diagnostic tests with free home sample collection." />

      <div className="tip-card tip-1" style={{ marginBottom: 20 }}>
        <Icon name="activity" size={22} />
        <div>
          <div style={{ fontWeight: 750, fontSize: 15 }}>Free home sample collection</div>
          <div className="tiny" style={{ opacity: 0.92 }}>Certified labs · Reports in 24 hours · NABL accredited</div>
        </div>
      </div>

      <Section flush>
        <div className="toolbar">
          <div className="search"><Icon name="search" size={15} /><Input placeholder="Search test or package" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        <div className="section-body">
          <div className="grid-3">
            {list.map((p) => (
              <div className={`feature-card`} key={p.name} style={{ position: 'relative' }}>
                {p.popular && <span className="badge badge-primary" style={{ position: 'absolute', top: 14, right: 14 }}>Popular</span>}
                <span className={`stat-icon si-${p.color}`}><Icon name="fileText" size={20} /></span>
                <h3 style={{ fontSize: 15 }}>{p.name}</h3>
                <div className="tiny muted" style={{ marginBottom: 8 }}>{p.tests} tests included</div>
                <p className="muted tiny" style={{ margin: '0 0 12px' }}>{p.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span className="cell-strong" style={{ fontSize: 17 }}>{currency(p.price)}</span>{' '}
                    <span className="tiny muted" style={{ textDecoration: 'line-through' }}>{currency(p.mrp)}</span>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => toast.success(`${p.name} added — our team will call to schedule.`)}>Book</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
