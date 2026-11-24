import express from "express";
import { pinoHttp } from "pino-http";
import { logger } from "./logger";
import { healthRouter } from "./modules/health/health.routes";
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

  // Routes
  app.use("/health", healthRouter);

  // Must come after all routes
  app.use(notFound); //     no route matched → 404
  app.use(errorHandler); // any error → one consistent JSON response

  return app;
}
