import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { SpecialtyController } from "./specialty.controller";
import {
  createSpecialtyZodSchema,
  updateSpecialtyZodSchema,
} from "./specialty.validation";

const router = Router();

// POST http://localhost:5000/api/v1/specialties
router.post(
  "/",
  validateRequest(createSpecialtyZodSchema),
  SpecialtyController.createSpecialty,
);

// GET http://localhost:5000/api/v1/specialties
router.get("/", SpecialtyController.getSpecialties);

// GET http://localhost:5000/api/v1/specialties/:id
router.get("/:id", SpecialtyController.getSpecialtyById);

// PATCH http://localhost:5000/api/v1/specialties/:id
router.patch(
  "/:id",
  validateRequest(updateSpecialtyZodSchema),
  SpecialtyController.updateSpecialty,
);

// DELETE http://localhost:5000/api/v1/specialties/:id
router.delete("/:id", SpecialtyController.deleteSpecialty);

export const SpecialtyRoute = router;
