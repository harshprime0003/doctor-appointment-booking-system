import api from './client.js';

export const AuthApi = {
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (data) => api.patch('/auth/profile', data).then((r) => r.data),
  changePassword: (data) => api.post('/auth/change-password', data).then((r) => r.data),
  uploadAvatar: (formData) => api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
};

export const PatientApi = {
  list: (params) => api.get('/patients', { params }).then((r) => r.data),
};

export const MetaApi = {
  get: () => api.get('/meta').then((r) => r.data),
};

export const DoctorApi = {
  list: (params) => api.get('/doctors', { params }).then((r) => r.data),
  get: (id) => api.get(`/doctors/${id}`).then((r) => r.data),
  slots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }).then((r) => r.data),
  myProfile: () => api.get('/doctors/me/profile').then((r) => r.data),
  updateMyProfile: (data) => api.patch('/doctors/me/profile', data).then((r) => r.data),
  myPatients: () => api.get('/doctors/me/patients').then((r) => r.data),
};

export const AppointmentApi = {
  list: (params) => api.get('/appointments', { params }).then((r) => r.data),
  get: (id) => api.get(`/appointments/${id}`).then((r) => r.data),
  create: (data) => api.post('/appointments', data).then((r) => r.data),
  updateStatus: (id, data) => api.patch(`/appointments/${id}/status`, data).then((r) => r.data),
  track: (id, trackStatus) => api.patch(`/appointments/${id}/track`, { trackStatus }).then((r) => r.data),
  queue: (params) => api.get('/appointments/queue', { params }).then((r) => r.data),
};

export const ReviewApi = {
  create: (data) => api.post('/reviews', data).then((r) => r.data),
};

export const SymptomApi = {
  check: (data) => api.post('/symptom/check', data).then((r) => r.data),
  recommend: (data) => api.post('/symptom/recommend', data).then((r) => r.data),
};

export const PaymentApi = {
  quote: (data) => api.post('/payments/quote', data).then((r) => r.data),
  invoice: (appointmentId) => api.get(`/payments/invoice/${appointmentId}`).then((r) => r.data),
  mine: () => api.get('/payments/mine').then((r) => r.data),
};

export const VitalsApi = {
  list: (params) => api.get('/vitals', { params }).then((r) => r.data),
  add: (data) => api.post('/vitals', data).then((r) => r.data),
  remove: (id) => api.delete(`/vitals/${id}`).then((r) => r.data),
};

export const NotificationApi = {
  list: () => api.get('/notifications').then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
};

export const PrescriptionApi = {
  list: (params) => api.get('/prescriptions', { params }).then((r) => r.data),
  get: (id) => api.get(`/prescriptions/${id}`).then((r) => r.data),
  create: (data) => api.post('/prescriptions', data).then((r) => r.data),
};

export const RecordApi = {
  list: (params) => api.get('/records', { params }).then((r) => r.data),
  upload: (formData) => api.post('/records', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id, data) => api.patch(`/records/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/records/${id}`).then((r) => r.data),
};

export const LeaveApi = {
  list: (params) => api.get('/leaves', { params }).then((r) => r.data),
  create: (data) => api.post('/leaves', data).then((r) => r.data),
  decide: (id, decision) => api.patch(`/leaves/${id}/decision`, { decision }).then((r) => r.data),
};

export const BranchApi = {
  list: () => api.get('/branches').then((r) => r.data),
  create: (data) => api.post('/branches', data).then((r) => r.data),
  update: (id, data) => api.patch(`/branches/${id}`, data).then((r) => r.data),
};

export const AdminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  doctors: (params) => api.get('/admin/doctors', { params }).then((r) => r.data),
  createDoctor: (data) => api.post('/admin/doctors', data).then((r) => r.data),
  updateDoctorStatus: (id, status) => api.patch(`/admin/doctors/${id}/status`, { status }).then((r) => r.data),
  updateDoctor: (id, data) => api.patch(`/admin/doctors/${id}`, data).then((r) => r.data),
  createReceptionist: (data) => api.post('/admin/receptionists', data).then((r) => r.data),
  payments: (params) => api.get('/admin/payments', { params }).then((r) => r.data),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }).then((r) => r.data),
};

export const DoctorAvatarApi = {
  upload: (formData) => api.post('/doctors/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
};
