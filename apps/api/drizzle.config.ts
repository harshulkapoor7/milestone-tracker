import { defineConfig } from "drizzle-kit";

// drizzle-kit is a separate CLI, so it loads the root .env itself.
// Only a missing .env is OK (e.g. in CI, where real env vars are set instead).
// Any other error (like an old Node without loadEnvFile) must be shown, not hidden.
try {
  process.loadEnvFile("../../.env");
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle", // generated SQL migrations live here and are committed
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL },
});
