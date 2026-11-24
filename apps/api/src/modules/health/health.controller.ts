import type { RequestHandler } from "express";
import { getHealth } from "./health.service";

// HTTP layer only: read the request, call the service, send the response.
export const healthController: RequestHandler = (_req, res) => {
  res.json(getHealth());
};
