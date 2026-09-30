import { z } from "zod";

const BRANCHES = [
  "CE", "AIML", "IT", "EC", "EE", "CIVIL",
  "CHEMICAL", "MECHANICAL", "RUBBER", "PLASTIC",
  "ENVIRONMENTAL", "IC",
];

export const createDriveSchema = z.object({
  companyId: z
    .string({ required_error: "Company ID is required" })
    .min(1, "Company ID is required"),
  role: z
    .string({ required_error: "Role is required" })
    .min(2, "Role must be at least 2 characters")
    .trim(),
  description: z.string().optional().nullable(),
  ctc: z
    .number({ required_error: "CTC is required" })
    .positive("CTC must be positive"),
  ctcMax: z
    .number()
    .positive("Max CTC must be positive")
    .optional()
    .nullable(),
  location: z.string().optional().nullable(),

  // Eligibility criteria (all optional)
  minTenthPercentage: z
    .number()
    .min(0)
    .max(100, "Cannot exceed 100%")
    .optional()
    .nullable(),
  minTwelfthPercentage: z
    .number()
    .min(0)
    .max(100, "Cannot exceed 100%")
    .optional()
    .nullable(),
  minCgpa: z
    .number()
    .min(0)
    .max(10, "CGPA cannot exceed 10")
    .optional()
    .nullable(),
  minCpi: z
    .number()
    .min(0)
    .max(10, "CPI cannot exceed 10")
    .optional()
    .nullable(),
  allowedStudentType: z
    .enum(["ALL", "REGULAR", "D2D"])
    .default("ALL"),
  allowedBranches: z
    .array(z.enum(BRANCHES))
    .default([]),
  backlogsAllowed: z.boolean().default(false),

  applicationDeadline: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid date format")
    .optional()
    .nullable(),

  status: z.enum(["ACTIVE", "CLOSED"]).default("ACTIVE"),
  maxSelectionsPerStudent: z.number().int().min(1).default(1),
  tpoAllowMultiple: z.boolean().default(false),
  roundDetails: z
    .object({
      rounds: z.array(
        z.object({
          name: z.string(),
          date: z.string().optional(),
          time: z.string().optional(),
          venue: z.string().optional(),
        })
      ),
    })
    .optional()
    .nullable(),
});

export const updateDriveSchema = z
  .object({
    companyId: z.string().min(1).optional(),
    role: z.string().min(2).trim().optional(),
    description: z.string().optional().nullable(),
    ctc: z.number().positive().optional(),
    ctcMax: z.number().positive().optional().nullable(),
    location: z.string().optional().nullable(),
    minTenthPercentage: z.number().min(0).max(100).optional().nullable(),
    minTwelfthPercentage: z.number().min(0).max(100).optional().nullable(),
    minCgpa: z.number().min(0).max(10).optional().nullable(),
    minCpi: z.number().min(0).max(10).optional().nullable(),
    allowedStudentType: z.enum(["ALL", "REGULAR", "D2D"]).optional(),
    allowedBranches: z.array(z.enum(BRANCHES)).optional(),
    backlogsAllowed: z.boolean().optional(),
    applicationDeadline: z
      .string()
      .refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, "Invalid date format")
      .optional()
      .nullable(),
    status: z.enum(["ACTIVE", "CLOSED"]).optional(),
    maxSelectionsPerStudent: z.number().int().min(1).optional(),
    tpoAllowMultiple: z.boolean().optional(),
    roundDetails: z
      .object({
        rounds: z.array(
          z.object({
            name: z.string(),
            date: z.string().optional(),
            time: z.string().optional(),
            venue: z.string().optional(),
          })
        ),
      })
      .optional()
      .nullable(),
  })
  .strict();
