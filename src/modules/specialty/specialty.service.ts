import status from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  TSpecialtyCreatePayload,
  TSpecialtyUpdatePayload,
} from "./specialty.interface";

const createSpecialty = async (payload: TSpecialtyCreatePayload) => {
  const existing = await prisma.specialty.findFirst({
    where: { title: payload.title },
  });

  if (existing) {
    if (!existing.isDeleted) {
      throw new AppError(status.CONFLICT, "Specialty title already exists");
    }

    const data: TSpecialtyUpdatePayload & {
      isDeleted: boolean;
      deletedAt: null;
    } = {
      title: payload.title,
      isDeleted: false,
      deletedAt: null,
    };

    if (payload.description !== undefined) {
      data.description = payload.description;
    }

    if (payload.icon !== undefined) {
      data.icon = payload.icon;
    }

    return prisma.specialty.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.specialty.create({
    data: payload,
  });
};

const getSpecialties = async () => {
  return prisma.specialty.findMany({
    where: { isDeleted: false },
    orderBy: { title: "asc" },
  });
};

const getSpecialtyById = async (id: string) => {
  const specialty = await prisma.specialty.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!specialty) {
    throw new AppError(status.NOT_FOUND, "Specialty not found");
  }

  return specialty;
};

const updateSpecialty = async (
  id: string,
  payload: TSpecialtyUpdatePayload,
) => {
  const existing = await prisma.specialty.findUnique({
    where: { id },
  });

  if (!existing || existing.isDeleted) {
    throw new AppError(status.NOT_FOUND, "Specialty not found");
  }

  if (payload.title) {
    const duplicate = await prisma.specialty.findFirst({
      where: {
        title: payload.title,
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new AppError(status.CONFLICT, "Specialty title already exists");
    }
  }

  return prisma.specialty.update({
    where: { id },
    data: payload,
  });
};

const deleteSpecialty = async (id: string) => {
  const existing = await prisma.specialty.findUnique({
    where: { id },
  });

  if (!existing || existing.isDeleted) {
    throw new AppError(status.NOT_FOUND, "Specialty not found");
  }

  return prisma.specialty.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

export const SpecialtyService = {
  createSpecialty,
  getSpecialties,
  getSpecialtyById,
  updateSpecialty,
  deleteSpecialty,
};
