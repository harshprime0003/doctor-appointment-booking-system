import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

const FEATURED = [
  { cls: 'tip-1', icon: 'heart', tag: 'Heart Health', title: '5 habits for a healthier heart', text: 'Simple daily changes — from walking to reducing salt — that protect your cardiovascular health.' },
  { cls: 'tip-2', icon: 'activity', tag: 'Fitness', title: 'How much exercise do you really need?', text: 'The 150-minutes-a-week guideline, and how to fit movement into a busy schedule.' },
  { cls: 'tip-3', icon: 'clock', tag: 'Sleep', title: 'Better sleep in 7 steps', text: 'Evidence-based tips to fall asleep faster and wake up refreshed.' },
];

const CATEGORIES = [
  { icon: 'heart', color: 'rose', title: 'Nutrition', items: ['Balanced plate basics', 'Cutting added sugar', 'Hydration myths'] },
  { icon: 'activity', color: 'indigo', title: 'Mental wellbeing', items: ['Managing stress', 'Breathing exercises', 'Digital detox'] },
  { icon: 'shield', color: 'teal', title: 'Prevention', items: ['Vaccination schedule', 'Annual health checks', 'Early warning signs'] },
  { icon: 'users', color: 'amber', title: 'Family health', items: ['Child nutrition', "Seniors' care", 'Home first-aid'] },
];

const FAQ = [
  { q: 'How often should I get a health check-up?', a: 'For most healthy adults, once a year is a good baseline; more often if you have chronic conditions.' },
  { q: 'When is a fever an emergency?', a: 'Seek urgent care for a fever above 103°F, or one with chest pain, breathing difficulty, or confusion.' },
  { q: 'Are teleconsultations effective?', a: 'For follow-ups, prescriptions and minor issues, yes — your doctor will advise if an in-person visit is needed.' },
];

export default function HealthTips() {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Health Tips' }]} />
      <PageHeader title="Health Tips & Articles" subtitle="Curated, doctor-reviewed guidance to help you stay well." />

      <div className="tips-grid" style={{ marginBottom: 20 }}>
        {FEATURED.map((f) => (
          <div className={`tip-card ${f.cls}`} key={f.title} style={{ flexDirection: 'column', minHeight: 170 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name={f.icon} size={20} />
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>{f.tag}</span>
            </div>
            <div style={{ fontWeight: 750, fontSize: 16, marginTop: 10 }}>{f.title}</div>
            <div className="tiny" style={{ opacity: 0.92, marginTop: 4 }}>{f.text}</div>
          </div>
        ))}
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {CATEGORIES.map((c) => (
          <div className="feature-card" key={c.title}>
            <span className={`stat-icon si-${c.color}`}><Icon name={c.icon} size={20} /></span>
            <h3 style={{ fontSize: 15 }}>{c.title}</h3>
            <ul className="muted" style={{ margin: '6px 0 0', paddingLeft: 16, lineHeight: 1.9, fontSize: 13 }}>
              {c.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <Section title="Frequently asked questions">
        {FAQ.map((f, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: i < FAQ.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div className="cell-strong" style={{ display: 'flex', gap: 8 }}><Icon name="alert" size={15} style={{ color: 'var(--primary)', marginTop: 2 }} /> {f.q}</div>
            <p className="muted" style={{ margin: '6px 0 0 23px' }}>{f.a}</p>
          </div>
        ))}
      </Section>
    </div>
  );
}
