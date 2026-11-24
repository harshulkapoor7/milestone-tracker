import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { sessions } from "../../db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;
export const SESSION_DAYS = 30;

// The cookie holds a random token; the database holds only its SHA-256 hash.
// If the sessions table ever leaks, the hashes can't be used as cookies.
// (A fast hash is fine here, unlike passwords: the token is 256 random bits,
// so there's nothing to guess.)
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

// `tx` lets registration create the session inside its transaction.
export async function createSession(
  userId: string,
  tx: Pick<typeof db, "insert"> = db,
) {
  const token = randomBytes(32).toString("base64url"); // 256 bits of randomness
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await tx.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

// Looks up the session for a cookie token.
// - unknown or expired → null (expired ones are deleted)
// - in its second half of life → extended to a full 30 days again ("sliding"
//   expiry), so people who use the app regularly stay logged in.
export async function validateSession(token: string) {
  const id = hashToken(token);
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  const renew = session.expiresAt.getTime() - now < (SESSION_DAYS / 2) * DAY_MS;
  if (renew) {
    session.expiresAt = new Date(now + SESSION_DAYS * DAY_MS);
    await db
      .update(sessions)
      .set({ expiresAt: session.expiresAt })
      .where(eq(sessions.id, id));
  }
  return {
    userId: session.userId,
    expiresAt: session.expiresAt,
    renewed: renew,
  };
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}
