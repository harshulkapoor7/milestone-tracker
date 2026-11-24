import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env";
import { logger } from "../logger";
import * as schema from "./schema";

// A pool keeps a few database connections open and lends them out per query,
// instead of opening a new connection (slow) for every request.
export const pool = new Pool({ connectionString: env.DATABASE_URL });

// If Postgres drops an idle connection (restart, network blip), the pool emits "error".
// Without a listener, Node treats that as unhandled and crashes the whole API.
// With one, the pool discards the dead connection and opens a new one next time.
pool.on("error", (err) => {
  logger.error({ err }, "Idle database connection lost");
});

export const db = drizzle({ client: pool, schema, casing: "snake_case" });
