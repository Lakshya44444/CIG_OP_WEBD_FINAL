"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Camera, Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
      } else if (data.isDev && data.devResetUrl) {
        // Dev mode — show link directly since email not configured
        setDevLink(data.devResetUrl);
        setSent(true);
      } else {
        setSent(true);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="relative h-10 w-10 rounded-[10px] overflow-hidden shadow-lg shadow-violet-500/30">
              <div className="absolute inset-0 bg-linear-to-br from-violet-500 via-blue-500 to-cyan-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900">Pixora</span>
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {sent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              {devLink ? (
                /* Dev mode — email not configured, show link */
                <div className="space-y-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Dev Mode — Click to reset</h2>
                    <p className="text-gray-500 text-xs mt-1">Email not configured. Use this link directly:</p>
                  </div>
                  <a
                    href={devLink}
                    className="block w-full rounded-lg bg-blue-600 text-white py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Open Reset Link →
                  </a>
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    To enable email sending, add <code className="font-mono">EMAIL_USER</code> and <code className="font-mono">EMAIL_PASS</code> to your .env file.
                  </p>
                </div>
              ) : (
                /* Production — email sent */
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Check your email</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      We sent a reset link to <strong>{email}</strong>
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Didn&apos;t receive it?{" "}
                    <button onClick={() => setSent(false)} className="text-blue-600 hover:underline">
                      Try again
                    </button>
                  </p>
                </div>
              )}
              <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Forgot password?</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email address</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
