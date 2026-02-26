import status from "http-status";
import { Request } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
import { tokenUtils } from "../../utils/token";
import { CookieUtils } from "../../utils/cookie";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config";

const getHeaderValue = (req: Request, key: string) => {
  const value = req.headers[key.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const getBearerToken = (authorization?: string | string[]) => {
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!header) return undefined;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return undefined;
  return token;
};

const resolveSessionToken = async (req: Request) => {
  const bearerToken = getBearerToken(req.headers.authorization);
  const headerSessionToken =
    bearerToken ||
    getHeaderValue(req, "x-session-token") ||
    getHeaderValue(req, "session-token") ||
    getHeaderValue(req, "sessiontoken");

  const cookieSessionToken = CookieUtils.getCookie(
    req,
    "better-auth.session_token",
  );
  const bodySessionToken = req.body?.sessionToken;

  const candidate = headerSessionToken || cookieSessionToken || bodySessionToken;
  if (candidate) {
    const session = await prisma.session.findFirst({
      where: {
        token: candidate,
        expiresAt: { gt: new Date() },
      },
      select: { token: true },
    });
    if (session) {
      return session.token;
    }
  }

  const accessToken =
    getHeaderValue(req, "x-access-token") ||
    getHeaderValue(req, "access-token") ||
    getHeaderValue(req, "accesstoken") ||
    CookieUtils.getCookie(req, "accessToken") ||
    req.body?.accessToken ||
    bearerToken;

  if (!accessToken) return undefined;

  const verifiedAccess = jwtUtils.verifyToken(
    accessToken,
    envVars.ACCESS_TOKEN_SECRET,
  );
  if (!verifiedAccess.success || !verifiedAccess.data?.userId) {
    return undefined;
  }

  const session = await prisma.session.findFirst({
    where: {
      userId: verifiedAccess.data.userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { token: true },
  });

  return session?.token;
};

const registerPatient = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await AuthService.registerPatient(payload);
  const { accessToken, refreshToken, token, ...data } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Patient registered successfully",
    data: {
      ...data,
      accessToken,
      refreshToken,
      token,
    },
  });
});

const loginPatient = catchAsync(async (req, res) => {
  const result = await AuthService.loginPatient(req.body);
  const { accessToken, refreshToken, token, ...data } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Login successful",
    data: {
      accessToken,
      refreshToken,
      token,
      ...data,
    },
  });
});

const getMe = catchAsync(async (req, res) => {
  const result = await AuthService.getMe(req.user.userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const getNewTokens = catchAsync(async (req, res) => {
  const refreshToken =
    CookieUtils.getCookie(req, "refreshToken") || req.body?.refreshToken;
  const sessionToken = await resolveSessionToken(req);

  if (!refreshToken || !sessionToken) {
    throw new Error("Missing refresh or session token");
  }

  const result = await AuthService.getNewTokens(refreshToken, sessionToken);
  const {
    accessToken,
    refreshToken: newRefreshToken,
    sessionToken: token,
  } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tokens refreshed successfully",
    data: result,
  });
});

// const changePassword = catchAsync(async (req, res) => {
//   const sessionToken =
//     req.cookies["better-auth.session_token"] || req.body?.sessionToken;

//   console.log("Received change password request, session token:", sessionToken);

//   if (!sessionToken) {
//     throw new Error("No session token found");
//   }

//   const result = await AuthService.changePassword(req.body, sessionToken);
//   console.log("Password changed, new tokens issued:", result);
//   const { accessToken, refreshToken, token } = result;

//   tokenUtils.setAccessTokenCookie(res, accessToken);
//   tokenUtils.setRefreshTokenCookie(res, refreshToken);
//   tokenUtils.setBetterAuthSessionCookie(res, token as string);
//   sendResponse(res, {
//     httpStatusCode: status.OK,
//     success: true,
//     message: "Password changed successfully",
//     data: result,
//   });
// });

const changePassword = catchAsync(async (req, res) => {
  const sessionToken = await resolveSessionToken(req);

  if (!sessionToken) {
    throw new Error(
      "No session token found. Provide a session token, or an access token to derive a valid session.",
    );
  }

  const result = await AuthService.changePassword(req.body, sessionToken);

  const { accessToken, refreshToken, token } = result as any;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  if (token) {
    tokenUtils.setBetterAuthSessionCookie(res, token);
  }

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

const logout = catchAsync(async (req, res) => {
  const sessionToken = await resolveSessionToken(req);
  if (!sessionToken) {
    throw new Error("No session token found");
  }

  const result = await AuthService.logout(sessionToken);

  const cookieOptions = tokenUtils.getBaseCookieOptions();

  CookieUtils.clearCookie(res, "accessToken", cookieOptions);
  CookieUtils.clearCookie(res, "refreshToken", cookieOptions);
  CookieUtils.clearCookie(res, "better-auth.session_token", cookieOptions);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Logout successful",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email, otp } = req.body as { email: string; otp: string };

  await AuthService.verifyEmail(email, otp);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Email verified successfully",
    data: null,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const { email } = req.body as { email: string };

  await AuthService.forgetPassword(email);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Password reset email sent successfully",
    data: null,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body as {
    email: string;
    otp: string;
    newPassword: string;
  };

  await AuthService.resetPassword(email, otp, newPassword);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Password reset successfully",
    data: null,
  });
});

export const AuthController = {
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
