import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { validate, registerSchema } from "@/lib/validations";
import { sendOTPEmail } from "@/lib/email";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = validate(registerSchema, body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const { name, username, email, password } = data!;

    const existing = await db.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] },
    });

    if (existing) {
      const field = existing.email === email.toLowerCase() ? "email" : "username";
      return NextResponse.json({ error: `This ${field} is already taken` }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await db.user.create({
      data: {
        name: name.trim(),
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        role: "VIEWER",
        verificationOTP: otp,
        otpExpiresAt,
      },
      select: { id: true, name: true, email: true, username: true, role: true, emailVerified: true },
    });

    try {
      await sendOTPEmail(email.toLowerCase(), otp, name);
    } catch (err) {
      console.error("Failed to send OTP email:", err);
    }

    return NextResponse.json({
      user,
      message: "Account created! Check your email for OTP verification code.",
    }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
