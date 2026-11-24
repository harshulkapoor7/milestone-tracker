import { pino } from "pino";
import { env } from "./env";

// One shared logger for the whole API.
// Development: colourful, human-readable lines (pino-pretty).
// Production: one JSON object per line, so hosting platforms can search and filter it.
export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.LOG_LEVEL,
  ...(env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss" },
    },
  }),
});
