import { z } from 'zod';

export const createVendorSchema = z.object({
  id: z.string().trim().min(1, 'Vendor ID is required'),
  name: z.string().trim().min(1, 'Vendor name is required'),
  leadTimeDays: z.number().int().positive('leadTimeDays must be a positive integer').default(5),
  targetOtifRate: z.number().min(0, 'targetOtifRate must be at least 0').max(100, 'targetOtifRate cannot exceed 100').default(95.0),
  isActive: z.boolean().optional().default(true),
  contactEmail: z.string().email('Invalid contact email address').optional().or(z.literal('')),
  category: z.string().trim().optional()
});

export const updateVendorSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name cannot be empty').optional(),
  leadTimeDays: z.number().int().positive('leadTimeDays must be a positive integer').optional(),
  targetOtifRate: z.number().min(0).max(100, 'targetOtifRate must be between 0 and 100').optional(),
  isActive: z.boolean().optional(),
  contactEmail: z.string().email('Invalid contact email address').optional().or(z.literal('')),
  category: z.string().trim().optional()
});

export const vendorIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Vendor ID is required and cannot be empty')
});

export const deliveryIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Delivery ID is required and cannot be empty')
});

const isoDateString = z.string().refine(val => !isNaN(Date.parse(val)), {
  message: 'Must be a valid ISO date string'
});

export const createDeliverySchema = z.object({
  id: z.string().trim().min(1).optional(),
  vendorId: z.string().trim().min(1, 'vendorId is required'),
  poNumber: z.string().trim().min(1, 'poNumber is required'),
  skuId: z.string().trim().optional(),
  depotId: z.string().trim().optional(),
  expectedDeliveryDate: isoDateString,
  actualDeliveryDate: isoDateString.optional().nullable(),
  expectedQuantity: z.number().int().positive('expectedQuantity must be a positive integer'),
  receivedQuantity: z.number().int().nonnegative('receivedQuantity must be non-negative').optional().default(0),
  status: z.enum(['SCHEDULED', 'DELIVERED', 'DELAYED', 'PARTIALLY_RECEIVED', 'CANCELLED']).optional().default('SCHEDULED'),
  notes: z.string().trim().optional()
});

export const updateDeliverySchema = z.object({
  actualDeliveryDate: isoDateString.optional().nullable(),
  receivedQuantity: z.number().int().nonnegative('receivedQuantity must be non-negative').optional(),
  status: z.enum(['SCHEDULED', 'DELIVERED', 'DELAYED', 'PARTIALLY_RECEIVED', 'CANCELLED']).optional(),
  notes: z.string().trim().optional()
});

export const deliveryQuerySchema = z.object({
  vendorId: z.string().trim().optional(),
  status: z.string().trim().optional(),
  limit: z.string().regex(/^\d+$/, 'limit must be a non-negative integer').optional(),
  offset: z.string().regex(/^\d+$/, 'offset must be a non-negative integer').optional()
});
