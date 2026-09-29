import { z } from "zod";

const marksSchema = z
  .number()
  .min(0, "Marks cannot be negative")
  .max(100, "Marks cannot exceed 100")
  .optional();

const percentageSchema = z
  .number()
  .min(0, "Percentage cannot be negative")
  .max(100, "Percentage cannot exceed 100");

const cgpaSchema = z
  .number()
  .min(0, "CGPA cannot be negative")
  .max(10, "CGPA cannot exceed 10");

// Base schema for fields common to both student types
const baseProfileSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(2, "Full name must be at least 2 characters")
    .trim(),
  phone: z
    .string({ required_error: "Phone number is required" })
    .min(10, "Phone must be at least 10 digits")
    .regex(/^\+?[\d\s\-()]{10,15}$/, "Invalid phone number format"),
  dob: z
    .string({ required_error: "Date of birth is required" })
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }, "Date of birth must be a valid date in the past"),
  studentType: z.enum(["REGULAR", "D2D"], {
    errorMap: () => ({ message: "Student type must be REGULAR or D2D" }),
  }),

  // 10th subject marks (optional per subject but percentage is required)
  mathsMarks: marksSchema,
  scienceMarks: marksSchema,
  englishMarks: marksSchema,
  socialScienceMarks: marksSchema,
  otherMarks: marksSchema,

  // 10th percentage is always required
  tenthPercentage: percentageSchema,
});

// REGULAR student schema - requires twelfthPercentage
const regularProfileSchema = baseProfileSchema.extend({
  studentType: z.literal("REGULAR"),
  twelfthPercentage: percentageSchema,
  // D2D fields must not be present or null
  d2dCgpa: z.number().nullish(),
  d2dCollege: z.string().nullish(),
  d2dDetails: z.string().nullish(),
});

// D2D student schema - requires d2dCgpa, optional d2dCollege/d2dDetails
const d2dProfileSchema = baseProfileSchema.extend({
  studentType: z.literal("D2D"),
  d2dCgpa: cgpaSchema,
  d2dCollege: z.string().optional(),
  d2dDetails: z.string().optional(),
  // 12th percentage must not be required for D2D
  twelfthPercentage: z.number().nullish(),
});

// Discriminated union based on studentType
export const profileSubmitSchema = z.discriminatedUnion("studentType", [
  regularProfileSchema,
  d2dProfileSchema,
]);

// TPO update schema (all fields optional since partial updates are allowed)
export const profileUpdateSchema = z
  .object({
    fullName: z.string().min(2).trim().optional(),
    phone: z
      .string()
      .min(10)
      .regex(/^\+?[\d\s\-()]{10,15}$/)
      .optional(),
    dob: z
      .string()
      .refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date < new Date();
      }, "Invalid date of birth")
      .optional(),
    studentType: z.enum(["REGULAR", "D2D"]).optional(),
    mathsMarks: z.number().min(0).max(100).optional().nullable(),
    scienceMarks: z.number().min(0).max(100).optional().nullable(),
    englishMarks: z.number().min(0).max(100).optional().nullable(),
    socialScienceMarks: z.number().min(0).max(100).optional().nullable(),
    otherMarks: z.number().min(0).max(100).optional().nullable(),
    tenthPercentage: percentageSchema.optional(),
    twelfthPercentage: percentageSchema.optional().nullable(),
    d2dCgpa: cgpaSchema.optional().nullable(),
    d2dCollege: z.string().optional().nullable(),
    d2dDetails: z.string().optional().nullable(),
    verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  })
  .strict();
