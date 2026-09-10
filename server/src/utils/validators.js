import { z } from 'zod';
import { SPECIALTIES } from './constants.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['patient', 'doctor']).default('patient'),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  // Doctor-only fields (required when role === 'doctor', enforced in controller).
  specialty: z.string().optional(),
  experienceYears: z.coerce.number().min(0).max(70).optional(),
  consultationFee: z.coerce.number().min(0).max(100000).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dob: z.string().optional(),
  address: z.string().trim().max(200).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

const availabilityBlock = z.object({
  day: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotMinutes: z.coerce.number().min(5).max(240).default(30),
});

const breakBlock = z.object({
  day: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const doctorProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  specialty: z.enum(SPECIALTIES).optional(),
  qualifications: z.string().trim().max(200).optional(),
  experienceYears: z.coerce.number().min(0).max(70).optional(),
  consultationFee: z.coerce.number().min(0).max(100000).optional(),
  bio: z.string().trim().max(1000).optional(),
  city: z.string().trim().max(80).optional(),
  hospital: z.string().trim().max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  clinicAddress: z.string().trim().max(200).optional(),
  languages: z.array(z.string()).optional(),
  insurances: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  availability: z.array(availabilityBlock).optional(),
  breaks: z.array(breakBlock).optional(),
  blockedDates: z.array(z.string()).optional(),
});

export const adminCreateDoctorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  specialty: z.enum(SPECIALTIES),
  experienceYears: z.coerce.number().min(0).max(70).default(0),
  consultationFee: z.coerce.number().min(0).max(100000).default(500),
  qualifications: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  hospital: z.string().trim().max(120).optional(),
  branchId: z.string().optional(),
});

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().trim().max(500).optional(),
  type: z.enum(['regular', 'emergency']).default('regular'),
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'wallet']).default('upi'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
  notes: z.string().trim().max(1000).optional(),
});

export const trackSchema = z.object({
  trackStatus: z.enum(['booked', 'waiting', 'called', 'in_consultation', 'completed', 'cancelled']),
});

export const createReviewSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export const symptomSchema = z.object({
  symptoms: z.union([z.string(), z.array(z.string())]).optional(),
  text: z.string().optional(),
});

export const recommendSchema = z.object({
  specialty: z.string().optional(),
  budget: z.coerce.number().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
});

const medicineSchema = z.object({
  name: z.string().trim().min(1),
  dosage: z.string().trim().optional().or(z.literal('')),
  frequency: z.string().trim().optional().or(z.literal('')),
  duration: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
});

export const createPrescriptionSchema = z.object({
  appointmentId: z.string().min(1),
  diagnosis: z.string().trim().max(1000).optional(),
  vitals: z
    .object({
      bp: z.string().optional(),
      pulse: z.string().optional(),
      temp: z.string().optional(),
      weight: z.string().optional(),
    })
    .optional(),
  medicines: z.array(medicineSchema).default([]),
  advice: z.string().trim().max(2000).optional(),
  followUpDate: z.string().optional().or(z.literal('')),
});

export const leaveSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(300).optional(),
  type: z.enum(['leave', 'vacation', 'holiday', 'emergency']).default('leave'),
});

export const branchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
});

export const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  branchId: z.string().optional(),
});
