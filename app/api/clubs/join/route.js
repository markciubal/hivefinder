import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export async function POST(req) {
  console.log("JOIN EXECUTING");

  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  if (!clubId) return NextResponse.json({ error: "no clubId" }, { status: 400 });

  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (!token) return NextResponse.json({ error: "no token" }, { status: 401 });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return NextResponse.json({ error: "bad token" }, { status: 401 });
  }

  const userId = decoded.id;

  try {
    const result = await prisma.member.create({
      data: {
        userId: new ObjectId(userId),
        clubId: new ObjectId(clubId),
      }
    });

    console.log("DB INSERT SUCCESS:", result);
    return NextResponse.json({ joined: true });

  } catch (err) {
    console.log("DB INSERT ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
