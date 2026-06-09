import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z.string().regex(/^[a-z0-9_]{3,20}$/, "3-20 chars: lowercase, numbers, underscores only"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const eventSchema = z.object({
  name: z.string().min(2, "Event name required").max(100),
  description: z.string().max(1000).optional(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  location: z.string().max(200).optional(),
  category: z.enum(["PHOTOSHOOT", "WORKSHOP", "TRIP", "COMPETITION", "CULTURAL", "PARTY", "SPORTS", "OTHER"]).default("OTHER"),
  isPublic: z.boolean().default(true),
  coverImage: z.string().url().optional(),
});

export const albumSchema = z.object({
  name: z.string().min(1, "Album name required").max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  eventId: z.string().cuid("Invalid event ID"),
});

export const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(500),
  mediaId: z.string().cuid("Invalid media ID"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: z.string().regex(/^[a-z0-9_]{3,20}$/).optional(),
  bio: z.string().max(300).optional(),
});

export function validate<T>(schema: z.ZodType<T>, data: unknown): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { data: null, error: firstIssue?.message || "Validation failed" };
  }
  return { data: result.data, error: null };
}
