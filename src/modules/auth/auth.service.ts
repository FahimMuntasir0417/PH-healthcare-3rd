import { UserStatus } from "../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import {
  IloginPaitentpayload,
  IregisterPaitentpayload,
} from "./auth.interface";

const registerPatient = async (payload: IregisterPaitentpayload) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!data.user) {
    throw new Error("Failed to register patient");
  }

  try {
    const patient = await prisma.$transaction(async (tx) => {
      return tx.patient.create({
        data: {
          userId: data.user.id,
          name: payload.name,
          email: payload.email,
        },
      });
    });

    return {
      ...data,
      patient,
    };
  } catch (error) {
    // rollback created auth user if patient creation fails
    await prisma.user.delete({
      where: { id: data.user.id },
    });

    throw new Error("Failed to register patient in database");
  }
};

const loginPatient = async (payload: IloginPaitentpayload) => {
  const { email, password } = payload;

  const data = await auth.api.signInEmail({
    body: { email, password },
  });
  if (data.user.status === UserStatus.BLOCKED) {
    throw new Error("Your account is blocked. Please contact support.");
  }
  if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
    throw new Error("User is deleted");
  }
  return {
    ...data,
  };
};

export const AuthService = {
  registerPatient,
  loginPatient,
};
