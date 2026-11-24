// Runs ONCE before all tests: make sure the test database exists and is migrated.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

export default async function globalSetup() {
  const testUrl = process.env.TEST_DATABASE_URL;
  const devUrl = process.env.DATABASE_URL;
  if (!testUrl || !devUrl) throw new Error("Database URLs not set");

  // 1. Create the test database if it doesn't exist yet.
  //    (You can't create a database while connected to it, so connect to the dev one.)
  const testDbName = new URL(testUrl).pathname.slice(1);
  const admin = new Client({ connectionString: devUrl });
  await admin.connect();
  const { rowCount } = await admin.query(
    "select 1 from pg_database where datname = $1",
    [testDbName],
  );
  if (!rowCount) await admin.query(`create database "${testDbName}"`);
  await admin.end();

  // 2. Apply the same migrations as dev/production, so the schema always matches.
  const client = new Client({ connectionString: testUrl });
  await client.connect();
  await migrate(drizzle({ client }), { migrationsFolder: "./drizzle" });
  await client.end();
}
