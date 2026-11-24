import type { Request, RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { idSchema } from "@milestone/shared";
import { db } from "../db/client";
import { users } from "../db/schema";
import { DEMO_EMAIL } from "../db/seed-data";
import { env } from "../env";
import { AppError } from "../lib/app-error";

// TEMPORARY until real login (Milestone 6): decides who "the current user" is.
// Milestone 6 replaces only this file with a session-cookie check;
// every service already filters by userId, so nothing else changes.
//
//   production  → always 401 (no fake users on a real server)
//   x-user-id   → act as that user (tests use this to play two different users)
//   development → fall back to the seeded demo user, so the browser just works
export const currentUser: RequestHandler = async (req, _res, next) => {
  if (env.NODE_ENV === "production") {
    throw new AppError(401, "UNAUTHENTICATED", "Login is not available yet");
  }

  const header = req.get("x-user-id");
  const userId = header
    ? idSchema.parse(header)
    : env.NODE_ENV === "development"
      ? await findUserIdByEmail(DEMO_EMAIL)
      : undefined;

  if (!userId || !(await userExists(userId))) {
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Unknown user (run npm run db:seed)",
    );
  }

  req.userId = userId;
  next();
};

// Controllers call this to get a guaranteed userId (string, never undefined).
export function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Not logged in");
  }
  return req.userId;
}

async function findUserIdByEmail(email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  return user?.id;
}

async function userExists(id: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id));
  return Boolean(user);
}
