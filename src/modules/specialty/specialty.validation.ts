import z from "zod";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(100, "Title must be at most 100 characters");

const descriptionSchema = z
  .string()
  .trim()
  .min(1, "Description cannot be empty");

const iconSchema = z
  .string()
  .trim()
  .min(1, "Icon cannot be empty")
  .max(255, "Icon must be at most 255 characters");

export const createSpecialtyZodSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.nullable().optional(),
  icon: iconSchema.nullable().optional(),
});

export const updateSpecialtyZodSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema.nullable().optional(),
  icon: iconSchema.nullable().optional(),
});
