import z from "zod";

const nameSchema = z.string().trim().min(1, "Name is required");
const emailSchema = z.string().trim().email("Invalid email address");
const urlSchema = z.string().trim().min(1, "Profile photo cannot be empty");
const contactSchema = z.string().trim().min(1, "Contact number cannot be empty");
const addressSchema = z.string().trim().min(1, "Address cannot be empty");
const registrationSchema = z
  .string()
  .trim()
  .min(1, "Registration number is required");
const qualificationSchema = z
  .string()
  .trim()
  .min(1, "Qualification is required");
const workingPlaceSchema = z
  .string()
  .trim()
  .min(1, "Current working place is required");
const designationSchema = z
  .string()
  .trim()
  .min(1, "Designation is required");

export const updateDoctorZodSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  profilePhoto: urlSchema.nullable().optional(),
  contactNumber: contactSchema.nullable().optional(),
  address: addressSchema.nullable().optional(),
  registrationNumber: registrationSchema.optional(),
  experience: z.number().int().min(0, "Experience cannot be negative").optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  appointmentFee: z
    .number()
    .min(0, "Appointment fee cannot be negative")
    .optional(),
  qualification: qualificationSchema.optional(),
  currentWorkingPlace: workingPlaceSchema.optional(),
  designation: designationSchema.optional(),
  averageRating: z
    .number()
    .min(0, "Average rating cannot be negative")
    .max(5, "Average rating cannot exceed 5")
    .optional(),
});
