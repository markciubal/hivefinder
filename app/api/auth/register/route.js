import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cleanUsername, usernameError } from '@/lib/username';

/**
 * Registration. Username and password, and nothing else.
 *
 * No email address is asked for or stored, so this is the only moment the
 * password exists in a form anyone can read. The signup page turns the
 * response into a "save these details" step; the password is never sent back
 * from here, because the client already has the one the person typed.
 *
 * Returns the same { token, user } shape as /api/auth/login so the client can
 * sign the person straight in (README FR1).
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = cleanUsername(body.username);
    const password = String(body.password ?? '');

    const badUsername = usernameError(username);
    if (badUsername) {
      return NextResponse.json({ error: badUsername }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Case-insensitively, so "Alice" cannot be registered against an existing
    // "alice" and then be typed either way at the login form by two different
    // people. The unique index is case-sensitive, so this check is what keeps
    // the two from coexisting.
    const existing = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'That username is taken' },
        { status: 400 }
      );
    }

    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET is not set - cannot issue a session.');
      return NextResponse.json(
        { error: 'Server auth is misconfigured.' },
        { status: 500 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'MEMBER',
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'User created',
      userId: user.id,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    // A unique-constraint violation here means someone registered the same
    // name between the check above and the write. Say the useful thing rather
    // than leaking a Prisma error.
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'That username is taken' },
        { status: 400 }
      );
    }
    // Never return err.message from here. An unreachable database made Prisma
    // throw a message carrying absolute server paths and lines of compiled
    // source, and this handed all of it to the browser. The detail belongs in
    // the server log; the caller gets something it can act on.
    console.error('SIGNUP ERROR:', err);

    const unreachable =
      err?.name === 'PrismaClientInitializationError' ||
      /Server selection timeout|Raw query failed|ECONNREFUSED/i.test(
        String(err?.message ?? '')
      );

    return NextResponse.json(
      {
        error: unreachable
          ? 'Cannot reach the database right now. Try again in a moment.'
          : 'Something went wrong creating your account.',
      },
      { status: 500 }
    );
  }
}
