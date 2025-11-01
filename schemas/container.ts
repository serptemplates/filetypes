import { z } from 'zod';

export const ContainerSchema = z.object({
  slug: z.string().min(1), // mp4, mkv
  name: z.string().min(1),
  extensions: z.array(z.string()).default([]),
  codecs_supported: z.object({
    video: z.array(z.string()).default([]),
    audio: z.array(z.string()).default([]),
    subtitle: z.array(z.string()).default([]),
  }).default({ video: [], audio: [], subtitle: [] }),
  features: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  sources: z.array(z.object({ source: z.string().optional(), url: z.string().url().optional() })).optional(),
});

export type Container = z.infer<typeof ContainerSchema>;

