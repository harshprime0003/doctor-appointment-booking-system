import { ZodError } from 'zod';
import { ApiError } from '../utils/errors.js';
import config from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (err && (err.name === 'MulterError' || /Only (image|images and PDF) files are allowed/.test(err.message || ''))) {
    return res.status(400).json({ error: { message: err.message || 'Upload failed' } });
  }
  if (config.env !== 'test') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(500).json({ error: { message: 'Internal server error' } });
}

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      next(err);
    }
  };
}
