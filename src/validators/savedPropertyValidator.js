import { z } from 'zod';

export const createSavedPropertySchema = z.object({
  bbl: z.string().min(1, 'BBL identifier is required'),
  bin: z.string().optional(),
  address: z.string().min(1, 'Property address is required'),
});
