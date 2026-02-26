import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  loginPatientZodSchema,
  registerPatientZodSchema,
} from "./auth.validation";
import { checkAuth } from "../../middlewares/checkAuth";

const router = Router();

// POST http://localhost:5000/api/v1/auth/login
router.post(
  "/login",
  validateRequest(loginPatientZodSchema),
  AuthController.loginPatient,
);

// POST http://localhost:5000/api/v1/auth/register
router.post(
  "/register",
  validateRequest(registerPatientZodSchema),
  AuthController.registerPatient,
);

// GET http://localhost:5000/api/v1/auth/me
router.get("/me", checkAuth(), AuthController.getMe);

// POST http://localhost:5000/api/v1/auth/refresh-token
router.post("/refresh-token", AuthController.getNewTokens);

router.post("/change-password", AuthController.changePassword);
router.post("/logout", AuthController.logout);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/forget-password", AuthController.forgetPassword);
router.post("/reset-password", AuthController.resetPassword);

export const AuthRoute = router;
