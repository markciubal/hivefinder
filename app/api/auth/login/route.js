import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cleanUsername } from '@/lib/username';
import { findByUsername } from '@/lib/findUser';

/**
 * Login by username. There is no email address to log in with any more.
 */
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const username = cleanUsername(body.username);
  const password = String(body.password ?? '');

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Enter your username and password' },
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

  const user = await findByUsername(username, {
    id: true,
    username: true,
    password: true,
    role: true,
  });

  // Same message either way: whether a username exists is not something an
  // unauthenticated caller gets to probe for.
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

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
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
}
