import { Users, Doctors } from '../repositories/index.js';
import { hashPassword, verifyPassword, signToken, sanitizeUser } from '../utils/auth.js';
import { asyncHandler, badRequest, conflict, unauthorized } from '../utils/errors.js';
import { ROLES } from '../utils/constants.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, gender, specialty, experienceYears, consultationFee } = req.body;

  const existing = await Users.findByEmail(email);
  if (existing) throw conflict('An account with this email already exists');

  if (role === ROLES.DOCTOR && !specialty) {
    throw badRequest('Specialty is required to register as a doctor');
  }

  const passwordHash = await hashPassword(password);
  const user = await Users.create({
    name,
    email,
    passwordHash,
    role,
    phone: phone || '',
    gender: gender || undefined,
    status: 'active',
  });

  if (role === ROLES.DOCTOR) {
    await Doctors.create({
      userId: user.id,
      name,
      email: user.email,
      specialty,
      experienceYears: experienceYears ?? 0,
      consultationFee: consultationFee ?? 500,
      qualifications: '',
      bio: '',
      city: '',
      clinicAddress: '',
      languages: ['English'],
      availability: [],
      status: 'pending', // admin approval required before listing
      rating: 0,
      ratingCount: 0,
    });
  }

  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ token, user: sanitizeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findByEmail(email);
  if (!user) throw unauthorized('Invalid email or password');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid email or password');
  if (user.status === 'disabled') throw unauthorized('This account has been disabled');

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: sanitizeUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  let doctorProfile = null;
  if (req.user.role === ROLES.DOCTOR) {
    doctorProfile = await Doctors.findByUserId(req.user.id);
  }
  res.json({ user: sanitizeUser(req.user), doctorProfile });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updated = await Users.updateById(req.user.id, req.body);
  // Keep doctor display name in sync if provided.
  if (req.user.role === ROLES.DOCTOR && req.body.name) {
    const profile = await Doctors.findByUserId(req.user.id);
    if (profile) await Doctors.updateById(profile.id, { name: req.body.name });
  }
  res.json({ user: sanitizeUser(updated) });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('No image uploaded');
  //const avatarUrl = `/uploads/${req.file.filename}`;
  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  
  const updated = await Users.updateById(req.user.id, { avatarUrl });
  // Keep the doctor's public profile photo in sync too.
  if (req.user.role === ROLES.DOCTOR) {
    const profile = await Doctors.findByUserId(req.user.id);
    if (profile) await Doctors.updateById(profile.id, { avatarUrl });
  }
  res.json({ user: sanitizeUser(updated) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const ok = await verifyPassword(currentPassword, req.user.passwordHash);
  if (!ok) throw badRequest('Current password is incorrect');
  const passwordHash = await hashPassword(newPassword);
  await Users.updateById(req.user.id, { passwordHash });
  res.json({ message: 'Password updated' });
});
