import { z } from 'zod';

export const bblParamSchema = z.object({
  bbl: z.string().min(1, 'BBL parameter is required'),
});

export const searchQuerySchema = z.object({
  q: z.string().optional().default(''),
});

export const autocompleteQuerySchema = z.object({
  q: z.string().optional().default(''),
  text: z.string().optional().default(''),
});

export const resolvePropertySchema = z.object({
  bbl: z.string().optional(),
  bin: z.string().optional(),
  address: z.string().optional(),
  text: z.string().optional(),
});
