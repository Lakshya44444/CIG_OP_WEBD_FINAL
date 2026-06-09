import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateResetToken } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true },
    });

    // Always return success to not reveal if email exists
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    const token = generateResetToken(user.id);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS &&
      process.env.EMAIL_USER !== "your-gmail@gmail.com");

    if (emailConfigured) {
      // Send real email
      try {
        const { sendPasswordResetEmail } = await import("@/lib/email");
        await sendPasswordResetEmail(user.email, user.name, token);
        return NextResponse.json({ message: "Reset link sent to your email." });
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
        // Fall through to dev mode below
      }
    }

    // Dev mode / email not configured — return the link directly
    return NextResponse.json({
      message: "Email not configured. Use the link below (dev mode only).",
      devResetUrl: resetUrl,
      isDev: true,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Forgot password error:", msg);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
