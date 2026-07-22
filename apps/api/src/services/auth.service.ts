// apps/api/src/services/auth.service.ts
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { signAccessToken } from '../lib/jwt.js';
import type { SignupInput, LoginInput } from '@repo/shared/auth';

const BCRYPT_COST = 12;
// precomputed dummy hash - never a real user's hash, exists purely so an
// unknown-email login still pays the same bcrypt-compare cost as a real one.
const DUMMY_HASH = '$2b$12$abcdefghijklmnopqrstuuOZ1P8N6dHFhLB.MZ8xQwLZzL9K3Hxm';

export async function signup(input: SignupInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
    },
  });

  const token = signAccessToken(user.id);
  return { user, token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    await bcrypt.compare(input.password, DUMMY_HASH);
    return null;
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    return null;
  }

  const token = signAccessToken(user.id);
  return { user, token };
}