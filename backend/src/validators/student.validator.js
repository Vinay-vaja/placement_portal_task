import { z } from "zod";

const BRANCHES = [
  "CE", "AIML", "IT", "EC", "EE", "CIVIL",
  "CHEMICAL", "MECHANICAL", "RUBBER", "PLASTIC",
  "ENVIRONMENTAL", "IC",
];

const marksSchema = z
  .number()
  .min(0, "Marks cannot be negative")
  .max(100, "Marks cannot exceed 100")
  .optional()
  .nullable();

const percentageSchema = z
  .number()
  .min(0, "Percentage cannot be negative")
  .max(100, "Percentage cannot exceed 100");

const cgpaSchema = z
  .number()
  .min(0, "CGPA cannot be negative")
  .max(10, "CGPA cannot exceed 10");

// Full profile submission schema (locks the profile)
export const profileSubmitSchema = z
  .object({
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

    branch: z.enum(BRANCHES, {
      errorMap: () => ({
        message: `Branch must be one of: ${BRANCHES.join(", ")}`,
      }),
    }),

    studentType: z.enum(["REGULAR", "D2D"], {
      errorMap: () => ({ message: "Student type must be REGULAR or D2D" }),
    }),

    // 10th subject marks (6 subjects: Maths, Science, English, Social Science, Computer/P.T., Sanskrit)
    mathsMarks: z.number().min(0).max(100),
    scienceMarks: z.number().min(0).max(100),
    englishMarks: z.number().min(0).max(100),
    socialScienceMarks: z.number().min(0).max(100),
    computerPtMarks: z.number().min(0).max(100),
    sanskritMarks: z.number().min(0).max(100),

    // 12th subject marks (required for REGULAR, optional for D2D)
    twelfthEnglishMarks: marksSchema,
    twelfthPhysicsMarks: marksSchema,
    twelfthMathsMarks: marksSchema,
    twelfthChemistryMarks: marksSchema,
    twelfthComputerMarks: marksSchema,

    // D2D fields
    d2dCgpa: cgpaSchema.optional().nullable(),
    d2dCollege: z.string().optional().nullable(),
    d2dDetails: z.string().optional().nullable(),
    d2dAcpcRank: z.number().int().positive().optional().nullable(),

    // Declaration (must be true to submit)
    declarationAccepted: z.literal(true, {
      errorMap: () => ({
        message:
          "You must accept the declaration that all information provided is correct.",
      }),
    }),
  })
  .refine(
    (data) => {
      // REGULAR students must provide 12th marks
      if (data.studentType === "REGULAR") {
        return (
          data.twelfthEnglishMarks != null &&
          data.twelfthPhysicsMarks != null &&
          data.twelfthMathsMarks != null &&
          data.twelfthChemistryMarks != null &&
          data.twelfthComputerMarks != null
        );
      }
      return true;
    },
    {
      message: "All 12th standard subject marks are required for REGULAR students",
      path: ["twelfthEnglishMarks"],
    }
  )
  .refine(
    (data) => {
      // D2D students must provide d2dCgpa
      if (data.studentType === "D2D") {
        return data.d2dCgpa != null;
      }
      return true;
    },
    {
      message: "D2D CGPA is required for D2D students",
      path: ["d2dCgpa"],
    }
  );

// SPI submission schema
export const spiSubmitSchema = z.object({
  semester: z
    .number({ required_error: "Semester is required" })
    .int("Semester must be an integer")
    .min(1, "Semester must be between 1 and 8")
    .max(8, "Semester must be between 1 and 8"),
  spi: z
    .number({ required_error: "SPI is required" })
    .min(0, "SPI cannot be negative")
    .max(10, "SPI cannot exceed 10"),
});

// Bulk SPI submission
export const spiBulkSubmitSchema = z.object({
  spis: z
    .array(
      z.object({
        semester: z.number().int().min(1).max(8),
        spi: z.number().min(0).max(10),
      })
    )
    .min(1, "At least one SPI entry is required")
    .max(8, "Maximum 8 semesters"),
});

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
    branch: z.enum(BRANCHES).optional(),
    studentType: z.enum(["REGULAR", "D2D"]).optional(),

    // 10th marks (6 subjects)
    mathsMarks: marksSchema,
    scienceMarks: marksSchema,
    englishMarks: marksSchema,
    socialScienceMarks: marksSchema,
    computerPtMarks: marksSchema,
    sanskritMarks: marksSchema,
    tenthPercentage: percentageSchema.optional(),

    // 12th marks
    twelfthEnglishMarks: marksSchema,
    twelfthPhysicsMarks: marksSchema,
    twelfthMathsMarks: marksSchema,
    twelfthChemistryMarks: marksSchema,
    twelfthComputerMarks: marksSchema,
    twelfthPercentage: percentageSchema.optional().nullable(),

    // D2D
    d2dCgpa: cgpaSchema.optional().nullable(),
    d2dCollege: z.string().optional().nullable(),
    d2dDetails: z.string().optional().nullable(),
    d2dAcpcRank: z.number().int().positive().optional().nullable(),

    verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),

    // Placement tracking
    isPlaced: z.boolean().optional(),
    currentPackageLpa: z.number().positive().optional().nullable(),
    isDismissed: z.boolean().optional(),
    dismissalReason: z.string().optional().nullable(),
  })
  .strict();
