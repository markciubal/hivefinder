import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";
import interestsList from "@/utilities/interests.json";

/**
 * The caller's own profile.
 *
 * /account and Friend Finder have both been calling this route since before it
 * existed, which is why the account page never loaded and self-matching in
 * Friend Finder always fell back to an empty interest list.
 *
 * Preferences that change what OTHER people see (location sharing, theme) live
 * on /api/user/preferences. This route is the profile only.
 */

/** Only interests from the canonical list, so the match axis stays clean. */
const KNOWN_INTERESTS = new Map(
  interestsList.map((i) => [i.toLowerCase(), i])
);

function shape(user) {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    about: user.about || "",
    interests: user.interests || [],
    role: user.role,
    // Friend Finder compares these against other students' memberships, which
    // /api/friends returns in exactly this shape. Keep them identical or
    // self-matching silently finds nothing.
    memberships: (user.memberships || [])
      .map((m) => ({ club: m.club?.name || "" }))
      .filter((m) => m.club),
  };
}

const INCLUDE = {
  memberships: { include: { club: { select: { name: true } } } },
};

export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: INCLUDE,
    });

    if (!user) {
      return NextResponse.json({ error: "Unknown user." }, { status: 404 });
    }

    return NextResponse.json(shape(user));
  } catch (err) {
    console.error("USER ME GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PUT /api/user/me
 *
 * Username and role are deliberately not editable here. Username is now the
 * login credential as well as the handle other people see, so changing it is a
 * credentials operation and not a profile edit; role is an authorization field
 * and must never be writable by its own holder.
 */
export async function PUT(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const data = {};

    if (body.firstName !== undefined) {
      data.firstName = String(body.firstName).trim().slice(0, 100) || null;
    }
    if (body.lastName !== undefined) {
      data.lastName = String(body.lastName).trim().slice(0, 100) || null;
    }
    if (body.about !== undefined) {
      data.about = String(body.about).trim().slice(0, 2000) || null;
    }

    // An `email` in the body is ignored rather than rejected: HiveFinder no
    // longer has anywhere to put one, and a client still sending it should not
    // be stopped from saving the fields that do exist.

    if (body.interests !== undefined) {
      if (!Array.isArray(body.interests)) {
        return NextResponse.json(
          { error: "Interests must be a list." },
          { status: 400 }
        );
      }
      // Map through the canonical list: unknown values are dropped rather than
      // rejected, so a stale client cannot lock someone out of saving.
      const cleaned = [
        ...new Set(
          body.interests
            .map((i) => KNOWN_INTERESTS.get(String(i).trim().toLowerCase()))
            .filter(Boolean)
        ),
      ];
      data.interests = cleaned;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data,
      include: INCLUDE,
    });

    return NextResponse.json(shape(user));
  } catch (err) {
    console.error("USER ME PUT ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
