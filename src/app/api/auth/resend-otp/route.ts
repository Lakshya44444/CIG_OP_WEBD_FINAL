import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOTPEmail } from "@/lib/email";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
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

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.user.update({
      where: { id: user.id },
      data: {
        verificationOTP: otp,
        otpExpiresAt,
      },
    });

    // Send OTP email (non-blocking)
    await sendOTPEmail(email.toLowerCase(), otp, user.name).catch((err) => {
      console.error("Failed to send OTP email:", err);
    });

    return NextResponse.json({ message: "OTP sent to your email" }, { status: 200 });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
