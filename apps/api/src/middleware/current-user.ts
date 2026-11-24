import type { Request, RequestHandler } from "express";
import { AppError } from "../lib/app-error";
import { readSessionToken, setSessionCookie } from "../modules/auth/cookie";
import { validateSession } from "../modules/auth/sessions";

// Who is making this request? Answered by the session cookie, nothing else.
// (Milestone 4's temporary version used a header and a demo-user fallback;
// this file was always meant to be swapped, and nothing else had to change.)
export const currentUser: RequestHandler = async (req, res, next) => {
  const token = readSessionToken(req.cookies);
  const session = token ? await validateSession(token) : null;

  if (!token || !session) {
    throw new AppError(401, "UNAUTHENTICATED", "Please log in");
  }

  // Sliding expiry: the database row was extended, so extend the cookie too.
  if (session.renewed) setSessionCookie(res, token, session.expiresAt);

  req.userId = session.userId;
  next();
};

// Controllers call this to get a guaranteed userId (string, never undefined).
export function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Please log in");
  }
  return req.userId;
}
