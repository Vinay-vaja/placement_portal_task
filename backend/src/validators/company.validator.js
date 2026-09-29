import { z } from "zod";

export const createCompanySchema = z.object({
  name: z
    .string({ required_error: "Company name is required" })
    .min(2, "Company name must be at least 2 characters")
    .trim(),
  imageUrl: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
});

export const updateCompanySchema = z
  .object({
    name: z.string().min(2, "Company name must be at least 2 characters").trim().optional(),
    imageUrl: z
      .string()
      .url("Invalid image URL")
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => (val === "" ? null : val)),
  })
  .strict();
