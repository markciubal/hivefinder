import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Missing email or password' },
      { status: 400 }
    );
  }

  // Look up by email instead of username
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: '7d' }
  );

  return NextResponse.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
}
