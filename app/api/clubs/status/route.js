import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req) {
  console.log("STATUS ROUTE EXECUTING");

  // 🔥 Extract search params correctly
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  console.log("CLUB ID:", clubId);

  if (!clubId) {
    return NextResponse.json({ member: false });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return NextResponse.json({ member: false });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return NextResponse.json({ member: false });
  }

  const userId = decoded.id;
  console.log("USER ID:", userId);

  const found = await prisma.member.findFirst({
    where: { userId, clubId }
  });

  return NextResponse.json({ member: !!found });
}
