// Fills the database with a demo user (with a real password) and the 60-day plan.
// Safe to run again: it deletes the demo user first, and the cascade removes their old plan.
// Run with: npm run db:seed
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { logger } from "../logger";
import { db, pool } from "./client";
import { createSamplePlan } from "./sample-plan";
import { users } from "./schema";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./seed-data";

async function seed() {
  // A transaction: either every insert succeeds, or none of them are kept.
  await db.transaction(async (tx) => {
    await tx.delete(users).where(eq(users.email, DEMO_EMAIL));

    const [user] = await tx
      .insert(users)
      .values({ email: DEMO_EMAIL, passwordHash: await hash(DEMO_PASSWORD) })
      .returning();
    if (!user) throw new Error("Failed to create demo user");

    const counts = await createSamplePlan(tx, user.id);
    logger.info(
      `Seeded ${DEMO_EMAIL} (password: ${DEMO_PASSWORD}): 1 plan, ${counts.phases} phases, ${counts.days} days, ${counts.tasks} tasks`,
    );
  });
}

try {
  await seed();
} finally {
  await pool.end(); // close DB connections so the script can exit
}
