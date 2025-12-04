// app/api/clubs/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const admin = searchParams.get("admin") === "1";

  // ADMIN MODE: only if ?admin=1 is present
  if (admin) {
    try {
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
        console.error("JWT verify error in /api/clubs?admin=1:", err);
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }

      // role must be SUPERUSER (we added role to the login JWT earlier)
      if (decoded.role !== "SUPERUSER") {
        return NextResponse.json(
          { error: "Forbidden – superuser only" },
          { status: 403 }
        );
      }

      const clubs = await prisma.club.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        include: {
          _count: {
            select: {
              members: true,
              moderators: true,
            },
          },
        },
        orderBy: { name: "asc" },
        take: 500,
      });

      return NextResponse.json(clubs, { status: 200 });
    } catch (err) {
      console.error("Error in /api/clubs admin branch:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }

  // PUBLIC MODE: existing behavior, untouched
  const clubs = await prisma.club.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { name: "asc" },
    take: 500,
  });

  return NextResponse.json(clubs);
}
