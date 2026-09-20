import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";
import {
  DEFAULT_THEME,
  THEMES,
  isReadableAsPrimary,
  normalizeHex,
} from "@/app/lib/themes";

/**
 * The caller's own preferences: how the app looks to them, and what other
 * people can see. Profile fields live on /api/user/me.
 */

function shape(user) {
  return {
    shareLocation: Boolean(user?.shareLocation),
    theme: user?.theme || DEFAULT_THEME,
    accent: user?.accent || null,
  };
}

const SELECT = { shareLocation: true, theme: true, accent: true };

export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: SELECT,
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

/**
 * PATCH /api/user/preferences
 *   { shareLocation?: boolean, theme?: string, accent?: string | null }
 */
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

    if (body.theme !== undefined) {
      if (!Object.prototype.hasOwnProperty.call(THEMES, body.theme)) {
        return NextResponse.json({ error: "Unknown theme." }, { status: 400 });
      }
      data.theme = body.theme;
    }

    if (body.accent !== undefined) {
      if (body.accent === null || body.accent === "") {
        data.accent = null;
      } else {
        const hex = normalizeHex(body.accent);
        if (!hex) {
          return NextResponse.json(
            { error: "That is not a valid colour." },
            { status: 400 }
          );
        }
        // Refused rather than stored-and-ignored: someone who picks pale
        // yellow should be told their buttons would be unreadable, not left
        // wondering why the colour did not take.
        if (!isReadableAsPrimary(hex)) {
          return NextResponse.json(
            {
              error:
                "That colour is too light for white button text. Pick a darker shade.",
            },
            { status: 400 }
          );
        }
        data.accent = hex;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data,
      select: SELECT,
    });

    return NextResponse.json(shape(user));
  } catch (err) {
    console.error("PREFERENCES PATCH ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
