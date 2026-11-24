import type { RequestHandler } from "express";
import { idSchema, statsQuerySchema } from "@milestone/shared";
import { requireUserId } from "../../middleware/current-user";
import * as statsService from "./stats.service";

// GET /plans/:id/stats?tz=Asia/Kolkata
export const getStats: RequestHandler = async (req, res) => {
  const planId = idSchema.parse(req.params.id);
  const { tz } = statsQuerySchema.parse(req.query); // query string, validated like a body
  res.json(await statsService.getStats(requireUserId(req), planId, tz));
};
