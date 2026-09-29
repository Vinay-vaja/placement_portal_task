import { z } from "zod";

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
