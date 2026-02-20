import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerPatientZodSchema } from "./auth.validation";

const router = Router();

// POST http://localhost:5000/api/v1/auth/login
router.post("/login", AuthController.loginPatient);

// POST http://localhost:5000/api/v1/auth/register
router.post(
  "/register",
  validateRequest(registerPatientZodSchema),
  AuthController.registerPatient,
);

export const AuthRoute = router;
