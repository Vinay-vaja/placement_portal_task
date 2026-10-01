import { z } from "zod";

const BRANCHES = [
  "CE", "AIML", "IT", "EC", "EE", "CIVIL",
  "CHEMICAL", "MECHANICAL", "RUBBER", "PLASTIC",
  "ENVIRONMENTAL", "IC", "ROBOTICS", "AUTOMOBILE",
];

export const createDriveSchema = z
  .object({
    companyId: z.string().min(1).optional().nullable(),
    companyName: z.string().min(1).optional().nullable(),
    role: z.string().min(2).trim().optional(),
    jobRole: z.string().min(2).trim().optional(),
    description: z.string().optional().nullable(),
    ctc: z.coerce.number().positive("Min CTC must be positive").optional(),
    minLpa: z.coerce.number().positive("Min CTC must be positive").optional(),
    ctcMax: z.coerce.number().positive("Max CTC must be positive").optional().nullable(),
    maxLpa: z.coerce.number().positive("Max CTC must be positive").optional().nullable(),
    location: z.string().optional().nullable(),

    // Eligibility criteria (all optional)
    minTenthPercentage: z.coerce
      .number()
      .min(0)
      .max(100, "Cannot exceed 100%")
      .optional()
      .nullable(),
    minTwelfthPercentage: z.coerce
      .number()
      .min(0)
      .max(100, "Cannot exceed 100%")
      .optional()
      .nullable(),
    minCgpa: z.coerce
      .number()
      .min(0)
      .max(10, "CGPA cannot exceed 10")
      .optional()
      .nullable(),
    minCpi: z.coerce
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
      .optional(),
    eligibleBranches: z
      .array(z.enum(BRANCHES))
      .optional(),
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
    deadline: z
      .string()
      .refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, "Invalid date format")
      .optional()
      .nullable(),

    companyLogo: z
      .string()
      .trim()
      .url("Invalid logo URL")
      .or(z.literal(""))
      .optional()
      .nullable(),

    status: z.enum(["ACTIVE", "CLOSED"]).default("ACTIVE"),
    maxSelectionsPerStudent: z.coerce.number().int().min(1).default(1),
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
  })
  .refine(
    (data) => Boolean(data.companyId || data.companyName),
    { message: "Either Company ID or Company Name is required", path: ["companyName"] }
  )
  .refine(
    (data) => Boolean(data.role || data.jobRole),
    { message: "Job Role is required", path: ["role"] }
  )
  .refine(
    (data) => data.ctc !== undefined || data.minLpa !== undefined,
    { message: "CTC / Min LPA is required", path: ["ctc"] }
  );

export const updateDriveSchema = z
  .object({
    companyId: z.string().min(1).optional(),
    companyLogo: z
      .string()
      .trim()
      .url("Invalid logo URL")
      .or(z.literal(""))
      .optional()
      .nullable(),
    role: z.string().min(2).trim().optional(),
    jobRole: z.string().min(2).trim().optional(),
    description: z.string().optional().nullable(),
    ctc: z.coerce.number().positive().optional(),
    minLpa: z.coerce.number().positive().optional(),
    ctcMax: z.coerce.number().positive().optional().nullable(),
    maxLpa: z.coerce.number().positive().optional().nullable(),
    location: z.string().optional().nullable(),
    minTenthPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
    minTwelfthPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
    minCgpa: z.coerce.number().min(0).max(10).optional().nullable(),
    minCpi: z.coerce.number().min(0).max(10).optional().nullable(),
    allowedStudentType: z.enum(["ALL", "REGULAR", "D2D"]).optional(),
    allowedBranches: z.array(z.enum(BRANCHES)).optional(),
    eligibleBranches: z.array(z.enum(BRANCHES)).optional(),
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
    deadline: z
      .string()
      .refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, "Invalid date format")
      .optional()
      .nullable(),
    status: z.enum(["ACTIVE", "CLOSED"]).optional(),
    maxSelectionsPerStudent: z.coerce.number().int().min(1).optional(),
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
