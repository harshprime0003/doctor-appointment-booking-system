import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Loading } from './components/ui.jsx';
import AppLayout from './components/AppLayout.jsx';
import PublicLayout from './components/PublicLayout.jsx';

import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ReceptionRecords from './pages/ReceptionRecords.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DoctorDirectory from './pages/DoctorDirectory.jsx';
import DoctorDetail from './pages/DoctorDetail.jsx';
import Appointments from './pages/Appointments.jsx';
import AppointmentDetail from './pages/AppointmentDetail.jsx';
import Profile from './pages/Profile.jsx';
import DoctorPatients from './pages/DoctorPatients.jsx';
import DoctorSchedule from './pages/DoctorSchedule.jsx';
import DoctorPublicProfile from './pages/DoctorPublicProfile.jsx';
import DoctorLeaves from './pages/DoctorLeaves.jsx';
import AdminDoctors from './pages/AdminDoctors.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminAudit from './pages/AdminAudit.jsx';
import AdminPayments from './pages/AdminPayments.jsx';
import SymptomChecker from './pages/SymptomChecker.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import HealthRecords from './pages/HealthRecords.jsx';
import VitalsTracker from './pages/VitalsTracker.jsx';
import Billing from './pages/Billing.jsx';
import Notifications from './pages/Notifications.jsx';
import HealthTips from './pages/HealthTips.jsx';
import LabTests from './pages/LabTests.jsx';
import Pharmacy from './pages/Pharmacy.jsx';
import Support from './pages/Support.jsx';
import QueueBoard from './pages/QueueBoard.jsx';
import ReceptionLeaves from './pages/ReceptionLeaves.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();
  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Loading label="Loading MediBook…" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/app" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return null;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public marketing site + auth, all sharing the public navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      </Route>

      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />

        {/* Patient */}
        <Route path="doctors" element={<RoleRoute roles={['patient']}><DoctorDirectory /></RoleRoute>} />
        <Route path="doctors/:id" element={<RoleRoute roles={['patient']}><DoctorDetail /></RoleRoute>} />
        <Route path="symptom-checker" element={<RoleRoute roles={['patient']}><SymptomChecker /></RoleRoute>} />
        <Route path="prescriptions" element={<RoleRoute roles={['patient']}><Prescriptions /></RoleRoute>} />
        <Route path="records" element={<RoleRoute roles={['patient']}><HealthRecords /></RoleRoute>} />
        <Route path="vitals" element={<RoleRoute roles={['patient']}><VitalsTracker /></RoleRoute>} />
        <Route path="billing" element={<RoleRoute roles={['patient']}><Billing /></RoleRoute>} />
        <Route path="tips" element={<RoleRoute roles={['patient']}><HealthTips /></RoleRoute>} />
        <Route path="lab-tests" element={<RoleRoute roles={['patient']}><LabTests /></RoleRoute>} />
        <Route path="pharmacy" element={<RoleRoute roles={['patient']}><Pharmacy /></RoleRoute>} />
        <Route path="support" element={<Support />} />
        <Route path="notifications" element={<Notifications />} />

        {/* Shared */}
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />

        {/* Doctor */}
        <Route path="patients" element={<RoleRoute roles={['doctor']}><DoctorPatients /></RoleRoute>} />
        <Route path="schedule" element={<RoleRoute roles={['doctor']}><DoctorSchedule /></RoleRoute>} />
        <Route path="leaves" element={<RoleRoute roles={['doctor']}><DoctorLeaves /></RoleRoute>} />
        <Route path="doctor-profile" element={<RoleRoute roles={['doctor']}><DoctorPublicProfile /></RoleRoute>} />

        {/* Doctor + Receptionist */}
        <Route path="queue" element={<RoleRoute roles={['doctor', 'receptionist']}><QueueBoard /></RoleRoute>} />
        <Route path="reception/leaves" element={<RoleRoute roles={['receptionist']}><ReceptionLeaves /></RoleRoute>} />
        <Route path="reception/records" element={<RoleRoute roles={['receptionist']}><ReceptionRecords /></RoleRoute>} />

        {/* Admin */}
        <Route path="admin/doctors" element={<RoleRoute roles={['admin']}><AdminDoctors /></RoleRoute>} />
        <Route path="admin/users" element={<RoleRoute roles={['admin']}><AdminUsers /></RoleRoute>} />
        <Route path="admin/audit" element={<RoleRoute roles={['admin']}><AdminAudit /></RoleRoute>} />
        <Route path="admin/payments" element={<RoleRoute roles={['admin']}><AdminPayments /></RoleRoute>} />
        <Route path="admin/appointments" element={<RoleRoute roles={['admin']}><Appointments /></RoleRoute>} />

        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
