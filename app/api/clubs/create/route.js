import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, categories, fieldsOfStudy, points, clubUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 });
    }

    // Read token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid or missing token" }, { status: 401 });
    }

    const userId = decoded.id;

    // Create club
    const newClub = await prisma.club.create({
      data: {
        name,
        description,
        categories,
        fieldsOfStudy,
        points: points ? Number(points) : null,
        clubUrl: clubUrl || null,
        createdBy: new ObjectId(userId),
      },
    });

    // Make creator a moderator
    await prisma.clubModerator.create({
      data: {
        userId: new ObjectId(userId),
        clubId: new ObjectId(newClub.id),
      },
    });

    return NextResponse.json({ success: true, club: newClub });

  } catch (err) {
    console.error("CREATE CLUB ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
