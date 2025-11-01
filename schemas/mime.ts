import { z } from 'zod';

export const MimeSchema = z.object({
  type: z.string().min(1), // e.g., image
  subtype: z.string().min(1), // e.g., heic
  full: z.string().min(3), // e.g., image/heic
  extensions: z.array(z.string()).default([]),
  charsets: z.array(z.string()).optional(),
  common_headers: z.array(z.string()).optional(),
  usage_notes: z.array(z.string()).optional(),
  sources: z.array(z.object({ source: z.string().optional(), url: z.string().url().optional() })).optional(),
});

export type Mime = z.infer<typeof MimeSchema>;

