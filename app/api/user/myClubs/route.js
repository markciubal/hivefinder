import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export async function GET(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) return NextResponse.json([]);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return NextResponse.json([]);
  }

  const userId = decoded.id;

  const memberships = await prisma.member.findMany({
    where: { userId: new ObjectId(userId) },
    include: { club: true }
  });

  return NextResponse.json(memberships);
}
