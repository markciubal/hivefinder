// app/api/friends/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { friendFinderSampleFriends } from '@/lib/friendFinderSampleData';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const demoParam = requestUrl.searchParams.get('demo');
  if (demoParam === '1' || demoParam === 'true') {
    return NextResponse.json(friendFinderSampleFriends);
  }

  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: { club: true },
      },
    },
    take: 500,
  });

  const shaped = users.map((u) => ({
    id: u.id,
    username: u.username || u.email.split('@')[0],
    interests: u.interests || [], // from schema, can be empty until account page UI
    memberships: (u.memberships || []).map((m) => ({
      club: m.club?.name || '',
    })),
  }));

  return NextResponse.json(shaped);
}
