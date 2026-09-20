import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const KINDS = ["OFFICIAL", "HIVE"];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const kind = searchParams.get("kind");

    // /clubPage asks for OFFICIAL, /hives asks for HIVE. No kind = everything,
    // which /clubAdmin and search rely on.
    const where = {};

    if (kind && KINDS.includes(kind)) {
      where.kind = kind;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const clubs = await prisma.club.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clubs);
  } catch (err) {
    console.error("CLUB LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
