// apps/api/src/middleware/requireAuth.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    (req as Request & { auth: { userId: string } }).auth = { userId: payload.sub };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
} 