import { analyzeSymptoms } from '../utils/symptomKB.js';
import { Doctors, Appointments } from '../repositories/index.js';
import { asyncHandler } from '../utils/errors.js';
import { APPOINTMENT_STATUS } from '../utils/constants.js';

export const checkSymptoms = asyncHandler(async (req, res) => {
  const input = req.body.symptoms || req.body.text || '';
  const result = analyzeSymptoms(input);
  res.json(result);
});

// AI-style doctor recommendation: score active doctors for a given specialty
// against experience, rating, fee/budget and past visit history.
export const recommendDoctors = asyncHandler(async (req, res) => {
  const { specialty, budget, city, language } = req.body;

  const query = { status: 'active' };
  if (specialty) query.specialty = specialty;
  const candidates = await Doctors.find(query);

  // Patient's previous doctors (loyalty boost).
  let previousDoctorIds = new Set();
  if (req.user?.role === 'patient') {
    const past = await Appointments.find({ patientId: req.user.id, status: APPOINTMENT_STATUS.COMPLETED });
    previousDoctorIds = new Set(past.map((a) => a.doctorId));
  }

  const maxExp = Math.max(1, ...candidates.map((d) => d.experienceYears || 0));

  const scored = candidates
    .map((d) => {
      let score = 0;
      const reasons = [];
      const rating = d.rating || 0;
      score += rating * 8; // up to 40
      if (rating >= 4.5) reasons.push('Highly rated by patients');

      const expScore = ((d.experienceYears || 0) / maxExp) * 25;
      score += expScore;
      if ((d.experienceYears || 0) >= 10) reasons.push(`${d.experienceYears} years of experience`);

      if (typeof d.successRate === 'number') {
        score += (d.successRate / 100) * 15;
        if (d.successRate >= 90) reasons.push(`${d.successRate}% treatment success`);
      }

      if (budget) {
        if ((d.consultationFee || 0) <= Number(budget)) {
          score += 10;
          reasons.push('Within your budget');
        } else {
          score -= 8;
        }
      }
      if (city && (d.city || '').toLowerCase() === String(city).toLowerCase()) {
        score += 8;
        reasons.push(`Available in ${d.city}`);
      }
      if (language && (d.languages || []).map((l) => l.toLowerCase()).includes(String(language).toLowerCase())) {
        score += 5;
        reasons.push(`Speaks ${language}`);
      }
      if (previousDoctorIds.has(d.id)) {
        score += 12;
        reasons.push('You have consulted before');
      }
      const hasSlots = (d.availability || []).length > 0;
      if (hasSlots) {
        score += 6;
      } else {
        reasons.push('No published slots');
      }

      return { doctor: d, score: Math.round(score), reasons: reasons.slice(0, 3), hasSlots };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  res.json({ recommendations: scored });
});
