import type { RequestHandler } from "express";
import { createDaySchema, idSchema, updateDaySchema } from "@milestone/shared";
import { requireUserId } from "../../middleware/current-user";
import * as daysService from "./days.service";

// POST /plans/:id/days
export const createDay: RequestHandler = async (req, res) => {
  const planId = idSchema.parse(req.params.id);
  const input = createDaySchema.parse(req.body);
  res
    .status(201)
    .json(await daysService.createDay(requireUserId(req), planId, input));
};

// PATCH /days/:id
export const updateDay: RequestHandler = async (req, res) => {
  const dayId = idSchema.parse(req.params.id);
  const input = updateDaySchema.parse(req.body);
  res.json(await daysService.updateDay(requireUserId(req), dayId, input));
};

// DELETE /days/:id → 204 No Content (success, nothing to send back)
export const deleteDay: RequestHandler = async (req, res) => {
  const dayId = idSchema.parse(req.params.id);
  await daysService.deleteDay(requireUserId(req), dayId);
  res.status(204).end();
};
