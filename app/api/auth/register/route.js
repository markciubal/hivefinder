import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, email, password, interests, contactMethods } = await req.json();

    // basic checks
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing fields' },
        { status: 400 }
      );
    }

    // check duplicates
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedInterests = Array.isArray(interests)
      ? interests
          .map((value) => String(value).trim())
          .filter(Boolean)
      : [];

    const normalizeContactMethods = (rawMethods = []) => {
      if (!Array.isArray(rawMethods)) return [];

      const allowed = new Set(["EMAIL", "PHONE", "DISCORD", "OTHER"]);
      const normalized = [];
      const seen = new Set();
      let preferredIndex = -1;

      for (const raw of rawMethods) {
        if (!raw) continue;
        const type = String(raw.type || "").trim().toUpperCase();
        if (!allowed.has(type)) continue;

        const value = String(raw.value || "").trim();
        if (!value) continue;

        const label =
          type === "OTHER" ? String(raw.label || "").trim() : null;
        if (type === "OTHER" && !label) continue;

        const visible = raw.visible === false ? false : true;
        const preferred = Boolean(raw.preferred);
        const key = `${type}:${value.toLowerCase()}:${label || ""}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (preferred && preferredIndex === -1) {
          preferredIndex = normalized.length;
        }

        normalized.push({
          type,
          value,
          label: label || null,
          visible,
          preferred: false,
        });
      }

      if (preferredIndex >= 0 && normalized[preferredIndex]) {
        normalized[preferredIndex].preferred = true;
      }

      return normalized;
    };

    const normalizedContactMethods = normalizeContactMethods(contactMethods);

    // create user in Prisma (MongoDB collection: User)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        interests: normalizedInterests,
        ...(normalizedContactMethods.length
          ? { contactMethods: { createMany: { data: normalizedContactMethods } } }
          : {}),
        role: 'MEMBER'  // optional, but ensures consistency
      }
    });

    return NextResponse.json({
      message: 'User created',
      userId: user.id
    });

  } catch (err) {
    // LOG THE REAL ERROR
    console.error("SIGNUP ERROR:", err);

    return NextResponse.json(
      { error: err.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
