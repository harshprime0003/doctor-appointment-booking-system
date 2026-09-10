import {
  SPECIALTIES,
  WEEKDAYS,
  LANGUAGES,
  INSURANCES,
  EMERGENCY_SURCHARGE,
  GST_RATE,
  PAYMENT_METHODS,
} from '../utils/constants.js';
import { SYMPTOMS } from '../utils/symptomKB.js';
import { Branches } from '../repositories/index.js';
import config from '../config/env.js';
import { asyncHandler } from '../utils/errors.js';

export const meta = asyncHandler(async (req, res) => {
  const branches = await Branches.find({}, { sort: { name: 1 } });
  res.json({
    specialties: SPECIALTIES,
    weekdays: WEEKDAYS,
    languages: LANGUAGES,
    insurances: INSURANCES,
    symptoms: SYMPTOMS,
    paymentMethods: PAYMENT_METHODS,
    emergencySurcharge: EMERGENCY_SURCHARGE,
    gstRate: GST_RATE,
    branches,
    dbDriver: config.db.driver,
  });
});
