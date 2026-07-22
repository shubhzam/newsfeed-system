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

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;