import { connectDb, disconnectDb, repo } from './db/index.js';
import { hashPassword } from './utils/auth.js';
import { ROLES, APPOINTMENT_STATUS, TRACK_STATUS, PAYMENT_STATUS } from './utils/constants.js';
import { computeCharges, makeInvoiceNo, makeTxnId } from './utils/billing.js';

const weekdayBlocks = [1, 2, 3, 4, 5].flatMap((day) => [
  { day, startTime: '09:00', endTime: '13:00', slotMinutes: 30 },
  { day, startTime: '14:00', endTime: '17:00', slotMinutes: 30 },
]);
const lunchBreaks = [1, 2, 3, 4, 5].map((day) => ({ day, startTime: '13:00', endTime: '14:00' }));

const branchSeed = [
  { name: 'MediBook City Hospital', city: 'Bengaluru', address: '12 MG Road, Bengaluru', phone: '080-4000-1000' },
  { name: 'MediBook West Clinic', city: 'Mumbai', address: '88 Linking Road, Mumbai', phone: '022-4000-2000' },
  { name: 'MediBook North Centre', city: 'Delhi', address: '5 Connaught Place, Delhi', phone: '011-4000-3000' },
];

const doctorSeed = [
  { name: 'Dr. Ananya Sharma', email: 'ananya.sharma@clinic.test', specialty: 'Cardiology', experienceYears: 14, consultationFee: 900, qualifications: 'MBBS, MD (Cardiology)', city: 'Bengaluru', gender: 'female', img: 5, successRate: 94, conditions: ['chest pain', 'high blood pressure', 'palpitations'], insurances: ['Star Health', 'HDFC Ergo'], bio: 'Interventional cardiologist focused on preventive heart care.' },
  { name: 'Dr. Rohan Mehta', email: 'rohan.mehta@clinic.test', specialty: 'Dermatology', experienceYears: 9, consultationFee: 700, qualifications: 'MBBS, MD (Dermatology)', city: 'Mumbai', gender: 'male', img: 12, successRate: 91, conditions: ['acne', 'skin rash', 'hair loss'], insurances: ['ICICI Lombard', 'Care Health'], bio: 'Clinical and cosmetic dermatology, acne and pigmentation.' },
  { name: 'Dr. Priya Nair', email: 'priya.nair@clinic.test', specialty: 'Pediatrics', experienceYears: 11, consultationFee: 600, qualifications: 'MBBS, DCH', city: 'Kochi', gender: 'female', img: 45, successRate: 96, conditions: ['fever', 'cough', 'vaccination'], insurances: ['Star Health', 'LIC Health'], bio: 'Newborn and child health, vaccinations and growth monitoring.' },
  { name: 'Dr. Vikram Singh', email: 'vikram.singh@clinic.test', specialty: 'Orthopedics', experienceYears: 17, consultationFee: 850, qualifications: 'MBBS, MS (Ortho)', city: 'Delhi', gender: 'male', img: 33, successRate: 89, conditions: ['joint pain', 'back pain', 'fracture'], insurances: ['Max Bupa', 'HDFC Ergo'], bio: 'Joint replacement and sports injury specialist.' },
  { name: 'Dr. Meera Iyer', email: 'meera.iyer@clinic.test', specialty: 'Gynecology', experienceYears: 13, consultationFee: 800, qualifications: 'MBBS, MS (OBG)', city: 'Chennai', gender: 'female', img: 47, successRate: 93, conditions: ['pregnancy', 'menstrual pain'], insurances: ['Care Health', 'Star Health'], bio: 'Women\'s health, pregnancy care and minimally invasive surgery.' },
  { name: 'Dr. Arjun Rao', email: 'arjun.rao@clinic.test', specialty: 'Neurology', experienceYears: 15, consultationFee: 1100, qualifications: 'MBBS, DM (Neurology)', city: 'Hyderabad', gender: 'male', img: 15, successRate: 88, conditions: ['headache', 'seizure', 'numbness'], insurances: ['ICICI Lombard'], bio: 'Headache, epilepsy and stroke management.' },
  { name: 'Dr. Kavita Deshpande', email: 'kavita.deshpande@clinic.test', specialty: 'General Physician', experienceYears: 8, consultationFee: 400, qualifications: 'MBBS, MD (Medicine)', city: 'Pune', gender: 'female', img: 32, successRate: 90, conditions: ['fever', 'cold', 'fatigue', 'acidity'], insurances: ['Star Health', 'HDFC Ergo', 'Care Health'], bio: 'Primary care, chronic disease and lifestyle management.' },
  { name: 'Dr. Sameer Khan', email: 'sameer.khan@clinic.test', specialty: 'ENT', experienceYears: 10, consultationFee: 650, qualifications: 'MBBS, MS (ENT)', city: 'Lucknow', gender: 'male', img: 52, successRate: 92, conditions: ['sore throat', 'ear pain', 'sinus'], insurances: ['LIC Health'], bio: 'Sinus, hearing and voice disorders.' },
  { name: 'Dr. Neha Kulkarni', email: 'neha.kulkarni@clinic.test', specialty: 'Pulmonology', experienceYears: 12, consultationFee: 950, qualifications: 'MBBS, MD (Pulmonology)', city: 'Bengaluru', gender: 'female', img: 44, successRate: 90, conditions: ['wheezing', 'breathlessness', 'cough'], insurances: ['Max Bupa', 'Star Health'], bio: 'Asthma, COPD and respiratory infections.' },
  { name: 'Dr. Rajesh Gupta', email: 'rajesh.gupta@clinic.test', specialty: 'Gastroenterology', experienceYears: 16, consultationFee: 1000, qualifications: 'MBBS, DM (Gastro)', city: 'Delhi', gender: 'male', img: 60, successRate: 91, conditions: ['abdominal pain', 'acidity', 'diarrhea'], insurances: ['HDFC Ergo', 'ICICI Lombard'], bio: 'Digestive health, endoscopy and liver care.' },
];

const patientSeed = [
  { name: 'Isha Verma', email: 'isha.verma@example.test', phone: '9876500011', gender: 'female', img: 49 },
  { name: 'Rahul Kapoor', email: 'rahul.kapoor@example.test', phone: '9876500022', gender: 'male', img: 8 },
  { name: 'Neha Gupta', email: 'neha.gupta@example.test', phone: '9876500033', gender: 'female', img: 41 },
];
const avatar = (n) => `https://i.pravatar.cc/200?img=${n}`;

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
const languagesFor = (i) => (i % 2 === 0 ? ['English', 'Hindi'] : ['English', 'Hindi', 'Tamil']);

async function run() {
  await connectDb();
  const users = repo('users');
  const doctors = repo('doctors');
  const appointments = repo('appointments');
  const reviews = repo('reviews');
  const branches = repo('branches');
  const payments = repo('payments');
  const prescriptions = repo('prescriptions');
  const records = repo('records');
  const leaves = repo('leaves');
  const auditlogs = repo('auditlogs');
  const vitals = repo('vitals');

  console.log('[seed] clearing existing data...');
  await Promise.all([
    users.deleteMany({}),
    doctors.deleteMany({}),
    appointments.deleteMany({}),
    reviews.deleteMany({}),
    branches.deleteMany({}),
    payments.deleteMany({}),
    prescriptions.deleteMany({}),
    records.deleteMany({}),
    leaves.deleteMany({}),
    auditlogs.deleteMany({}),
    vitals.deleteMany({}),
  ]);

  const password = await hashPassword('Password123');

  const branchDocs = [];
  for (const b of branchSeed) branchDocs.push(await branches.create({ ...b, status: 'active' }));

  const admin = await users.create({
    name: 'System Administrator',
    email: 'admin@clinic.test',
    passwordHash: password,
    role: ROLES.ADMIN,
    avatarUrl: avatar(13),
    status: 'active',
  });

  const reception = await users.create({
    name: 'Front Desk',
    email: 'reception@clinic.test',
    passwordHash: password,
    role: ROLES.RECEPTIONIST,
    avatarUrl: avatar(25),
    branchId: branchDocs[0].id,
    branchName: branchDocs[0].name,
    status: 'active',
  });

  const doctorProfiles = [];
  for (let i = 0; i < doctorSeed.length; i++) {
    const d = doctorSeed[i];
    const user = await users.create({ name: d.name, email: d.email, passwordHash: password, role: ROLES.DOCTOR, avatarUrl: `https://i.pravatar.cc/300?img=${d.img}`, status: 'active' });
    const branch = branchDocs[i % branchDocs.length];
    const profile = await doctors.create({
      userId: user.id,
      name: d.name,
      email: d.email,
      specialty: d.specialty,
      experienceYears: d.experienceYears,
      consultationFee: d.consultationFee,
      qualifications: d.qualifications,
      city: d.city,
      gender: d.gender,
      hospital: branch.name,
      branchId: branch.id,
      branchName: branch.name,
      avatarUrl: `https://i.pravatar.cc/300?img=${d.img}`,
      bio: d.bio,
      clinicAddress: `${d.city} Medical Centre`,
      languages: languagesFor(i),
      insurances: d.insurances,
      conditions: d.conditions,
      tags: d.conditions,
      successRate: d.successRate,
      availability: weekdayBlocks,
      breaks: lunchBreaks,
      blockedDates: [],
      status: 'active',
      rating: 0,
      ratingCount: 0,
    });
    doctorProfiles.push(profile);
  }

  // One pending doctor to demonstrate the approval workflow.
  const pendingUser = await users.create({ name: 'Dr. Neil Fernandes', email: 'neil.fernandes@clinic.test', passwordHash: password, role: ROLES.DOCTOR, status: 'active' });
  await doctors.create({
    userId: pendingUser.id,
    name: 'Dr. Neil Fernandes',
    email: 'neil.fernandes@clinic.test',
    specialty: 'Psychiatry',
    experienceYears: 6,
    consultationFee: 750,
    qualifications: 'MBBS, MD (Psychiatry)',
    city: 'Goa',
    gender: 'male',
    avatarUrl: 'https://i.pravatar.cc/300?img=68',
    bio: 'Anxiety, depression and stress management.',
    languages: ['English', 'Hindi'],
    insurances: ['Care Health'],
    conditions: ['anxiety', 'depression', 'stress'],
    availability: weekdayBlocks,
    breaks: lunchBreaks,
    blockedDates: [],
    status: 'pending',
    rating: 0,
    ratingCount: 0,
  });

  const patients = [];
  for (const p of patientSeed) {
    patients.push(await users.create({ name: p.name, email: p.email, passwordHash: password, role: ROLES.PATIENT, phone: p.phone, gender: p.gender, avatarUrl: avatar(p.img), status: 'active' }));
  }

  async function createBooking({ patient, doctor, date, startTime, endTime, status, trackStatus, type = 'regular', reason, token }) {
    const charges = computeCharges(doctor.consultationFee, type);
    const payment = await payments.create({
      patientId: patient.id, patientName: patient.name, doctorId: doctor.id, doctorName: doctor.name,
      method: 'upi', status: PAYMENT_STATUS.PAID, txnId: makeTxnId(), invoiceNo: makeInvoiceNo(),
      ...charges, gstNumber: '29ABCDE1234F1Z5', provider: 'MediPay (test)',
    });
    const appt = await appointments.create({
      patientId: patient.id, patientName: patient.name, doctorId: doctor.id, doctorName: doctor.name,
      specialty: doctor.specialty, branchId: doctor.branchId, branchName: doctor.branchName,
      date, startTime, endTime, type, fee: charges.fee, amount: charges.total,
      reason, notes: '', status, trackStatus, token, priority: type === 'emergency',
      paymentId: payment.id, paymentStatus: PAYMENT_STATUS.PAID, invoiceNo: payment.invoiceNo,
    });
    await payments.updateById(payment.id, { appointmentId: appt.id });
    return { appt, doctor };
  }

  const yesterday = addDays(-1);
  const today = addDays(0);
  const tomorrow = addDays(1);
  const C = APPOINTMENT_STATUS.COMPLETED, CF = APPOINTMENT_STATUS.CONFIRMED, P = APPOINTMENT_STATUS.PENDING, X = APPOINTMENT_STATUS.CANCELLED, NS = APPOINTMENT_STATUS.NO_SHOW;
  const TC = TRACK_STATUS.COMPLETED, TB = TRACK_STATUS.BOOKED, TW = TRACK_STATUS.WAITING, TIC = TRACK_STATUS.IN_CONSULTATION, TX = TRACK_STATUS.CANCELLED;
  const end = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); const t = h * 60 + m + 30; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  const S = (patient, doctor, date, startTime, status, trackStatus, reason, token, type = 'regular') =>
    ({ patient, doctor, date, startTime, endTime: end(startTime), status, trackStatus, reason, token, type });

  const [ananya, rohan, priya, vikram, meera, arjun, kavita, sameer, neha_k, rajesh] = doctorProfiles;
  const [isha, rahul, neha] = patients;

  const samples = [
    // ---------- YESTERDAY (mostly completed → revenue) ----------
    S(isha, kavita, yesterday, '09:00', C, TC, 'Fever and body ache', 1),
    S(rahul, kavita, yesterday, '09:30', C, TC, 'Acidity and indigestion', 2),
    S(neha, kavita, yesterday, '10:00', NS, TX, 'General check-up', 3),
    S(isha, ananya, yesterday, '11:00', C, TC, 'Blood pressure review', 1),
    S(rahul, rohan, yesterday, '14:00', C, TC, 'Skin rash', 1),
    S(neha, vikram, yesterday, '15:00', C, TC, 'Back pain', 1),
    S(isha, rajesh, yesterday, '16:00', X, TX, 'Stomach pain', 1),
    S(rahul, meera, yesterday, '10:30', C, TC, 'Routine consultation', 1),

    // ---------- TODAY (live queue for Dr. Kavita + others) ----------
    S(isha, kavita, today, '09:00', C, TC, 'Fever', 1),
    S(rahul, kavita, today, '09:30', CF, TIC, 'Acidity', 2),
    S(neha, kavita, today, '10:00', CF, TW, 'Cold and cough', 3),
    S(isha, kavita, today, '10:30', CF, TB, 'Severe chest discomfort', 4, 'emergency'),
    S(rahul, kavita, today, '11:00', P, TB, 'Follow-up', 5),
    S(neha, ananya, today, '09:30', C, TC, 'Palpitations', 1),
    S(isha, rohan, today, '11:30', CF, TB, 'Acne treatment', 1),
    S(rahul, arjun, today, '14:00', CF, TB, 'Headache', 1),
    S(neha, priya, today, '15:00', C, TC, 'Child vaccination', 1),

    // ---------- TOMORROW (upcoming bookings) ----------
    S(isha, kavita, tomorrow, '09:00', CF, TB, 'Diet follow-up', 1),
    S(rahul, kavita, tomorrow, '09:30', P, TB, 'General consultation', 2),
    S(neha, sameer, tomorrow, '11:00', CF, TB, 'Ear pain', 1),
    S(isha, neha_k, tomorrow, '14:00', P, TB, 'Breathing difficulty', 1),
    S(rahul, meera, tomorrow, '10:00', CF, TB, 'Routine visit', 1),
    S(neha, ananya, tomorrow, '15:30', P, TB, 'Heart check-up', 1, 'emergency'),
  ];

  const created = [];
  for (const s of samples) created.push(await createBooking(s));

  // Rich 12-month history for the demo patient (Isha) so the dashboard charts
  // and KPI cards look full. These are NOT reviewed to avoid skewing ratings.
  const monthDay = (monthsAgo, day) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - monthsAgo);
    d.setDate(Math.min(day, 27));
    return d.toISOString().slice(0, 10);
  };
  const bulkTimes = ['09:00', '09:30', '10:00', '11:00', '14:00', '15:00', '16:00'];
  const bulkReasons = ['Routine check-up', 'Follow-up visit', 'Fever and cold', 'Blood pressure review', 'Skin consultation', 'Body ache', 'Diet consultation', 'Annual health check'];
  const bulkDoctors = [doctorProfiles[0], doctorProfiles[1], doctorProfiles[3], doctorProfiles[6], doctorProfiles[9], doctorProfiles[2]];
  let seedRand = 7;
  const rnd = () => { seedRand = (seedRand * 9301 + 49297) % 233280; return seedRand / 233280; };
  for (let m = 12; m >= 1; m -= 1) {
    const perMonth = 3 + Math.floor(rnd() * 4); // 3–6 visits/month
    for (let k = 0; k < perMonth; k += 1) {
      const doctor = bulkDoctors[Math.floor(rnd() * bulkDoctors.length)];
      const day = 2 + Math.floor(rnd() * 25);
      const startTime = bulkTimes[Math.floor(rnd() * bulkTimes.length)];
      const roll = rnd();
      const status = roll < 0.72 ? APPOINTMENT_STATUS.COMPLETED : roll < 0.86 ? X : NS;
      const track = status === APPOINTMENT_STATUS.COMPLETED ? TC : TX;
      await createBooking({ patient: isha, doctor, date: monthDay(m, day), startTime, endTime: end(startTime), status, trackStatus: track, reason: bulkReasons[Math.floor(rnd() * bulkReasons.length)], token: k + 1 });
    }
  }
  // A couple of upcoming visits next month for the "upcoming" chart segment.
  await createBooking({ patient: isha, doctor: doctorProfiles[0], date: monthDay(-1, 8), startTime: '10:00', endTime: '10:30', status: CF, trackStatus: TB, reason: 'Cardiology follow-up', token: 1 });
  await createBooking({ patient: isha, doctor: doctorProfiles[6], date: monthDay(-1, 15), startTime: '11:00', endTime: '11:30', status: P, trackStatus: TB, reason: 'General check-up', token: 2 });

  // Reviews + rating aggregate for completed visits (varied ratings).
  const REVIEW_TEXT = [
    'Very thorough and patient. Explained everything clearly.',
    'Great experience, minimal waiting time.',
    'Knowledgeable doctor, highly recommend.',
    'Good consultation, felt much better after the visit.',
    'Professional and friendly staff.',
  ];
  let ri = 0;
  for (const { appt, doctor } of created) {
    if (appt.status !== APPOINTMENT_STATUS.COMPLETED) continue;
    const rating = 4 + (ri % 2); // alternate 4 / 5
    await reviews.create({ doctorId: doctor.id, doctorName: doctor.name, patientId: appt.patientId, patientName: appt.patientName, appointmentId: appt.id, rating, comment: REVIEW_TEXT[ri % REVIEW_TEXT.length] });
    ri += 1;
    const all = await reviews.find({ doctorId: doctor.id });
    const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
    await doctors.updateById(doctor.id, { rating: Math.round(avg * 10) / 10, ratingCount: all.length });
  }

  // Prescriptions for the first few completed appointments.
  const RX_TEMPLATES = [
    { diagnosis: 'Viral fever with throat infection', vitals: { bp: '118/78', pulse: '82', temp: '99.2 F', weight: '68 kg' }, medicines: [{ name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice a day', duration: '3 days', notes: 'After food' }, { name: 'Cetirizine', dosage: '1 tablet', frequency: 'At night', duration: '5 days', notes: '' }], advice: 'Plenty of fluids and rest. Review if fever persists beyond 3 days.' },
    { diagnosis: 'Acid reflux (GERD)', vitals: { bp: '122/80', pulse: '76', temp: '98.4 F', weight: '74 kg' }, medicines: [{ name: 'Pantoprazole 40mg', dosage: '1 tablet', frequency: 'Before breakfast', duration: '14 days', notes: '' }], advice: 'Avoid spicy/oily food, no late-night meals.' },
    { diagnosis: 'Hypertension - stable', vitals: { bp: '138/88', pulse: '80', temp: '98.6 F', weight: '71 kg' }, medicines: [{ name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', notes: '' }], advice: 'Reduce salt, monitor BP weekly.' },
  ];
  const completedList = created.filter((c) => c.appt.status === APPOINTMENT_STATUS.COMPLETED);
  for (let i = 0; i < Math.min(3, completedList.length); i += 1) {
    const { appt, doctor } = completedList[i];
    const tpl = RX_TEMPLATES[i % RX_TEMPLATES.length];
    await prescriptions.create({
      appointmentId: appt.id, doctorId: doctor.id, doctorName: doctor.name,
      doctorQualifications: doctor.qualifications, specialty: doctor.specialty,
      patientId: appt.patientId, patientName: appt.patientName, date: appt.date,
      ...tpl, followUpDate: addDays(4), signature: `Dr. ${doctor.name}`,
    });
    await appointments.updateById(appt.id, { hasPrescription: true });
  }

  // EHR records for the demo patient.
  const recordSeed = [
    { title: 'Complete Blood Count (CBC)', type: 'lab_report', fileName: 'cbc-report.pdf', mimeType: 'application/pdf', ocrText: 'Hemoglobin 13.2 g/dL, WBC 7,200, Platelets 2.4 lakh — within range.' },
    { title: 'Chest X-Ray', type: 'x_ray', fileName: 'chest-xray.jpg', mimeType: 'image/jpeg', ocrText: 'No active lung disease. Heart size normal.' },
    { title: 'Lipid Profile', type: 'lab_report', fileName: 'lipid.pdf', mimeType: 'application/pdf', ocrText: 'Total cholesterol 190 mg/dL, LDL 110, HDL 48.' },
    { title: 'COVID-19 Vaccination Certificate', type: 'vaccination', fileName: 'vaccine.pdf', mimeType: 'application/pdf', ocrText: 'Two doses completed.' },
  ];
  for (const r of recordSeed) {
    await records.create({ patientId: isha.id, patientName: isha.name, notes: '', fileUrl: '', size: 24576, ...r });
  }

  // Vitals history for the demo patient (last ~10 days) — powers the charts.
  const vitalSeed = [
    { d: -10, bp: '128/84', pulse: 78, weight: 66.5, sugar: 108, spo2: 97, temp: 98.4 },
    { d: -8, bp: '126/82', pulse: 76, weight: 66.2, sugar: 104, spo2: 98, temp: 98.6 },
    { d: -6, bp: '124/80', pulse: 74, weight: 66.0, sugar: 101, spo2: 98, temp: 98.5 },
    { d: -4, bp: '122/80', pulse: 75, weight: 65.8, sugar: 99, spo2: 99, temp: 98.6 },
    { d: -3, bp: '121/79', pulse: 72, weight: 65.6, sugar: 97, spo2: 98, temp: 98.4 },
    { d: -1, bp: '120/78', pulse: 71, weight: 65.4, sugar: 95, spo2: 99, temp: 98.6 },
    { d: 0, bp: '118/78', pulse: 70, weight: 65.2, sugar: 94, spo2: 99, temp: 98.6 },
  ];
  for (const v of vitalSeed) {
    await vitals.create({ patientId: isha.id, patientName: isha.name, date: addDays(v.d), bp: v.bp, pulse: v.pulse, weight: v.weight, sugar: v.sugar, spo2: v.spo2, temp: v.temp });
  }

  // Leave requests (pending + approved).
  await leaves.create({ doctorId: vikram.id, doctorName: vikram.name, from: addDays(10), to: addDays(12), reason: 'Conference travel', type: 'leave', status: 'pending' });
  await leaves.create({ doctorId: rohan.id, doctorName: rohan.name, from: addDays(5), to: addDays(5), reason: 'Personal', type: 'leave', status: 'pending' });
  await leaves.create({ doctorId: ananya.id, doctorName: ananya.name, from: addDays(-2), to: addDays(-2), reason: 'Festival holiday', type: 'holiday', status: 'approved', decidedBy: 'Front Desk' });

  // A sample audit trail so the admin log looks realistic.
  const auditSeed = [
    { action: 'auth.login', entity: 'user', actorName: admin.name, actorRole: 'admin' },
    { action: 'doctor.approve', entity: 'doctor', actorName: admin.name, actorRole: 'admin', entityId: ananya.id },
    { action: 'appointment.create', entity: 'appointment', actorName: isha.name, actorRole: 'patient' },
    { action: 'appointment.track', entity: 'appointment', actorName: kavita.name, actorRole: 'doctor', meta: { trackStatus: 'in_consultation' } },
    { action: 'prescription.create', entity: 'prescription', actorName: kavita.name, actorRole: 'doctor' },
    { action: 'leave.decide', entity: 'leave', actorName: reception.name, actorRole: 'receptionist', meta: { decision: 'approved' } },
    { action: 'doctor.update', entity: 'doctor', actorName: admin.name, actorRole: 'admin', entityId: rohan.id, meta: { consultationFee: 750 } },
    { action: 'record.upload', entity: 'record', actorName: isha.name, actorRole: 'patient', meta: { type: 'lab_report' } },
    { action: 'user.disable', entity: 'user', actorName: admin.name, actorRole: 'admin' },
    { action: 'payment.captured', entity: 'payment', actorName: rahul.name, actorRole: 'patient', meta: { method: 'upi' } },
  ];
  let ai = auditSeed.length;
  for (const a of auditSeed) {
    // Stagger timestamps so the log reads chronologically.
    const d = new Date(Date.now() - ai * 3600 * 1000);
    ai -= 1;
    await auditlogs.create({ ...a, entityId: a.entityId || null, meta: a.meta || {}, createdAt: d.toISOString() });
  }
  await auditlogs.create({ action: 'system.seed', entity: 'system', actorName: 'System', actorRole: 'system', meta: { note: 'Database seeded' } });

  await disconnectDb();

  console.log('\n[seed] done. Demo accounts (password for all: Password123):');
  console.log('  Admin        ->', admin.email);
  console.log('  Receptionist ->', reception.email);
  console.log('  Doctor       -> kavita.deshpande@clinic.test (has a live queue today)');
  console.log('  Patient      -> isha.verma@example.test');
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
