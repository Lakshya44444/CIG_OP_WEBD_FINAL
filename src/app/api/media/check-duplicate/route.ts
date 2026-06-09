import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Simple duplicate detection: check file size + event combination
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { fileSize, eventId, fileName } = await req.json();

    if (!fileSize || !eventId) {
      return NextResponse.json({ isDuplicate: false });
    }

    // Check if a file with same size already exists in this event
    const existing = await db.media.findFirst({
      where: {
        eventId,
        size: fileSize,
      },
      select: { id: true, title: true, url: true, thumbnailUrl: true },
    });

    if (existing) {
      return NextResponse.json({
        isDuplicate: true,
        existingMedia: existing,
        message: `A file with the same size already exists in this event: "${existing.title}"`,
      });
    }

    return NextResponse.json({ isDuplicate: false });
  } catch {
    return NextResponse.json({ isDuplicate: false });
  }
}
