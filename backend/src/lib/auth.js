import jwt from 'jsonwebtoken';
import { prisma } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, familyId: user.familyId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden for role' });
    }
    next();
  };
}

// RBAC: buyer/parent may only touch resources belonging to their own family.
export function requireOwnFamily(getFamilyId) {
  return async (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'care_manager') return next();
    const familyId = await getFamilyId(req);
    if (!familyId || familyId !== req.user.familyId) {
      return res.status(403).json({ error: 'Not your family' });
    }
    next();
  };
}
