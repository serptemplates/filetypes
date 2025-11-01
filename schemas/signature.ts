import { z } from 'zod';

export const FileSignatureSchema = z.object({
  id: z.string().min(1), // e.g., ff-d8-jpeg
  hex: z.array(z.string().regex(/^[0-9a-fA-F]{2}$/)).min(1),
  offset: z.number().int().min(0).optional(),
  description: z.string().optional(),
  detects: z.array(z.string()).optional(), // extensions or mime
  false_positives: z.array(z.string()).optional(),
  references: z.array(z.string().url()).optional(),
});

export type FileSignature = z.infer<typeof FileSignatureSchema>;

