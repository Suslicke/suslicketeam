import { z } from "zod";

export const projectTypes = [
  "landing",
  "web-apps",
  "ai",
  "mobile",
  "seo",
  "other",
] as const;

export const leadSchema = z.object({
  name: z.string().min(2),
  contact: z.string().min(1),
  projectType: z.enum(projectTypes),
  message: z.string().optional(),
  // Honeypot: bots tend to fill every field, so a non-empty value fails.
  company: z
    .string()
    .max(0, "honeypot must be empty")
    .optional(),
  // Passthrough metadata for the webhook.
  page: z.string().optional(),
  utm: z.record(z.string(), z.string()).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
