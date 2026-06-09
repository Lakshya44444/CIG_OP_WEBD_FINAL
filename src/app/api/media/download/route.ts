import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWatermarkedUrl } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("mediaId");
    const noWatermark = searchParams.get("noWatermark") === "true";

    if (!mediaId) return NextResponse.json({ error: "mediaId required" }, { status: 400 });

    const media = await db.media.findUnique({
      where: { id: mediaId },
      include: {
        event: { select: { name: true } },
      },
    });

    if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

    // Only admins/photographers can skip watermark
    const canSkipWatermark =
      session?.user?.role === "ADMIN" || session?.user?.role === "PHOTOGRAPHER";

    const watermarked = !noWatermark || !canSkipWatermark;

    let downloadUrl = media.url;

    if (watermarked) {
      downloadUrl = getWatermarkedUrl(media.publicId, {
        eventName: media.event.name,
        userRole: session?.user?.role || "Viewer",
      });
    }

    // Log download
    if (session) {
      await db.download.create({
        data: {
          userId: session.user.id,
          mediaId,
          watermarked,
        },
      });
    }

    return NextResponse.json({ url: downloadUrl, watermarked });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
