import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyResetToken } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const payload = verifyResetToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Also mark email as verified — clicking reset link proves email ownership
    await db.user.update({
      where: { id: payload.userId },
      data: {
        passwordHash,
        emailVerified: true,
        verificationOTP: null,
        otpExpiresAt: null,
      },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
