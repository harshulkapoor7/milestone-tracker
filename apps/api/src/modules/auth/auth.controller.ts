import type { RequestHandler } from "express";
import { loginSchema, registerSchema } from "@milestone/shared";
import { requireUserId } from "../../middleware/current-user";
import * as authService from "./auth.service";
import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from "./cookie";
import { deleteSession } from "./sessions";

// POST /auth/register → 201 + session cookie (you're logged in straight away)
export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const { user, session } = await authService.register(input);
  setSessionCookie(res, session.token, session.expiresAt);
  res.status(201).json(user);
};

// POST /auth/login → 200 + session cookie
export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const { user, session } = await authService.login(input);
  setSessionCookie(res, session.token, session.expiresAt);
  res.json(user);
};

// POST /auth/logout → 204. Deletes the session in the database too, so the old
// cookie is useless even if someone copied it.
export const logout: RequestHandler = async (req, res) => {
  const token = readSessionToken(req.cookies);
  if (token) await deleteSession(token);
  clearSessionCookie(res);
  res.status(204).end();
};

// GET /me → who am I? The web app calls this on load to decide: app or login screen.
export const me: RequestHandler = async (req, res) => {
  res.json(await authService.getUser(requireUserId(req)));
};
