import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

const VALUES = [
  { icon: 'heart', color: 'rose', title: 'Patients first', text: 'Every decision starts with a better patient experience.' },
  { icon: 'shield', color: 'teal', title: 'Privacy & security', text: 'Role-based access and secure handling of health data.' },
  { icon: 'activity', color: 'indigo', title: 'Practical technology', text: 'AI and automation that genuinely reduce waiting and paperwork.' },
  { icon: 'users', color: 'amber', title: 'For the whole clinic', text: 'Doctors, receptionists and admins work in one connected system.' },
];

const TEAM = [
  { name: 'Dr. Ananya Sharma', role: 'Chief Medical Advisor', img: 5 },
  { name: 'Rohan Mehta', role: 'Head of Product', img: 12 },
  { name: 'Priya Nair', role: 'Head of Operations', img: 45 },
  { name: 'Arjun Rao', role: 'Engineering Lead', img: 15 },
];

export default function About() {
  return (
    <div className="home">
      <section className="pub-hero-sm">
        <span className="hero-eyebrow"><Icon name="building" size={13} /> About MediBook</span>
        <h1>We're making clinic visits calmer and more connected.</h1>
        <p>MediBook started with a simple frustration: booking a doctor and waiting endlessly. We built a single platform that handles discovery, booking, payments, queues, prescriptions and records — so patients spend less time waiting and clinics spend less time on admin.</p>
      </section>

      <section className="pub-section">
        <div className="grid-4 about-stats">
          <div className="about-stat"><strong>10k+</strong><span>Appointments booked</span></div>
          <div className="about-stat"><strong>500+</strong><span>Verified doctors</span></div>
          <div className="about-stat"><strong>14</strong><span>Specialties</span></div>
          <div className="about-stat"><strong>4.8★</strong><span>Average rating</span></div>
        </div>
      </section>

      <section className="pub-section pub-section-alt">
        <div className="pub-section-head"><h2>What we value</h2></div>
        <div className="feature-grid">
          {VALUES.map((v) => (
            <div className="feature-card" key={v.title}>
              <span className={`stat-icon si-${v.color}`}><Icon name={v.icon} size={20} /></span>
              <h3>{v.title}</h3>
              <p className="muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-section-head"><h2>The team</h2><p className="muted">A small group of clinicians, designers and engineers.</p></div>
        <div className="team-grid">
          {TEAM.map((m) => (
            <div className="team-card" key={m.name}>
              <span className="avatar avatar-xl"><img src={`https://i.pravatar.cc/240?img=${m.img}`} alt="" /></span>
              <div className="cell-strong" style={{ marginTop: 10 }}>{m.name}</div>
              <div className="tiny muted">{m.role}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>Have questions?</h2>
          <p>We'd love to hear from you.</p>
        </div>
        <div className="cta-actions">
          <Link to="/contact" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary-hover)', borderColor: '#fff' }}>Contact us</Link>
        </div>
      </section>
    </div>
  );
}
