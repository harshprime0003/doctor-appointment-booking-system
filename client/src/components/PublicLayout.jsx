import { Link, NavLink, Outlet } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="pub">
      <header className="pub-nav">
        <div className="pub-nav-inner">
          <Link to="/" className="app-brand">
            <span className="mark"><Icon name="stethoscope" size={16} /></span>
            Medi<span className="brand-sub">Book</span>
          </Link>
          <nav className="pub-links">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>About Us</NavLink>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>Contact</NavLink>
          </nav>
          <div className="pub-nav-actions">
            {isAuthenticated ? (
              <Link to="/app" className="btn btn-primary">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Log in</Link>
                <Link to="/register" className="btn btn-primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pub-main">
        <Outlet />
      </main>

      <footer className="pub-footer">
        <div className="pub-footer-inner">
          <div>
            <div className="app-brand" style={{ color: '#fff' }}>
              <span className="mark" style={{ background: '#fff', color: 'var(--primary-hover)' }}><Icon name="stethoscope" size={16} /></span>
              MediBook
            </div>
            <p className="pub-footer-tag">Modern clinic scheduling &amp; practice management for patients, doctors and clinics.</p>
          </div>
          <div className="pub-footer-cols">
            <div>
              <h4>Product</h4>
              <Link to="/register">Book an appointment</Link>
              <Link to="/register">For doctors</Link>
              <Link to="/login">Sign in</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/about">About us</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div>
              <h4>Contact</h4>
              <span>support@medibook.test</span>
              <span>+91 80 4000 1000</span>
              <span>Bengaluru, India</span>
            </div>
          </div>
        </div>
        <div className="pub-footer-bottom">© {new Date().getFullYear()} MediBook. Demo project — not for clinical use.</div>
      </footer>
    </div>
  );
}
