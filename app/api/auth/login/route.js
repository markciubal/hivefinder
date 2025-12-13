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

  // find user
  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
      role: true
    }
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // check password
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // create JWT
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: '7d' }
  );

  // 🔥 DEBUG LINE — prints token to terminal
  console.log("LOGIN TOKEN:", token);

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}
