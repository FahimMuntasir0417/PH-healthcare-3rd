import status from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TDoctorUpdatePayload } from "./doctor.interface";

const getDoctors = async () => {
  return prisma.doctor.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
  });
};

const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findFirst({
    where: { id, isDeleted: false },
  });

  if (!doctor) {
    throw new AppError(status.NOT_FOUND, "Doctor not found");
  }

  return doctor;
};

const updateDoctor = async (id: string, payload: TDoctorUpdatePayload) => {
  const existing = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!existing || existing.isDeleted) {
    throw new AppError(status.NOT_FOUND, "Doctor not found");
  }

  const hasUpdate = Object.values(payload).some((value) => value !== undefined);
  if (!hasUpdate) {
    throw new AppError(status.BAD_REQUEST, "No update data provided");
  }

  if (payload.email) {
    const duplicateEmail = await prisma.doctor.findFirst({
      where: { email: payload.email, NOT: { id } },
    });

    if (duplicateEmail) {
      throw new AppError(status.CONFLICT, "Doctor email already exists");
    }
  }

  if (payload.registrationNumber) {
    const duplicateRegistration = await prisma.doctor.findFirst({
      where: { registrationNumber: payload.registrationNumber, NOT: { id } },
    });

    if (duplicateRegistration) {
      throw new AppError(
        status.CONFLICT,
        "Doctor registration number already exists",
      );
    }
  }

  return prisma.doctor.update({
    where: { id },
    data: payload,
  });
};

const deleteDoctor = async (id: string) => {
  const existing = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!existing || existing.isDeleted) {
    throw new AppError(status.NOT_FOUND, "Doctor not found");
  }

  return prisma.doctor.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

export const DoctorService = {
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
