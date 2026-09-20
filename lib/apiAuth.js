import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { prisma } from "@/lib/prisma";

/**
 * Server-side authorisation helpers.
 *
 * Every route used to re-implement the same `jwt.verify(...)` block with
 * slightly different error shapes. Centralising it means one place to change
 * when auth moves off localStorage tokens, and one definition of what an
 * officer or moderator is allowed to do.
 *
 * Each helper returns either `{ error: NextResponse }` or the thing you asked
 * for. Callers do:
 *
 *   const auth = await requireUser(req);
 *   if (auth.error) return auth.error;
 *   // auth.userId, auth.claims
 */

const unauthorized = (msg = "You need to be signed in.") =>
  NextResponse.json({ error: msg }, { status: 401 });

const forbidden = (msg = "You do not have permission to do that.") =>
  NextResponse.json({ error: msg }, { status: 403 });

/** Verify the bearer token. Does not hit the database. */
export function requireUser(req) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) return { error: unauthorized() };

  if (!process.env.NEXTAUTH_SECRET) {
    // Failing closed matters here: without a secret, jwt.verify would throw
    // anyway, but an explicit 500 is far easier to diagnose than a 401 storm.
    console.error("NEXTAUTH_SECRET is not set - cannot verify tokens.");
    return {
      error: NextResponse.json(
        { error: "Server auth is misconfigured." },
        { status: 500 }
      ),
    };
  }

  try {
    const claims = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    if (!claims?.id) return { error: unauthorized("Malformed token.") };
    return { userId: String(claims.id), claims };
  } catch {
    return { error: unauthorized("Your session has expired.") };
  }
}

/** Site-wide moderator or superuser. */
export function requireModerator(req) {
  const auth = requireUser(req);
  if (auth.error) return auth;

  const role = auth.claims?.role;
  if (role !== "SUPERUSER" && role !== "MODERATOR") {
    return { error: forbidden("Moderators only.") };
  }
  return auth;
}

/**
 * Officer of a specific club (or a site moderator, who can act anywhere).
 *
 * The club role lives on the Member row, so this needs a database read - the
 * JWT only carries the site-wide role and would go stale the moment someone is
 * promoted.
 */
export async function requireClubOfficer(req, clubId) {
  const auth = requireUser(req);
  if (auth.error) return auth;

  if (!isObjectId(clubId)) {
    return { error: NextResponse.json({ error: "Unknown club." }, { status: 400 }) };
  }

  // Site moderators bypass the per-club check.
  const siteRole = auth.claims?.role;
  if (siteRole === "SUPERUSER" || siteRole === "MODERATOR") {
    return { ...auth, membership: null, isSiteModerator: true };
  }

  const membership = await prisma.member.findFirst({
    where: { clubId, userId: auth.userId },
  });

  if (!membership || membership.role !== "OFFICER") {
    return { error: forbidden("Only officers of this club can do that.") };
  }

  return { ...auth, membership, isSiteModerator: false };
}

/** Guard against passing a malformed id to Mongo, which throws. */
export function isObjectId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export function toObjectId(value) {
  return new ObjectId(value);
}

/**
 * Create notifications, skipping the actor's own.
 *
 * Nobody wants to be told about a thing they just did, and every caller was
 * about to write the same filter.
 */
export async function notify(userIds, payload, { exclude } = {}) {
  const targets = [...new Set(userIds.map(String))].filter(
    (id) => id !== String(exclude) && isObjectId(id)
  );

  if (targets.length === 0) return 0;

  await prisma.notification.createMany({
    data: targets.map((userId) => ({ userId, ...payload })),
  });

  return targets.length;
}

export { unauthorized, forbidden };
