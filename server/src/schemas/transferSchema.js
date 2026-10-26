import { z } from 'zod';

export const createTransferSchema = z.object({
  skuId: z.string().min(1, 'skuId is required'),
  fromDepotId: z.string().min(1, 'fromDepotId is required'),
  toDepotId: z.string().min(1, 'toDepotId is required'),
  quantity: z.number().int().positive('quantity must be a positive integer')
}).refine(data => data.fromDepotId !== data.toDepotId, {
  message: 'Source and destination depots must be different',
  path: ['toDepotId']
});

export const transferIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Transfer ID is required and cannot be empty')
});
