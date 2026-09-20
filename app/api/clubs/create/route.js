import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { reservedClubName } from "@/lib/reservedNames";

/**
 * Host fragments that would let a student-made hive pass itself off as the
 * university's own listing. Duplicated from app/lib/clubKind.js rather than
 * imported so this route has no dependency on client-side code.
 */
const CAMPUS_HOSTS = ["csus.campusgroups.com", "campusgroups.com", "csus.edu"];

function isCampusDirectoryUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return CAMPUS_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, categories, fieldsOfStudy, clubUrl } = body;

    if (!name || !normalizeName(name)) {
      return NextResponse.json(
        { error: "A name is required" },
        { status: 400 }
      );
    }

    // Read token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return NextResponse.json(
        { error: "Invalid or missing token" },
        { status: 401 }
      );
    }

    const userId = decoded.id;
    const wanted = normalizeName(name);

    // --- Guard 1: never let a hive take an official club's name. ------------
    // Read from utilities/clubs.json, not the database. Official clubs are no
    // longer seeded, so querying Club rows for kind OFFICIAL would always come
    // back empty and this check would pass everything.
    const officialClash = reservedClubName(name);
    if (officialClash) {
      return NextResponse.json(
        {
          error:
            `"${officialClash}" is an official Sacramento State club, so a hive ` +
            `cannot use that name. Find it on CampusGroups — otherwise pick a ` +
            `name of your own.`,
        },
        { status: 409 }
      );
    }

    // --- Guard 2: no duplicate hives either (README NFR4). ------------------
    const collisions = await prisma.club.findMany({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true, name: true },
    });

    if (collisions.some((c) => normalizeName(c.name) === wanted)) {
      return NextResponse.json(
        { error: `A hive called "${name}" already exists.` },
        { status: 409 }
      );
    }

    // --- Guard 3: a hive may not link to the campus directory. -------------
    // Otherwise a hive can borrow an official club's page and read as real.
    if (clubUrl && isCampusDirectoryUrl(clubUrl)) {
      return NextResponse.json(
        {
          error:
            "A hive cannot use a csus.edu or CampusGroups link — those belong to " +
            "official clubs. Link to your own page instead.",
        },
        { status: 400 }
      );
    }

    const newClub = await prisma.club.create({
      data: {
        // Forced, never read from the request body. Nothing creates OFFICIAL
        // clubs any more - they live on CampusGroups - so every club this app
        // holds is a hive.
        kind: "HIVE",
        name: String(name).trim(),
        description,
        categories,
        fieldsOfStudy,
        // `points` is deliberately ignored. It drives the default sort on the
        // browse page, so accepting a client value let anyone rank themselves
        // to the top. Points are awarded, not self-declared.
        points: null,
        clubUrl: clubUrl || null,
        createdBy: new ObjectId(userId),
      },
    });

    // The creator joins as an OFFICER. This used to write a separate
    // ClubModerator row, which meant "is a member" and "runs the club" were
    // two records that could disagree - officership now lives on Member.role.
    await prisma.member.create({
      data: {
        userId: new ObjectId(userId),
        clubId: new ObjectId(newClub.id),
        role: "OFFICER",
      },
    });

    return NextResponse.json({ success: true, club: newClub });
  } catch (err) {
    console.error("CREATE HIVE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
