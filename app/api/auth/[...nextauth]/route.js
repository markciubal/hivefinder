import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

// Reuse Prisma client across hot reloads in dev
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

/**
 * POST handler for signup (existing functionality)
 */
export async function POST(req) {
  try {
    const { email, password, selectedClub, interests } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });
    }

    if (!email.endsWith("@csus.edu")) {
      return NextResponse.json({ message: "Only CSUS email accounts allowed" }, { status: 400 });
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split("@")[0],
      },
    });

    // If a club is selected, attempt to create membership
    if (selectedClub) {
      const club = await prisma.club.findUnique({ where: { name: selectedClub } });
      if (club) {
        await prisma.member.create({
          data: {
            userId: user.id,
            clubId: club.id,
          },
        });
      } else {
        console.log(`Club "${selectedClub}" not found. Skipping membership creation.`);
      }
    }

    console.log("User created:", user);
    return NextResponse.json({ message: "User created", user }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ message: "Server error: " + err.message }, { status: 500 });
  }
}

/**
 * Export NextAuth handler for login functionality
 */
export const authHandler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        if (!email || !password) throw new Error("Email and password required");
        if (!email.endsWith("@csus.edu")) throw new Error("Only CSUS email accounts allowed");

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("No user found with this email");

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return user; // returned object becomes session.user
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { authHandler as GET, authHandler as POST };
