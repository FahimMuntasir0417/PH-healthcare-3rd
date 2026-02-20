import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DoctorService } from "./doctor.service";

const getDoctors = catchAsync(async (_req, res) => {
  const result = await DoctorService.getDoctors();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Doctors retrieved successfully",
    data: result,
  });
});

const getDoctorById = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  const result = await DoctorService.getDoctorById(id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Doctor retrieved successfully",
    data: result,
  });
});

const updateDoctor = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  const result = await DoctorService.updateDoctor(id, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Doctor updated successfully",
    data: result,
  });
});

const deleteDoctor = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  const result = await DoctorService.deleteDoctor(id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Doctor deleted successfully",
    data: result,
  });
});

export const DoctorController = {
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
