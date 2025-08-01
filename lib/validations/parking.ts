import { z } from "zod"

export const parkingSpotSchema = z.object({
  spotNumber: z
    .string()
    .min(1, "Spot number is required")
    .max(10, "Spot number must be less than 10 characters"),
  buildingSection: z
    .string()
    .max(50, "Building section must be less than 50 characters")
    .optional()
    .or(z.literal("")),
})

export const availabilitySchema = z.object({
  spotId: z.string().uuid("Invalid spot ID"),
  startTime: z.string().datetime("Invalid start time"),
  endTime: z.string().datetime("Invalid end time"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
)

export const claimSchema = z.object({
  availabilityId: z.string().uuid("Invalid availability ID"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .or(z.literal("")),
})

export type ParkingSpotFormData = z.infer<typeof parkingSpotSchema>
export type AvailabilityFormData = z.infer<typeof availabilitySchema>
export type ClaimFormData = z.infer<typeof claimSchema>