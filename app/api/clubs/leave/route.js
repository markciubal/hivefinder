import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export async function POST(req) {

  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (!token) return NextResponse.json({ error: "no token" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return NextResponse.json({ error: "bad token" });
  }

  const userId = decoded.id;

  try {
    const result = await prisma.member.deleteMany({
      where: {
        userId: new ObjectId(userId),
        clubId: new ObjectId(clubId)
      }
    });

    console.log("DELETE RESULT:", result);
    return NextResponse.json({ left: true });

  } catch (err) {
    console.log("DELETE ERROR:", err);
    return NextResponse.json({ error: err.message });
  }
}
