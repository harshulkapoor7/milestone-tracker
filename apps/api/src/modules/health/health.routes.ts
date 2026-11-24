import { Router } from "express";
import { healthController } from "./health.controller";

// URL → controller map for this module.
export const healthRouter = Router();

healthRouter.get("/", healthController);
