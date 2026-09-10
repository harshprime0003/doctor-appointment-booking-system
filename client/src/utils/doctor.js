// Specialty -> color + icon mapping for colorful, consistent UI treatment.
const SPECIALTY_META = {
  Cardiology: { color: 'rose', icon: 'heart' },
  Neurology: { color: 'violet', icon: 'activity' },
  Dermatology: { color: 'amber', icon: 'user' },
  Pediatrics: { color: 'sky', icon: 'users' },
  Orthopedics: { color: 'indigo', icon: 'activity' },
  Gynecology: { color: 'rose', icon: 'user' },
  ENT: { color: 'teal', icon: 'activity' },
  Ophthalmology: { color: 'sky', icon: 'activity' },
  Psychiatry: { color: 'violet', icon: 'activity' },
  Dentistry: { color: 'teal', icon: 'activity' },
  Gastroenterology: { color: 'amber', icon: 'activity' },
  Pulmonology: { color: 'sky', icon: 'activity' },
  Endocrinology: { color: 'emerald', icon: 'activity' },
  'General Physician': { color: 'emerald', icon: 'stethoscope' },
};

const COLOR_HEX = {
  teal: '#0d9488',
  indigo: '#4f46e5',
  amber: '#d97706',
  rose: '#e11d48',
  sky: '#0284c7',
  violet: '#7c3aed',
  emerald: '#059669',
  slate: '#64748b',
};

export function specialtyMeta(specialty) {
  return SPECIALTY_META[specialty] || { color: 'slate', icon: 'stethoscope' };
}

export function specialtyChipStyle(specialty) {
  const { color } = specialtyMeta(specialty);
  const hex = COLOR_HEX[color];
  return { color: hex, borderColor: `${hex}44`, background: `${hex}12` };
}

// Resolve a doctor's avatar: uploaded URL, remote URL, or a generated fallback.
export function doctorAvatar(doctor) {
  if (!doctor) return undefined;
  if (doctor.avatarUrl) return doctor.avatarUrl;
  const seed = encodeURIComponent(doctor.name || doctor.id || 'doctor');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundType=gradientLinear`;
}
