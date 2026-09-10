// Lightweight rule-based clinical knowledge base powering the "AI Symptom Checker".
// This is a heuristic engine (not medical advice) that scores conditions from a
// set of recognised symptoms and maps them to a specialist and urgency level.

export const SYMPTOMS = [
  'fever', 'headache', 'cough', 'cold', 'sore throat', 'body ache', 'fatigue',
  'chest pain', 'shortness of breath', 'palpitations', 'dizziness',
  'abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'acidity',
  'skin rash', 'itching', 'acne', 'hair loss',
  'joint pain', 'back pain', 'muscle pain', 'swelling',
  'blurred vision', 'eye pain', 'red eyes',
  'ear pain', 'hearing loss', 'runny nose', 'sneezing',
  'anxiety', 'depression', 'insomnia', 'stress',
  'tooth pache', 'toothache', 'bleeding gums',
  'high blood pressure', 'high sugar', 'weight loss', 'weight gain',
  'wheezing', 'breathlessness',
  'menstrual pain', 'pregnancy',
  'seizure', 'numbness', 'memory loss',
];

// Each condition: symptoms it covers, the specialist, base urgency, home care.
const CONDITIONS = [
  {
    name: 'Viral Fever / Flu',
    specialist: 'General Physician',
    symptoms: ['fever', 'headache', 'body ache', 'fatigue', 'cold', 'cough', 'sore throat'],
    urgency: 'low',
    homeCare: ['Rest and stay hydrated', 'Paracetamol for fever', 'Warm fluids and steam inhalation'],
  },
  {
    name: 'Upper Respiratory Infection',
    specialist: 'ENT',
    symptoms: ['cough', 'cold', 'sore throat', 'runny nose', 'sneezing', 'ear pain'],
    urgency: 'low',
    homeCare: ['Warm salt-water gargles', 'Steam inhalation', 'Adequate rest'],
  },
  {
    name: 'Possible Cardiac Event',
    specialist: 'Cardiology',
    symptoms: ['chest pain', 'shortness of breath', 'palpitations', 'dizziness'],
    urgency: 'emergency',
    homeCare: ['Do NOT wait — seek emergency care immediately', 'Chew aspirin only if advised'],
  },
  {
    name: 'Asthma / Respiratory Distress',
    specialist: 'Pulmonology',
    symptoms: ['wheezing', 'breathlessness', 'shortness of breath', 'cough'],
    urgency: 'high',
    homeCare: ['Use prescribed inhaler', 'Sit upright, stay calm', 'Avoid triggers/allergens'],
  },
  {
    name: 'Gastroenteritis / Acidity',
    specialist: 'Gastroenterology',
    symptoms: ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'acidity'],
    urgency: 'medium',
    homeCare: ['Oral rehydration solution', 'Light bland diet (BRAT)', 'Avoid spicy/oily food'],
  },
  {
    name: 'Skin Allergy / Dermatitis',
    specialist: 'Dermatology',
    symptoms: ['skin rash', 'itching', 'acne', 'hair loss', 'swelling'],
    urgency: 'low',
    homeCare: ['Avoid scratching', 'Use mild moisturiser', 'Antihistamine if itching is severe'],
  },
  {
    name: 'Musculoskeletal Pain',
    specialist: 'Orthopedics',
    symptoms: ['joint pain', 'back pain', 'muscle pain', 'swelling', 'body ache'],
    urgency: 'low',
    homeCare: ['Rest the affected area', 'Cold/hot compress', 'Gentle stretching'],
  },
  {
    name: 'Neurological Concern',
    specialist: 'Neurology',
    symptoms: ['headache', 'dizziness', 'seizure', 'numbness', 'memory loss', 'blurred vision'],
    urgency: 'high',
    homeCare: ['Rest in a quiet, dark room', 'Track symptom frequency', 'Seek care if worsening'],
  },
  {
    name: 'Eye Infection / Strain',
    specialist: 'Ophthalmology',
    symptoms: ['blurred vision', 'eye pain', 'red eyes'],
    urgency: 'medium',
    homeCare: ['Avoid screens', 'Do not rub eyes', 'Clean with sterile water'],
  },
  {
    name: 'Dental Problem',
    specialist: 'Dentistry',
    symptoms: ['toothache', 'tooth pache', 'bleeding gums'],
    urgency: 'low',
    homeCare: ['Salt-water rinse', 'Avoid very hot/cold food', 'Clove oil for temporary relief'],
  },
  {
    name: 'Mental Health / Stress',
    specialist: 'Psychiatry',
    symptoms: ['anxiety', 'depression', 'insomnia', 'stress', 'fatigue'],
    urgency: 'medium',
    homeCare: ['Maintain sleep routine', 'Breathing exercises', 'Talk to someone you trust'],
  },
  {
    name: 'Diabetes / Endocrine',
    specialist: 'Endocrinology',
    symptoms: ['high sugar', 'weight loss', 'weight gain', 'fatigue'],
    urgency: 'medium',
    homeCare: ['Monitor blood sugar', 'Low-sugar balanced diet', 'Regular exercise'],
  },
  {
    name: 'Hypertension',
    specialist: 'Cardiology',
    symptoms: ['high blood pressure', 'headache', 'dizziness'],
    urgency: 'medium',
    homeCare: ['Reduce salt intake', 'Monitor BP regularly', 'Manage stress'],
  },
  {
    name: "Women's Health Concern",
    specialist: 'Gynecology',
    symptoms: ['menstrual pain', 'pregnancy', 'abdominal pain'],
    urgency: 'medium',
    homeCare: ['Warm compress for cramps', 'Stay hydrated', 'Track your cycle'],
  },
  {
    name: 'Childhood Illness',
    specialist: 'Pediatrics',
    symptoms: ['fever', 'cough', 'cold', 'vomiting', 'skin rash'],
    urgency: 'medium',
    homeCare: ['Keep the child hydrated', 'Monitor temperature', 'Consult if fever persists >2 days'],
  },
];

const URGENCY_RANK = { low: 1, medium: 2, high: 3, emergency: 4 };

function normalize(text) {
  return String(text || '').toLowerCase();
}

// Extract known symptoms from free text or an array.
export function extractSymptoms(input) {
  const text = Array.isArray(input) ? input.join(', ') : normalize(input);
  const found = new Set();
  for (const s of SYMPTOMS) {
    if (text.includes(s)) found.add(s === 'tooth pache' ? 'toothache' : s);
  }
  return [...found];
}

export function analyzeSymptoms(input) {
  const symptoms = extractSymptoms(input);
  if (symptoms.length === 0) {
    return {
      recognizedSymptoms: [],
      conditions: [],
      recommendedSpecialty: 'General Physician',
      urgency: 'low',
      emergency: false,
      homeCare: ['Consult a General Physician for a proper evaluation.'],
      disclaimer: 'This is an automated triage aid and not a medical diagnosis.',
    };
  }

  const scored = CONDITIONS.map((c) => {
    const matches = c.symptoms.filter((s) => symptoms.includes(s));
    const score = matches.length / c.symptoms.length + matches.length * 0.15;
    return { ...c, matches, matchCount: matches.length, score };
  })
    .filter((c) => c.matchCount > 0)
    .sort((a, b) => b.score - a.score || URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency]);

  const top = scored.slice(0, 4);
  const highestUrgency = top.reduce(
    (max, c) => (URGENCY_RANK[c.urgency] > URGENCY_RANK[max] ? c.urgency : max),
    'low',
  );
  const emergency = highestUrgency === 'emergency';
  const primary = top[0];

  return {
    recognizedSymptoms: symptoms,
    conditions: top.map((c) => ({
      name: c.name,
      specialist: c.specialist,
      urgency: c.urgency,
      confidence: Math.min(99, Math.round(c.score * 60 + 20)),
      matchedSymptoms: c.matches,
    })),
    recommendedSpecialty: primary ? primary.specialist : 'General Physician',
    urgency: highestUrgency,
    emergency,
    homeCare: primary ? primary.homeCare : [],
    disclaimer: 'This is an automated triage aid and not a medical diagnosis. In an emergency call your local emergency number.',
  };
}
