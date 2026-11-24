import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { LoginInput, RegisterInput } from "@milestone/shared";
import { db } from "../../db/client";
import { createSamplePlan } from "../../db/sample-plan";
import { users } from "../../db/schema";
import { AppError } from "../../lib/app-error";
import { createSession } from "./sessions";

// What we send back about a user: never the password hash.
const publicUser = (user: typeof users.$inferSelect) => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt,
});

export async function register(input: RegisterInput) {
  const passwordHash = await hash(input.password); // Argon2id, OWASP default settings

  try {
    // All or nothing: the user, their starter plan and their first session.
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ email: input.email, passwordHash })
        .returning();
      if (!user) throw new Error("Insert returned no user");

      await createSamplePlan(tx, user.id);
      const session = await createSession(user.id, tx);
      return { user: publicUser(user), session };
    });
  } catch (err) {
    // The unique index on users.email rejected a duplicate (Postgres code 23505).
    if (isUniqueViolation(err)) {
      throw new AppError(
        409,
        "EMAIL_TAKEN",
        "An account with this email already exists",
      );
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email));

  // Always run one Argon2 check, even when the email doesn't exist.
  // Otherwise "unknown email" answers in 1 ms and "wrong password" in 10 ms,
  // and an attacker could time responses to discover which emails have accounts.
  const valid = await checkPassword(
    user?.passwordHash ?? (await dummyHash()),
    input.password,
  );

  // Same message for both cases, for the same reason.
  if (!user || !valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Wrong email or password");
  }

  const session = await createSession(user.id);
  return { user: publicUser(user), session };
}

export async function getUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new AppError(401, "UNAUTHENTICATED", "Not logged in");
  return publicUser(user);
}

// verify() throws on a malformed hash (e.g. an old placeholder); treat that as "no".
async function checkPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Created once, on first use, then reused.
let dummy: Promise<string> | undefined;
const dummyHash = () => (dummy ??= hash("timing-equaliser"));

function isUniqueViolation(err: unknown): boolean {
  // Drizzle may wrap the driver's error, so look at it and at its `cause`.
  const code = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e ? e.code : undefined;
  const cause =
    typeof err === "object" && err !== null && "cause" in err
      ? err.cause
      : undefined;
  return code(err) === "23505" || code(cause) === "23505";
}
