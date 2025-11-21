import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendResetEmail } from "@/lib/mailer";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });

    // Do not reveal existence
    if (!user) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(20).toString("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        resetLastSent: new Date(),
      },
    });

    await sendResetEmail(email, token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[forgot-password]", e);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
