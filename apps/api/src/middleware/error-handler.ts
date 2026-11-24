import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";
import { AppError } from "../lib/app-error";

// Runs when no route matched the request.
export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new AppError(404, "NOT_FOUND", `No route for ${req.method} ${req.path}`),
  );
};

// The single place where every error becomes an HTTP response.
// Express knows this is an error handler because it takes 4 arguments.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Errors we threw on purpose: safe to show their message.
  if (err instanceof AppError) {
    res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message } });
    return;
  }

  // Invalid request data (from Zod validation in later milestones).
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: z.prettifyError(err) },
    });
    return;
  }

  // Client errors raised by Express itself, e.g. malformed JSON in the body.
  // They carry a 4xx status and `expose: true`, meaning the message is safe to show.
  if (isExposedHttpError(err)) {
    res.status(err.status).json({
      error: { code: "BAD_REQUEST", message: err.message },
    });
    return;
  }

  // Anything else is a bug: log the details, but never leak them to the client.
  req.log.error({ err }, "Unhandled error");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
};

function isExposedHttpError(
  err: unknown,
): err is { status: number; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "expose" in err &&
    err.expose === true &&
    "status" in err &&
    typeof err.status === "number" &&
    err.status >= 400 &&
    err.status < 500
  );
}
