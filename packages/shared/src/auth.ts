import { z } from 'zod';

export const signupSchema = z.object({
  email: z.email(),
  username: z.string().trim().min(1).max(50),
  password: z.string().min(8).max(72),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(72),
});

export const userSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.email(),
  createdAt: z.iso.datetime(),
});

export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});
export const meResponseSchema = userSchema;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
