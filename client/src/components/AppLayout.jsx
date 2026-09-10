import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Icon from './Icon.jsx';
import UserMenu from './UserMenu.jsx';
import NotificationBell from './NotificationBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n, LanguageSwitcher } from '../context/I18nContext.jsx';

const NAV = {
  patient: [
    { section: 'section.overview' },
    { to: '/app', label: 'nav.dashboard', icon: 'dashboard', end: true },
    { to: '/app/doctors', label: 'nav.findDoctor', icon: 'stethoscope' },
    { to: '/app/symptom-checker', label: 'nav.symptomChecker', icon: 'activity', star: true },
    { to: '/app/notifications', label: 'nav.notifications', icon: 'bell' },
    { section: 'section.health' },
    { to: '/app/appointments', label: 'nav.myAppointments', icon: 'calendar' },
    { to: '/app/vitals', label: 'nav.vitals', icon: 'heart', star: true },
    { to: '/app/prescriptions', label: 'nav.prescriptions', icon: 'pill' },
    { to: '/app/records', label: 'nav.records', icon: 'fileText' },
    { to: '/app/tips', label: 'nav.tips', icon: 'checkCircle' },
    { section: 'section.services' },
    { to: '/app/lab-tests', label: 'nav.labTests', icon: 'activity' },
    { to: '/app/pharmacy', label: 'nav.pharmacy', icon: 'pill' },
    { to: '/app/support', label: 'nav.support', icon: 'alert' },
    { section: 'nav.account' },
    { to: '/app/billing', label: 'nav.billing', icon: 'creditCard' },
    { to: '/app/profile', label: 'nav.profile', icon: 'user' },
  ],
  doctor: [
    { section: 'section.overview' },
    { to: '/app', label: 'nav.dashboard', icon: 'dashboard', end: true },
    { to: '/app/appointments', label: 'nav.appointments', icon: 'calendar' },
    { to: '/app/queue', label: 'nav.queue', icon: 'ticket' },
    { to: '/app/patients', label: 'nav.patients', icon: 'users' },
    { section: 'section.practice' },
    { to: '/app/schedule', label: 'nav.availability', icon: 'clock' },
    { to: '/app/leaves', label: 'nav.leaves', icon: 'calendar' },
    { to: '/app/doctor-profile', label: 'nav.publicProfile', icon: 'briefcase' },
    { to: '/app/profile', label: 'nav.account', icon: 'user' },
  ],
  receptionist: [
    { section: 'section.overview' },
    { to: '/app', label: 'nav.dashboard', icon: 'dashboard', end: true },
    { to: '/app/queue', label: 'nav.queue', icon: 'ticket' },
    { to: '/app/appointments', label: 'nav.appointments', icon: 'calendar' },
    { to: '/app/reception/records', label: 'nav.records', icon: 'fileText' },
    { to: '/app/reception/leaves', label: 'nav.leaveRequests', icon: 'clock' },
    { section: 'nav.account' },
    { to: '/app/profile', label: 'nav.profile', icon: 'user' },
  ],
  admin: [
    { section: 'section.overview' },
    { to: '/app', label: 'nav.dashboard', icon: 'dashboard', end: true },
    { to: '/app/admin/appointments', label: 'nav.appointments', icon: 'calendar' },
    { to: '/app/admin/payments', label: 'nav.payments', icon: 'dollar' },
    { section: 'section.management' },
    { to: '/app/admin/doctors', label: 'nav.doctors', icon: 'stethoscope' },
    { to: '/app/admin/users', label: 'nav.users', icon: 'users' },
    { to: '/app/admin/audit', label: 'nav.audit', icon: 'shield' },
    { section: 'nav.account' },
    { to: '/app/profile', label: 'nav.profile', icon: 'user' },
  ],
};

export default function AppLayout() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const items = NAV[user?.role] || [];

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="btn btn-ghost btn-sm sidebar-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          <Icon name="menu" size={18} />
        </button>
        <Link to="/app" className="app-brand">
          <span className="mark">
            <Icon name="stethoscope" size={16} />
          </span>
          Medi<span className="brand-sub">Book</span>
        </Link>
        <span className="header-spacer" />
        <div className="header-actions">
          <LanguageSwitcher />
          {user?.role === 'patient' && <NotificationBell />}
          <UserMenu />
        </div>
      </header>
      <div className="app-body">
        <aside className={`app-sidebar${open ? ' open' : ''}`}>
          <nav>
            {items.map((item, i) =>
              item.section ? (
                <div className="nav-section-label" key={`s-${i}`}>
                  {t(item.section)}
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon name={item.icon} size={17} />
                  {t(item.label)}
                  {item.star && <Icon name="star" size={13} style={{ color: '#f59e0b', marginLeft: 'auto' }} />}
                </NavLink>
              ),
            )}
          </nav>
        </aside>
        <div className={`scrim${open ? ' show' : ''}`} onClick={() => setOpen(false)} />
        <main className="app-main">
          <div className="page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
