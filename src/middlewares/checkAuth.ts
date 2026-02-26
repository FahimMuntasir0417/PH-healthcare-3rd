import { NextFunction, Request, Response } from "express";
import { Role } from "../generated/prisma/enums";
import { CookieUtils } from "../utils/cookie";
import { prisma } from "../lib/prisma";
import { UserStatus } from "./../generated/prisma/enums";

import { envVars } from "../config";
import { jwtUtils } from "../utils/jwt";

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const getHeaderValue = (key: string) => {
        const value = req.headers[key.toLowerCase()];
        return Array.isArray(value) ? value[0] : value;
      };

      const authHeader = getHeaderValue("authorization");
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;

      const sessionToken =
        getHeaderValue("x-session-token") ||
        getHeaderValue("session-token") ||
        getHeaderValue("sessiontoken") ||
        CookieUtils.getCookie(req, "better-auth.session_token");

      if (!sessionToken) {
        throw new Error("No session token found");
      }

      const accessToken =
        bearerToken ||
        getHeaderValue("x-access-token") ||
        getHeaderValue("access-token") ||
        getHeaderValue("accesstoken") ||
        CookieUtils.getCookie(req, "accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const sessionExists = await prisma.session.findFirst({
        where: {
          token: sessionToken,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!sessionExists || !sessionExists.user) {
        throw new Error("Invalid or expired session");
      }

      const user = sessionExists.user;

      const now = new Date();
      const expiresAt = new Date(sessionExists.expiresAt);
      const createdAt = new Date(sessionExists.createdAt);

      const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
      const timeRemaining = expiresAt.getTime() - now.getTime();
      const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

      if (percentRemaining < 20) {
        res.setHeader("X-Session-Refresh", "true");
        res.setHeader("X-Session-Expires-At", expiresAt.toISOString());
        res.setHeader("X-Time-Remaining", timeRemaining.toString());

        console.log("Session Expiring Soon!!");
      }

      if (
        user.status === UserStatus.BLOCKED ||
        user.status === UserStatus.DELETED
      ) {
        throw new Error("User is not active");
      }
      if (user.isDeleted) {
        throw new Error("User is not active");
      }

      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET,
      );
      if (!verifiedToken.success || !verifiedToken.data?.userId) {
        throw new Error("Invalid access token");
      }

      if (verifiedToken.data.userId !== user.id) {
        throw new Error("Unauthorized");
      }

      if (authRoles.length > 0 && !authRoles.includes(user.role as Role)) {
        throw new Error("Unauthorized");
      }

      req.user = {
        userId: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        status: user.status,
      };

      return next();
    } catch (error: any) {
      next(error);
    }
  };
