import { sql } from "drizzle-orm";
import { db } from "../../db/client";

// Logic layer: knows nothing about HTTP.
export async function getHealth() {
  const database = await checkDatabase();
  return {
    status: database === "up" ? ("ok" as const) : ("degraded" as const),
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

// Smallest possible query: proves we can reach Postgres and it answers.
async function checkDatabase(): Promise<"up" | "down"> {
  try {
    await db.execute(sql`select 1`);
    return "up";
  } catch {
    return "down";
  }
}
