import { z } from 'zod';

/** Auth DTOs for platform accounts in MongoDB collection `a_users` (not legacy `users`). */

const usernameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username must be alphanumeric, underscore, or hyphen');

const passwordSchema = z.string().min(8).max(128);

const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const loginRequestSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const registerRequestSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: emailSchema,
  username: usernameSchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
