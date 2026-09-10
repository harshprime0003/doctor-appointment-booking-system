import { verifyToken } from '../utils/auth.js';
import { Users } from '../repositories/index.js';
import { unauthorized, forbidden } from '../utils/errors.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw unauthorized();
    const payload = verifyToken(token);
    const user = await Users.findById(payload.sub);
    if (!user) throw unauthorized('Account no longer exists');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(unauthorized('Invalid or expired session'));
    }
    next(err);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(forbidden());
    }
    next();
  };
}
