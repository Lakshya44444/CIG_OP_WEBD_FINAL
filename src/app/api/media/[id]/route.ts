import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const media = await db.media.findUnique({
      where: { id },
      select: { id: true, publicId: true, type: true, uploadedById: true },
    });

    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only uploader or admin can delete
    if (media.uploadedById !== session.user.id && session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(
      media.publicId,
      media.type === "VIDEO" ? "video" : "image"
    );

    // Delete from database (cascades to likes, comments, favorites)
    await db.media.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
