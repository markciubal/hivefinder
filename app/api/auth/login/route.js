import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const { username, password } = await req.json();
  if (!username || !password)
    return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { username } });
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  // Issue a JWT for frontend clientAuth
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.NEXTAUTH_SECRET, { expiresIn: '7d' });

  return NextResponse.json({ token, user: { id: user.id, username: user.username, email: user.email } });
}
