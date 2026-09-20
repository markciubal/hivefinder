// app/api/friends/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/apiAuth';
import { hiddenUserIds } from '@/lib/blocks';

/**
 * GET /api/friends - candidate students for Friend Finder.
 *
 * Auth is optional. With a valid token, anyone the caller blocked - or who
 * blocked the caller - is left out, so a block also takes people out of each
 * other's matches. Without a token nothing is filtered, which is only the
 * signed-out preview path.
 */
export async function GET(req) {
  try {
    const auth = requireUser(req);
    const hidden = auth.error ? new Set() : await hiddenUserIds(auth.userId);

    const users = await prisma.user.findMany({
      include: {
        memberships: {
          include: { club: true },
        },
      },
      take: 500,
    });

    const shaped = users
      .filter((u) => !hidden.has(u.id))
      .map((u) => ({
        id: u.id,
        username: u.username || u.email.split('@')[0],
        interests: u.interests || [],
        memberships: (u.memberships || []).map((m) => ({
          club: m.club?.name || '',
        })),
      }));

    return NextResponse.json(shaped);
  } catch (err) {
    console.error('FRIENDS ERROR:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
