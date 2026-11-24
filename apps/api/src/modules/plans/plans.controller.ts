import type { RequestHandler } from "express";
import {
  createPlanSchema,
  idSchema,
  updatePlanSchema,
} from "@milestone/shared";
import { requireUserId } from "../../middleware/current-user";
import * as plansService from "./plans.service";

// HTTP only: validate input with Zod (a ZodError becomes a 400 automatically),
// call the service, pick the status code.

export const listPlans: RequestHandler = async (req, res) => {
  res.json(await plansService.listPlans(requireUserId(req)));
};

export const createPlan: RequestHandler = async (req, res) => {
  const input = createPlanSchema.parse(req.body);
  res
    .status(201)
    .json(await plansService.createPlan(requireUserId(req), input));
};

export const getPlan: RequestHandler = async (req, res) => {
  const planId = idSchema.parse(req.params.id);
  res.json(await plansService.getPlan(requireUserId(req), planId));
};

export const updatePlan: RequestHandler = async (req, res) => {
  const planId = idSchema.parse(req.params.id);
  const input = updatePlanSchema.parse(req.body);
  res.json(await plansService.updatePlan(requireUserId(req), planId, input));
};
