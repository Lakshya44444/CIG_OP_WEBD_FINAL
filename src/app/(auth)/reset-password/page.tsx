"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Invalid link</h2>
          <p className="text-gray-500 text-sm mt-1">This reset link is missing or invalid.</p>
        </div>
        <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed");
      } else {
        setDone(true);
        toast.success("Password updated!");
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Password updated!</h2>
          <p className="text-gray-500 text-sm mt-1">Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Set new password</h1>
        <p className="text-gray-500 text-sm mt-1">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">New password</label>
          <div className="relative">
            <Input
              type={showPwd ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              className="pr-10"
              required
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Confirm password</label>
          <Input
            type="password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 rounded-lg" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
