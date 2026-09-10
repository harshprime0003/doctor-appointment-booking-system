export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  RECEPTIONIST: 'receptionist',
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

// Live tracking states (Uber-style) used for the queue/token board.
export const TRACK_STATUS = {
  BOOKED: 'booked',
  WAITING: 'waiting', // checked-in at reception
  CALLED: 'called',
  IN_CONSULTATION: 'in_consultation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const APPOINTMENT_TYPE = { REGULAR: 'regular', EMERGENCY: 'emergency' };

export const EMERGENCY_SURCHARGE = 300;
export const GST_RATE = 0.18;

export const PAYMENT_STATUS = { PENDING: 'pending', PAID: 'paid', REFUNDED: 'refunded', FAILED: 'failed' };
export const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'wallet'];

export const SPECIALTIES = [
  'General Physician',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Gynecology',
  'ENT',
  'Ophthalmology',
  'Psychiatry',
  'Dentistry',
  'Gastroenterology',
  'Pulmonology',
  'Endocrinology',
];

export const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Kannada'];

export const INSURANCES = [
  'Star Health',
  'HDFC Ergo',
  'ICICI Lombard',
  'Max Bupa',
  'LIC Health',
  'Care Health',
  'None',
];

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const LEAVE_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' };
