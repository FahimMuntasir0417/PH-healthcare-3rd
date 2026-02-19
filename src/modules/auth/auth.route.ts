import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerPatientZodSchema } from "./auth.validation";

const router = Router();
router.post(
  "/login",

  AuthController.loginPatient,
);
router.post(
  "/register",
  validateRequest(registerPatientZodSchema),
  AuthController.registerPatient,
);

export const AuthRoute = router;
