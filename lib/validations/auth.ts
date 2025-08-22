import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  apartmentNumber: z
    .string()
    .min(1, "Apartment number is required")
    .max(10, "Apartment number must be less than 10 characters"),
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .nullable(),
})

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type RegisterFormData = z.infer<typeof registerSchema>
export type LoginFormData = z.infer<typeof loginSchema>