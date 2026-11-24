import type { CookieOptions, Response } from "express";
import { env } from "../../env";

export const SESSION_COOKIE = "sid";

// Each flag closes a door:
// - httpOnly: JavaScript in the page can't read it, so an XSS bug can't steal it.
// - sameSite "lax": other websites can't make your browser send it with their
//   POST/PATCH/DELETE requests (blocks CSRF), but normal links still work.
// - secure: only sent over HTTPS (off locally, because localhost is plain HTTP).
// - path "/": sent with every request to this site.
const baseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
};

export function setSessionCookie(res: Response, token: string, expires: Date) {
  res.cookie(SESSION_COOKIE, token, { ...baseOptions, expires });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, baseOptions);
}

// cookie-parser puts cookies on req.cookies (typed `any`); read ours safely.
export function readSessionToken(cookies: unknown): string | undefined {
  if (typeof cookies !== "object" || cookies === null) return undefined;
  const value = (cookies as Record<string, unknown>)[SESSION_COOKIE];
  return typeof value === "string" && value ? value : undefined;
}
