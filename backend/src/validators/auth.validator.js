import { z } from "zod";

const BRANCHES = [
  "CE", "AIML", "IT", "EC", "EE", "CIVIL",
  "CHEMICAL", "MECHANICAL", "RUBBER", "PLASTIC",
  "ENVIRONMENTAL", "IC",
];

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
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
  studentType: z
    .enum(["REGULAR", "D2D"], {
      errorMap: () => ({ message: "Student type must be REGULAR or D2D" }),
    })
    .default("REGULAR"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: "Password is required" }),
});

// Google OAuth — only needs the Google idToken
export const googleAuthSchema = z.object({
  idToken: z
    .string({ required_error: "Google ID token is required" })
    .min(1, "Google ID token is required"),
});

// Profile completion after Google OAuth (or step 2 for normal registration)
export const completeProfileSchema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(), // Optional for Google users who already have an account

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

  branch: z.enum(BRANCHES, {
    errorMap: () => ({
      message: `Branch must be one of: ${BRANCHES.join(", ")}`,
    }),
  }),

  studentType: z
    .enum(["REGULAR", "D2D"], {
      errorMap: () => ({ message: "Student type must be REGULAR or D2D" }),
    })
    .default("REGULAR"),

  // 10th subject marks (6 subjects, all required for profile submission)
  mathsMarks: z.number().min(0).max(100, "Marks cannot exceed 100"),
  scienceMarks: z.number().min(0).max(100, "Marks cannot exceed 100"),
  englishMarks: z.number().min(0).max(100, "Marks cannot exceed 100"),
  socialScienceMarks: z.number().min(0).max(100, "Marks cannot exceed 100"),
  computerPtMarks: z.number().min(0).max(100, "Marks cannot exceed 100"),
  sanskritMarks: z.number().min(0).max(100, "Marks cannot exceed 100"),

  // 12th subject marks — required for REGULAR, optional for D2D
  twelfthEnglishMarks: z.number().min(0).max(100).optional().nullable(),
  twelfthPhysicsMarks: z.number().min(0).max(100).optional().nullable(),
  twelfthMathsMarks: z.number().min(0).max(100).optional().nullable(),
  twelfthChemistryMarks: z.number().min(0).max(100).optional().nullable(),
  twelfthComputerMarks: z.number().min(0).max(100).optional().nullable(),

  // D2D fields
  d2dCgpa: z.number().min(0).max(10).optional().nullable(),
  d2dCollege: z.string().optional().nullable(),
  d2dDetails: z.string().optional().nullable(),
  d2dAcpcRank: z.number().int().positive().optional().nullable(),

  // Declaration (must be true)
  declarationAccepted: z.literal(true, {
    errorMap: () => ({
      message:
        "You must accept the declaration that all information is correct. Any discrepancy will lead to dismissal from the placement process.",
    }),
  }),
});
