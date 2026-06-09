"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    if (!email) {
      router.push("/register");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, router]);

  const handleResendOTP = async () => {
    setResending(true);
    setError("");
    try {
      await axios.post("/api/auth/resend-otp", { email });
      setTimeLeft(600);
      setOtp("");
      alert("OTP has been resent to your email!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!otp.trim() || otp.length !== 6) {
        setError("Please enter a 6-digit OTP");
        setLoading(false);
        return;
      }

      await axios.post("/api/auth/verify-otp", {
        email: email?.toLowerCase(),
        otp: otp.trim(),
      });

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📸</div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Email</h1>
          <p className="text-gray-600 mt-2">We sent a verification code to</p>
          <p className="font-medium text-gray-900">{email}</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-6">
            <p className="text-green-700 font-medium">✓ Email verified successfully!</p>
            <p className="text-green-600 text-sm mt-1">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleVerify} className="space-y-4 mb-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>
            </form>

            <div className="text-center text-sm text-gray-600">
              Code expires in:{" "}
              <span className="font-medium">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>

            <div className="text-center text-sm text-gray-600 mt-4">
              <p>
                Didn&apos;t receive code?{" "}
                <button
                  onClick={handleResendOTP}
                  disabled={resending || timeLeft > 0}
                  className="text-blue-600 hover:underline font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resending ? "Resending..." : "Resend OTP"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading…</p></div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
