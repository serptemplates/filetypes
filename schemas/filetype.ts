import { z } from 'zod';

// Zod schema for unified FileType record (normalized)
export const ProgramSchema = z.object({
  name: z.string(),
  url: z.string().url().optional(),
  license: z.string().optional(),
});

export const FileTypeSchema = z.object({
  slug: z.string().min(1),
  extension: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().optional(),
  // Origin/owner of the format (e.g., Adobe, MPEG)
  developer: z.string().optional(),
  category: z.string().optional(),
  category_slug: z.string().optional(),
  mime: z.array(z.string()).optional(),
  containers: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  technical_info: z.object({ content: z.array(z.string()).min(1) }).optional(),
  how_to_open: z.object({ instructions: z.array(z.string()).min(1) }).optional(),
  how_to_convert: z.object({ instructions: z.array(z.string()).min(1) }).optional(),
  // Common filenames seen in the wild
  common_filenames: z.array(z.string()).optional(),
  // File signatures / magic numbers (hex with optional offset)
  magic: z.array(z.object({ hex: z.string(), offset: z.number().optional() })).optional(),
  programs: z.record(z.string(), z.array(ProgramSchema)).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    caption: z.string().optional(),
  })).optional(),
  sources: z.array(z.object({
    source: z.string().optional(),
    url: z.string().url().optional(),
    retrieved_at: z.string().optional(),
  })).optional(),
  last_updated: z.string().optional(),
});

export type FileType = z.infer<typeof FileTypeSchema>;
