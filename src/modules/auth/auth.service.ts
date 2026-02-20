import { UserStatus } from "../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import {
  IloginPaitentpayload,
  IregisterPaitentpayload,
} from "./auth.interface";

const registerPatient = async (payload: IregisterPaitentpayload) => {
  const { name, email, password } = payload;

  // 1) Create auth user
  const data = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!data.user) throw new Error("Failed to register patient");

  try {
    // 2) Create patient row (no need for $transaction if it's a single create)
    const createdPatient = await prisma.patient.create({
      data: {
        userId: data.user.id,
        name,
        email,
      },
    });

    // 3) Tokens
    const tokenPayload = {
      userId: data.user.id,
      role: data.user.role,
      name: data.user.name,
      email: data.user.email,
      status: data.user.status,
      isDeleted: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    };

    const accessToken = tokenUtils.getAccessToken(tokenPayload);
    const refreshToken = tokenUtils.getRefreshToken(tokenPayload);

    return {
      ...data,
      accessToken,
      refreshToken,
      createdPatient,
    };
  } catch (err) {
    await prisma.user.delete({ where: { id: data.user.id } }); // Rollback auth user if patient creation fails
    throw err;
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

  const tokenPayload = {
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  };
  const accessToken = tokenUtils.getAccessToken(tokenPayload);
  const refreshToken = tokenUtils.getRefreshToken(tokenPayload);

  return {
    ...data,
    accessToken,
    refreshToken,
  };
};

export const AuthService = {
  registerPatient,
  loginPatient,
};
