// app/api/clubs/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function DELETE(req, { params }) {
  const { id } = params; // Prisma Club.id is a String @db.ObjectId

  if (!id) {
    return NextResponse.json(
      { error: "Missing club id" },
      { status: 400 }
    );
  }

  try {
    // Read token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch (err) {
      console.error("JWT verify error in DELETE /api/clubs/[id]:", err);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // MUST be SUPERUSER
    if (decoded.role !== "SUPERUSER") {
      return NextResponse.json(
        { error: "Forbidden – superuser only" },
        { status: 403 }
      );
    }

    // Optionally check that club exists
    const club = await prisma.club.findUnique({
      where: { id },
    });

    if (!club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Clean up related records (if you care about referential integrity)
    await prisma.member.deleteMany({
      where: { clubId: id },
    });

    await prisma.clubModerator.deleteMany({
      where: { clubId: id },
    });

    // Delete the club itself
    await prisma.club.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, id },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in DELETE /api/clubs/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
