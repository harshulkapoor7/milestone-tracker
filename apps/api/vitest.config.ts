import { defineConfig } from "vitest/config";

// Tests use their own database: same Postgres, name + "_test".
// Your dev data (milestone_tracker) is never touched by tests.
try {
  process.loadEnvFile("../../.env");
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}

const devUrl = process.env.DATABASE_URL;
if (!devUrl) throw new Error("DATABASE_URL is not set");

const testUrl = new URL(devUrl);
testUrl.pathname = `${testUrl.pathname}_test`;

// Read by test/global-setup.ts (runs once, in this same process).
process.env.TEST_DATABASE_URL = testUrl.toString();

export default defineConfig({
  test: {
    env: { NODE_ENV: "test", DATABASE_URL: testUrl.toString() },
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    // All test files share one database, so run them one file at a time.
    fileParallelism: false,
  },
});
