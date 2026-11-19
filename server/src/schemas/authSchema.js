import { z } from 'zod';

export const VALID_ROLES = [
  'HEAD_OF_SUPPLY_CHAIN',
  'DEPOT_MANAGER',
  'PROCUREMENT_MANAGER',
  'VIEWER',
  'ADMIN'
];

export const registerSchema = z.object({
  email: z
    .string()
    .email('Valid email address is required')
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .transform(val => val.trim()),
  role: z
    .enum(VALID_ROLES, {
      errorMap: () => ({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` })
    })
    .default('VIEWER'),
  depotId: z.string().optional().nullable()
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Valid email address is required')
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Password is required')
});
