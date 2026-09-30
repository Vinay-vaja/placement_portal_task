import { z } from "zod";

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["APPLIED", "SHORTLISTED", "REJECTED", "SELECTED"], {
    errorMap: () => ({
      message: "Status must be one of: APPLIED, SHORTLISTED, REJECTED, SELECTED",
    }),
  }),
});

export const markAttendanceSchema = z.object({
  isPresent: z.boolean({ required_error: "isPresent is required (true/false)" }),
});

export const bulkAttendanceSchema = z.object({
  studentIds: z
    .array(z.string().min(1))
    .min(1, "At least one student ID is required"),
  isPresent: z.boolean({ required_error: "isPresent is required (true/false)" }),
});
