import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const CONTACT_TYPES = new Set(["EMAIL", "PHONE", "DISCORD", "OTHER"]);

function getUserIdFromRequest(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

function formatUser(user) {
  return {
    ...user,
    username: user.username || user.email.split("@")[0],
  };
}

function validateContactValue(type, value) {
  if (type === "EMAIL") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Invalid email address.";
  }
  if (type === "PHONE") {
    const phoneRegex = /^[+()\d\s.-]{7,}$/;
    if (!phoneRegex.test(value)) return "Invalid phone number.";
  }
  if (type === "DISCORD") {
    if (value.length < 2) return "Invalid Discord handle.";
  }
  return null;
}

function normalizeContactMethods(rawMethods = []) {
  if (!Array.isArray(rawMethods)) return { methods: null, error: null };

  const normalized = [];
  const seen = new Set();
  let preferredIndex = -1;

  for (const raw of rawMethods) {
    if (!raw) continue;
    const type = String(raw.type || "").trim().toUpperCase();
    if (!CONTACT_TYPES.has(type)) continue;

    const value = String(raw.value || "").trim();
    if (!value) continue;

    const label =
      type === "OTHER" ? String(raw.label || "").trim() : null;
    if (type === "OTHER" && !label) {
      return { methods: null, error: "Other contact methods require a label." };
    }

    const validationError = validateContactValue(type, value);
    if (validationError) {
      return { methods: null, error: validationError };
    }

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

  return { methods: normalized, error: null };
}

export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      about: true,
      interests: true,
      contactMethods: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(formatUser(user));
}

export async function PUT(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    email,
    firstName,
    lastName,
    about,
    interests,
    contactMethods,
  } = body || {};

  if (typeof email === "string" && !email.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const updateData = {};

  if (typeof email === "string") {
    updateData.email = email.trim().toLowerCase();
  }
  if (typeof firstName === "string") {
    updateData.firstName = firstName.trim() || null;
  }
  if (typeof lastName === "string") {
    updateData.lastName = lastName.trim() || null;
  }
  if (typeof about === "string") {
    updateData.about = about.trim() || null;
  }
  if (Array.isArray(interests)) {
    updateData.interests = interests
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  try {
    const { methods: normalizedContactMethods, error: contactError } =
      normalizeContactMethods(contactMethods);

    if (contactError) {
      return NextResponse.json({ error: contactError }, { status: 400 });
    }

    const operations = [];
    if (Object.keys(updateData).length > 0) {
      operations.push(
        prisma.user.update({
          where: { id: userId },
          data: updateData,
        })
      );
    }

    if (Array.isArray(contactMethods)) {
      operations.push(
        prisma.contactMethod.deleteMany({
          where: { userId },
        })
      );

      if (normalizedContactMethods.length > 0) {
        operations.push(
          prisma.contactMethod.createMany({
            data: normalizedContactMethods.map((method) => ({
              ...method,
              userId,
            })),
          })
        );
      }
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        about: true,
        interests: true,
        contactMethods: true,
        role: true,
      },
    });

    return NextResponse.json(formatUser(user));
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    console.error("[user/me PUT]", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$transaction([
      prisma.contactMethod.deleteMany({ where: { userId } }),
      prisma.interestSubmission.deleteMany({ where: { userId } }),
      prisma.member.deleteMany({ where: { userId } }),
      prisma.clubModerator.deleteMany({ where: { userId } }),
      prisma.friendship.deleteMany({
        where: {
          OR: [{ requesterId: userId }, { recipientId: userId }],
        },
      }),
      prisma.club.updateMany({
        where: { createdBy: userId },
        data: { createdBy: null },
      }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[user/me DELETE]", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
