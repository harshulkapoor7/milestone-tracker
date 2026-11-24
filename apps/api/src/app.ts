import express from "express";
import { pinoHttp } from "pino-http";
import { logger } from "./logger";
import { currentUser } from "./middleware/current-user";
import { daysRouter } from "./modules/days/days.routes";
import { healthRouter } from "./modules/health/health.routes";
import { plansRouter } from "./modules/plans/plans.routes";
import { tasksRouter } from "./modules/tasks/tasks.routes";
import { errorHandler, notFound } from "./middleware/error-handler";

// Builds the Express app without starting it, so tests (Milestone 4) can use it directly.
export function createApp() {
  const app = express();

  // Middleware runs top to bottom for every request.
  app.use(
    // 1. Log each request (and give handlers req.log)
    pinoHttp({
      logger,
      // Log level by outcome: 5xx = error, 4xx = warn, everything else = info.
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500
          ? "error"
          : res.statusCode >= 400
            ? "warn"
            : "info",
      // Keep only what's useful; full headers are noise (and can contain cookies).
      serializers: {
        req: (req: { method: string; url: string }) => ({
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(express.json()); //       2. parse JSON request bodies into req.body

  // Public routes (no user needed)
  app.use("/health", healthRouter);

  // Everything below needs a current user
  app.use(currentUser);
  app.use("/plans", plansRouter);
  app.use("/days", daysRouter);
  app.use("/tasks", tasksRouter);

  // Must come after all routes
  app.use(notFound); //     no route matched → 404
  app.use(errorHandler); // any error → one consistent JSON response

  return app;
}
