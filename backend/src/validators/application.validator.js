import { z } from "zod";

export const updateStatusSchema = z.object({
  status: z.enum(["APPLIED", "SHORTLISTED", "REJECTED", "SELECTED"], {
    errorMap: () => ({
      message:
        "Status must be one of: APPLIED, SHORTLISTED, REJECTED, SELECTED",
    }),
  }),
});
