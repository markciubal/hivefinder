import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

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
    });

    return NextResponse.json(clubs);
  } catch (err) {
    console.error("CLUB LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
