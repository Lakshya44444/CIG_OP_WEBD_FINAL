import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    if (!user.verificationOTP || !user.otpExpiresAt) {
      return NextResponse.json({ error: "OTP not found or expired" }, { status: 400 });
    }

    if (new Date() > user.otpExpiresAt) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    if (user.verificationOTP !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Verify email
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationOTP: null,
        otpExpiresAt: null,
      },
    });

    return NextResponse.json({ message: "Email verified successfully!" }, { status: 200 });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
