import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { DoctorController } from "./doctor.controller";
import { updateDoctorZodSchema } from "./doctor.validation";

const router = Router();

// GET http://localhost:5000/api/v1/doctors
router.get("/", DoctorController.getDoctors);

// GET http://localhost:5000/api/v1/doctors/:id
router.get("/:id", DoctorController.getDoctorById);

// PATCH http://localhost:5000/api/v1/doctors/:id
router.patch(
  "/:id",
  validateRequest(updateDoctorZodSchema),
  DoctorController.updateDoctor,
);

// DELETE http://localhost:5000/api/v1/doctors/:id
router.delete("/:id", DoctorController.deleteDoctor);

export const DoctorRoute = router;
