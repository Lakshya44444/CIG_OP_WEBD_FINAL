import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/events", "/upload", "/profile", "/ai", "/search", "/admin", "/media", "/notifications"];
const authRoutes = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
