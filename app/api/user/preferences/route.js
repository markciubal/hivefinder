import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";

/**
 * The caller's own preferences.
 *
 * Deliberately narrow: only settings that change what other people can see.
 * Profile editing belongs on /api/user/me, which does not exist yet.
 */

function shape(user) {
  return { shareLocation: Boolean(user?.shareLocation) };
}

export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { shareLocation: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unknown user." }, { status: 404 });
    }

    return NextResponse.json(shape(user));
  } catch (err) {
    console.error("PREFERENCES GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PATCH /api/user/preferences  { shareLocation?: boolean } */
export async function PATCH(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const data = {};

    if (body.shareLocation !== undefined) {
      if (typeof body.shareLocation !== "boolean") {
        return NextResponse.json(
          { error: "shareLocation must be true or false." },
          { status: 400 }
        );
      }
      data.shareLocation = body.shareLocation;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data,
      select: { shareLocation: true },
    });

    return NextResponse.json(shape(user));
  } catch (err) {
    console.error("PREFERENCES PATCH ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
