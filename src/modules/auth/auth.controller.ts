import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const registerPatient = catchAsync(async (req, res) => {
  const result = await AuthService.registerPatient(req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Patient registered successfully",
    data: result,
  });
});

const loginPatient = catchAsync(async (req, res) => {
  const result = await AuthService.loginPatient(req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Login successful",
    data: result,
  });
});

export const AuthController = {
  registerPatient,
  loginPatient,
};
