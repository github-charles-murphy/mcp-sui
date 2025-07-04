import { z } from 'zod';

export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Sui address');

export function validateAddress(address: string) {
  const result = addressSchema.safeParse(address);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}
