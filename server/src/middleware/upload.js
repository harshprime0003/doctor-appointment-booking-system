import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuid } from 'uuid';
import config from '../config/env.js';

const uploadDir = path.resolve(config.serverRoot, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uuid().slice(0, 8)}${ext}`);
  },
});

const imageTypes = /jpeg|jpg|png|webp|gif/;
const docTypes = /jpeg|jpg|png|webp|gif|pdf/;

export const uploadImage = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = imageTypes.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = docTypes.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only images and PDF files are allowed'), ok);
  },
});

export { uploadDir };
