import { defineConfig } from "drizzle-kit";

// drizzle-kit is a separate CLI, so it loads the root .env itself.
try {
  process.loadEnvFile("../../.env");
} catch {
  // No .env file (e.g. in CI): rely on real environment variables.
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
