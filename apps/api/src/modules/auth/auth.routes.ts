import { Router } from "express";
import * as auth from "./auth.controller";

// Public: you can't be logged in yet when you register or log in.
export const authRouter = Router();

authRouter.post("/register", auth.register);
authRouter.post("/login", auth.login);
authRouter.post("/logout", auth.logout);
