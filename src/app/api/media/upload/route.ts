import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { generateImageTags } from "@/lib/ai";

export const maxDuration = 10; // Vercel free tier cap

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ADMIN and CLUB_ADMIN can upload to any event
    // PHOTOGRAPHER can upload to public events + private events where they are EventMember
    // Everyone else (VIEWER etc.) can upload only if they are EventMember of the event

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (e) {
      console.error("FormData parse error:", e);
      return NextResponse.json({ error: "Failed to parse upload data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const eventId = formData.get("eventId") as string | null;
    const albumId = formData.get("albumId") as string | null;
    const shouldAiTag = formData.get("aiTag") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    // Verify event exists
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check upload permission
    // ADMIN/CLUB_ADMIN: always allowed
    // PHOTOGRAPHER: allowed on public events OR private events they're EventMember of
    // Everyone else: must be EventMember
    const role = session.user.role;
    const isPrivileged = role === "ADMIN" || role === "CLUB_ADMIN";

    if (!isPrivileged) {
      const canSkipMemberCheck = role === "PHOTOGRAPHER" && event.isPublic;
      if (!canSkipMemberCheck) {
        const membership = await db.eventMember.findUnique({
          where: { userId_eventId: { userId: session.user.id, eventId } },
        });
        if (!membership) {
          return NextResponse.json(
            { error: "You must be a member of this event to upload" },
            { status: 403 }
          );
        }
      }
    }

    // Photographer and admin uploads visible to all; regular member uploads are member-only
    const memberOnly = !isPrivileged && role !== "PHOTOGRAPHER";

    // Read file buffer
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (e) {
      console.error("Buffer error:", e);
      return NextResponse.json({ error: "Failed to read file" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");

    // Upload to Cloudinary
    let uploaded: Awaited<ReturnType<typeof uploadToCloudinary>>;
    try {
      uploaded = await uploadToCloudinary(buffer, {
        folder: `pixora/events/${eventId}`,
        resourceType: isVideo ? "video" : "image",
        mimeType: file.type,
      });
    } catch (cloudErr) {
      const msg = cloudErr instanceof Error ? cloudErr.message : JSON.stringify(cloudErr);
      console.error("Cloudinary upload error:", msg);
      return NextResponse.json(
        { error: `Cloud upload failed: ${msg}` },
        { status: 500 }
      );
    }

    // Generate AI tags (non-blocking — don't fail upload if this errors)
    let aiTags: string[] = uploaded.tags || [];
    if (shouldAiTag && !isVideo) {
      try {
        aiTags = await generateImageTags(uploaded.url, uploaded.tags);
      } catch {
        // AI tagging is optional — continue without it
      }
    }

    // Save to database
    const media = await db.media.create({
      data: {
        url: uploaded.url,
        thumbnailUrl: uploaded.thumbnailUrl,
        publicId: uploaded.publicId,
        type: isVideo ? "VIDEO" : "IMAGE",
        width: uploaded.width,
        height: uploaded.height,
        size: uploaded.size,
        title: file.name.replace(/\.[^.]+$/, ""), // strip extension
        isPublic: event.isPublic,
        memberOnly,
        eventId,
        albumId: albumId || null,
        uploadedById: session.user.id,
        aiTags,
      },
    });

    // Pusher notification (non-blocking)
    try {
      const { pusherServer, CHANNELS, EVENTS } = await import("@/lib/pusher");
      await pusherServer.trigger(CHANNELS.media(eventId), EVENTS.NEW_MEDIA, {
        mediaId: media.id,
        url: media.thumbnailUrl,
        uploadedBy: session.user.name,
      });
    } catch {}

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Upload route error:", msg);
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
  }
}
