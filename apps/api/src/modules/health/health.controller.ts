import type { RequestHandler } from "express";
import { getHealth } from "./health.service";

// HTTP layer only: read the request, call the service, send the response.
// 503 "Service Unavailable" tells load balancers not to send traffic here.
export const healthController: RequestHandler = async (_req, res) => {
  const health = await getHealth();
  res.status(health.status === "ok" ? 200 : 503).json(health);
};
