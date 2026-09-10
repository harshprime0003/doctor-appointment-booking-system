import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

const FEATURES = [
  { icon: 'search', color: 'teal', title: 'Smart doctor search', text: 'Filter by specialty, disease, city, language, insurance, fee and rating.' },
  { icon: 'activity', color: 'indigo', title: 'AI symptom checker', text: 'Describe symptoms and get a suggested specialist and urgency level.' },
  { icon: 'ticket', color: 'amber', title: 'Live queue & tokens', text: 'Real-time token board with “now serving” and estimated wait times.' },
  { icon: 'pill', color: 'rose', title: 'Digital prescriptions', text: 'Doctors write & sign; patients view and download as PDF.' },
  { icon: 'fileText', color: 'sky', title: 'Health records (EHR)', text: 'Keep lab reports, scans and vaccination records in one place.' },
  { icon: 'creditCard', color: 'emerald', title: 'Secure payments', text: 'Pay online with UPI, cards or wallets and get a GST invoice.' },
];

const SPECIALTIES = ['Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Gynecology', 'ENT', 'General Physician', 'Psychiatry', 'Dentistry'];

const STEPS = [
  { n: 1, title: 'Find your doctor', text: 'Search by specialty or let the AI checker guide you.' },
  { n: 2, title: 'Pick a slot & pay', text: 'Choose an available time and confirm with secure payment.' },
  { n: 3, title: 'Visit & get care', text: 'Track your live queue, consult, and get a digital prescription.' },
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <span className="hero-eyebrow"><Icon name="heart" size={13} /> Trusted by 500+ doctors</span>
          <h1>Healthcare appointments, without the waiting room chaos.</h1>
          <p>MediBook lets patients book verified doctors, check symptoms with AI, pay online and track their live queue — while clinics manage everything from one dashboard.</p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">Book an appointment</Link>
            <Link to="/about" className="btn btn-lg">How it works</Link>
          </div>
          <div className="hero-stats">
            <div><strong>10k+</strong><span>Appointments</span></div>
            <div><strong>500+</strong><span>Doctors</span></div>
            <div><strong>4.8★</strong><span>Avg rating</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card hero-card-main">
            <div className="hc-row">
              <span className="avatar avatar-lg"><img src="https://i.pravatar.cc/200?img=32" alt="" /></span>
              <div>
                <div className="cell-strong">Dr. Kavita Deshpande</div>
                <div className="tiny muted">General Physician · Bengaluru</div>
                <div className="stars" style={{ color: '#f59e0b', marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => <Icon key={s} name="star" size={13} />)}
                </div>
              </div>
            </div>
            <div className="hc-slots">
              {['09:00', '09:30', '10:00', '11:30'].map((s, i) => (
                <span key={s} className={`hc-slot${i === 1 ? ' on' : ''}`}>{s}</span>
              ))}
            </div>
            <Link to="/register" className="btn btn-primary btn-block">Confirm booking</Link>
          </div>
          <div className="hero-card hero-card-token">
            <div className="tiny" style={{ opacity: 0.85 }}>NOW SERVING</div>
            <div className="hc-token">#12</div>
            <div className="tiny">Est. wait ~10 min</div>
          </div>
          <div className="hero-card hero-card-pill">
            <span className="stat-icon si-rose"><Icon name="activity" size={18} /></span>
            <div>
              <div className="cell-strong tiny">AI Symptom Checker</div>
              <div className="tiny muted">Fever + cough → GP</div>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-section-head">
          <h2>Everything a modern clinic needs</h2>
          <p className="muted">One platform for patients, doctors, receptionists and administrators.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <span className={`stat-icon si-${f.color}`}><Icon name={f.icon} size={20} /></span>
              <h3>{f.title}</h3>
              <p className="muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pub-section pub-section-alt">
        <div className="pub-section-head">
          <h2>Care across specialties</h2>
          <p className="muted">Book from a wide network of verified specialists.</p>
        </div>
        <div className="spec-cloud">
          {SPECIALTIES.map((s) => (
            <Link key={s} to="/register" className="spec-cloud-chip">{s}</Link>
          ))}
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-section-head">
          <h2>How it works</h2>
        </div>
        <div className="steps-grid">
          {STEPS.map((st) => (
            <div className="step-card" key={st.n}>
              <span className="step-num">{st.n}</span>
              <h3>{st.title}</h3>
              <p className="muted">{st.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>Ready to see a doctor?</h2>
          <p>Create a free account and book your first appointment in minutes.</p>
        </div>
        <div className="cta-actions">
          <Link to="/register" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary-hover)', borderColor: '#fff' }}>Get started</Link>
          <Link to="/login" className="btn btn-lg btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>Log in</Link>
        </div>
      </section>
    </div>
  );
}
