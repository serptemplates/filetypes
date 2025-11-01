import { z } from 'zod';

export const CodecSchema = z.object({
  slug: z.string().min(1), // h264, hevc, av1, opus
  name: z.string().min(1),
  family: z.string().optional(),
  profiles: z.array(z.string()).optional(),
  levels: z.array(z.string()).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  containers: z.array(z.string()).optional(),
  hardware_support: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  recipes: z.array(z.string()).optional(),
  sources: z.array(z.object({ source: z.string().optional(), url: z.string().url().optional() })).optional(),
});

export type Codec = z.infer<typeof CodecSchema>;

