import { Router } from "express";
import { AuthRoute } from "../modules/auth/auth.route";
import { DoctorRoute } from "../modules/doctor/doctor.route";
import { SpecialtyRoute } from "../modules/specialty/specialty.route";

const router = Router();

router.use("/auth", AuthRoute);
router.use("/doctors", DoctorRoute);
router.use("/specialties", SpecialtyRoute);
export const appRouter = router;
