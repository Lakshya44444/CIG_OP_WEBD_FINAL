import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateImageTagsAndCaption } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mediaId } = await req.json();
    if (!mediaId) return NextResponse.json({ error: "mediaId required" }, { status: 400 });

    const media = await db.media.findUnique({
      where: { id: mediaId },
      select: { id: true, url: true, aiTags: true, width: true, height: true },
    });
    if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

    const { tags, caption } = await generateImageTagsAndCaption(
      media.url,
      media.aiTags,
      { width: media.width || 0, height: media.height || 0 }
    );

    const updated = await db.media.update({
      where: { id: mediaId },
      data: {
        aiTags: tags,
        // Save AI caption as description if not already set
        ...(caption && !media ? { description: caption } : {}),
      },
    });

    return NextResponse.json({ tags, caption, media: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Tagging error:", msg);
    return NextResponse.json({ error: "Tagging failed", detail: msg }, { status: 500 });
  }
}
