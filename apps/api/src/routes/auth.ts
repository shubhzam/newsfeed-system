// apps/api/src/routes/auth.ts
import { Router } from 'express';
import type { Request } from 'express';
import { signupSchema, loginSchema } from '@repo/shared/auth';
import * as authService from '../services/auth.service.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { prisma } from '../lib/prisma.js';

export const authRouter: Router = Router();

function toPublicUser(user: { id: string; username: string; email: string; createdAt: Date }) {
  return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
}

authRouter.post('/api/auth/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'ValidationError', details: parsed.error.issues });
    return;
  }

  try {
    const { user, token } = await authService.signup(parsed.data);
    res.status(201).json({ user: toPublicUser(user), token });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'EmailOrUsernameTaken' });
      return;
    }
    throw err;
  }
});

authRouter.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'ValidationError', details: parsed.error.issues });
    return;
  }

  const result = await authService.login(parsed.data);

  if (!result) {
    res.status(401).json({ error: 'InvalidCredentials' });
    return;
  }

  res.status(200).json({ user: toPublicUser(result.user), token: result.token });
});

authRouter.get('/api/auth/me', requireAuth, async (req, res) => {
  const auth = (req as Request & { auth: { userId: string } }).auth;
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.status(200).json(toPublicUser(user));
});