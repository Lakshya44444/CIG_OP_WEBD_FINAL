import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function generateResetToken(userId: string): string {
  return jwt.sign(
    { userId, purpose: "password-reset" },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: "1h" }
  );
}

export function verifyResetToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
      userId: string;
      purpose: string;
    };
    if (payload.purpose !== "password-reset") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Inter, Arial, sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6, #2563eb); padding: 32px 32px 24px; text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 8px;">
              📸
            </div>
            <span style="font-size: 22px; font-weight: 900; color: white; letter-spacing: -0.5px;">Pixora</span>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px;">
            Reset your password
          </h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Hi <strong>${name}</strong>, we received a request to reset the password
            for your Pixora account. Click the button below to set a new password.
          </p>

          <a href="${resetUrl}"
             style="display: block; text-align: center; background: linear-gradient(135deg, #8b5cf6, #2563eb);
                    color: white; padding: 14px 32px; border-radius: 12px; font-weight: 700;
                    font-size: 15px; text-decoration: none; margin-bottom: 24px;">
            Reset Password
          </a>

          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0 0 8px;">
            This link expires in <strong>1 hour</strong>.
          </p>
          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
            If you didn&apos;t request this, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f3f4f6; padding: 16px 32px; text-align: center;">
          <p style="color: #d1d5db; font-size: 12px; margin: 0;">
            Pixora · Event & Media Management Platform
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Pixora" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Pixora password",
    html,
  });
}

export async function sendOTPEmail(to: string, otp: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Inter, Arial, sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 32px 32px 24px; text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 8px;">
              📸
            </div>
            <span style="font-size: 22px; font-weight: 900; color: white; letter-spacing: -0.5px;">Pixora</span>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px;">
            Verify your email
          </h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Hi <strong>${name}</strong>, welcome to Pixora! Use the verification code below to confirm your email address.
          </p>

          <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1f2937; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>

          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0 0 8px;">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
            If you didn&apos;t sign up for Pixora, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f3f4f6; padding: 16px 32px; text-align: center;">
          <p style="color: #d1d5db; font-size: 12px; margin: 0;">
            Pixora · Event & Media Management Platform
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Pixora" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Pixora - Email Verification Code",
    html,
  });
}
