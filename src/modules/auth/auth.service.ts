import { UserStatus } from "../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import {
  IchangePasswordPayload,
  IloginPaitentpayload,
  IregisterPaitentpayload,
} from "./auth.interface";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config";
import { JwtPayload } from "jsonwebtoken";

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

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },

    // include: {
    //   patient: {
    //     include: { appoitnments: true },
    //   },
    //   doctor: {
    //     include: { appoitnments: true },
    //   },
    // },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const getNewTokens = async (refreshToken: string, sessionToken: string) => {
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
  });
  if (!session || session.expiresAt < new Date()) {
    throw new Error("Invalid or expired session");
  }
  const verifiedToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET,
  );

  if (!verifiedToken.success || !verifiedToken.data?.userId) {
    throw new Error("Invalid refresh token");
  }

  const data = verifiedToken.data as JwtPayload;
  if (session.userId !== data.userId) {
    throw new Error("Invalid refresh token");
  }

  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });
  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const sessionLifetimeMs =
    session.expiresAt.getTime() - session.createdAt.getTime();

  const { token } = await prisma.session.update({
    where: { token: sessionToken },
    data: {
      token: sessionToken,
      expiresAt: new Date(Date.now() + sessionLifetimeMs),
    },
  });
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: token,
  };
};

const changePassword = async (
  payload: IchangePasswordPayload,
  sessionToken: string,
) => {
  console.log("Changing password for session token:", sessionToken);
  const session = await auth.api.getSession({
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  if (!session) {
    throw new Error("Invalid or expired session");
  }

  const { currentPassword, newPassword } = payload;

  const isCurrentPasswordValid = await auth.api.verifyPassword({
    body: { password: currentPassword },
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  if (!isCurrentPasswordValid) {
    throw new Error("Current password is incorrect");
  }
  const updatedPassword = await auth.api.changePassword({
    body: { currentPassword, newPassword, revokeOtherSessions: true },
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  if (session.user.needPasswordChange) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { needPasswordChange: false },
    });
  }
  const tokenPayload = {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  };
  const accessToken = tokenUtils.getAccessToken(tokenPayload);
  const refreshToken = tokenUtils.getRefreshToken(tokenPayload);

  return {
    ...updatedPassword,
    accessToken,
    refreshToken,
  };
};

const logout = async (sessionToken: string) => {
  const result = await auth.api.signOut({
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  return result;
};

const verifyEmail = async (email: string, otp: string) => {
  const result = await auth.api.verifyEmailOTP({
    body: { email, otp },
  });

  if (!result.user.emailVerified) {
    await prisma.user.update({
      where: { id: result.user.id },
      data: { emailVerified: true },
    });
  }
};

const forgetPassword = async (email: string) => {
  const inUserExist = await prisma.user.findUnique({ where: { email } });
  if (!inUserExist) {
    throw new Error("User with this email does not exist");
  }
  if (inUserExist.isDeleted || inUserExist.status === UserStatus.DELETED) {
    throw new Error("User is deleted");
  }
  if (inUserExist.status === UserStatus.BLOCKED) {
    throw new Error("Your account is blocked. Please contact support.");
  }
  if (inUserExist.emailVerified === false) {
    throw new Error("Email is not verified. Please verify your email first.");
  }

  await auth.api.requestPasswordResetEmailOTP({
    body: { email },
  });
};

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!isUserExist) {
    throw new Error("User with this email does not exist");
  }

  await auth.api.resetPasswordEmailOTP({
    body: {
      email,
      otp,
      password: newPassword,
    },
  });

  if (isUserExist.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: isUserExist.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  await prisma.session.deleteMany({
    where: {
      userId: isUserExist.id,
    },
  });
};

export const AuthService = {
  registerPatient,
  loginPatient,
  getMe,
  getNewTokens,
  changePassword,
  logout,
  verifyEmail,
  forgetPassword,
  resetPassword,
};
