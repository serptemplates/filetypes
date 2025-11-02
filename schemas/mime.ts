import { z } from 'zod';

const ReferenceSchema = z.object({
  title: z.string().optional(),
  url: z.string().url(),
  kind: z.enum(['RFC', 'Spec', 'Registry']).optional(),
});

export const MimeSchema = z.object({
  type: z.string().min(1), // e.g., image
  subtype: z.string().min(1), // e.g., heic
  full: z.string().min(3), // e.g., image/heic
  extensions: z.array(z.string()).default([]),
  charsets: z.array(z.string()).optional(),
  common_headers: z.array(z.string()).optional(),
  usage_notes: z.array(z.string()).optional(),
  // IANA registration details (optional, populated when scraped)
  iana: z
    .object({
      template_url: z.string().url().optional(),
      published: z.string().optional(), // ISO date string
      last_updated: z.string().optional(), // ISO date string
      type_name: z.string().optional(),
      subtype_name: z.string().optional(),
      parameters: z
        .object({
          required: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
          optional: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
        })
        .optional(),
      encoding_considerations: z.string().optional(),
      security_considerations: z.string().optional(),
      interoperability_considerations: z.string().optional(),
      published_specifications: z.array(ReferenceSchema).optional(),
      applications: z.string().optional(),
      additional_information: z.string().optional(),
      contacts: z.array(z.object({ name: z.string(), email: z.string().email().optional() })).optional(),
      intended_usage: z.string().optional(),
      restrictions_on_usage: z.string().optional(),
      author: z.object({ name: z.string(), email: z.string().email().optional() }).optional(),
      change_controller: z.string().optional(),
    })
    .optional(),
  references: z.array(ReferenceSchema).optional(),
  sources: z.array(z.object({ source: z.string().optional(), url: z.string().url().optional() })).optional(),
});

export type Mime = z.infer<typeof MimeSchema>;
