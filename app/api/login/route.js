import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password required" }, { status: 400 });
    }

    // Find user by email (or name, depending on what 'username' means)
    const user = await prisma.user.findUnique({
      where: { email: username }, // change to name: username if you allow login by name
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password || "");
    if (!valid) {
      return NextResponse.json({ message: "Incorrect password" }, { status: 401 });
    }

    // Return success and optionally user info
    return NextResponse.json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
