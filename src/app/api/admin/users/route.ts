import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where = {
      ...(q && { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] }),
      ...(role && { role: role as never }),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, name: true, email: true, username: true,
          avatar: true, role: true, createdAt: true, isActive: true,
          _count: { select: { media: true, likes: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
