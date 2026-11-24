import { Router } from "express";
import { createDay } from "../days/days.controller";
import * as plans from "./plans.controller";

export const plansRouter = Router();

plansRouter.get("/", plans.listPlans);
plansRouter.post("/", plans.createPlan);
plansRouter.get("/:id", plans.getPlan);
plansRouter.patch("/:id", plans.updatePlan);
plansRouter.post("/:id/days", createDay); // a new day always belongs to a plan
