import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToCloudinary, cloudinary } from "@/lib/cloudinary";
import sharp from "sharp";

export const maxDuration = 10; // Vercel free tier cap

const FACE_SIZE = 24;
const NCC_THRESHOLD = 0.25;
const MAX_SCAN = 12; // keep well within 10s on free tier

function faceCropUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    transformation: [
      { gravity: "face", crop: "thumb", width: 200, height: 200, zoom: 0.75 },
    ],
  });
}

// Download a Cloudinary face-cropped image and return raw 24×24 grayscale pixels
async function getFacePixels(imageUrl: string): Promise<Buffer | null> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return await sharp(buf)
      .resize(FACE_SIZE, FACE_SIZE, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();
  } catch {
    return null;
  }
}

// Normalized Cross-Correlation: invariant to linear brightness/contrast differences
// Returns -1 to +1; higher = more similar faces
function ncc(a: Buffer, b: Buffer): number {
  const n = a.length;
  let sumA = 0, sumB = 0;
  for (let i = 0; i < n; i++) { sumA += a[i]; sumB += b[i]; }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }

  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("selfie") as File | null;
    if (!file) return NextResponse.json({ error: "No selfie provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload selfie to Cloudinary
    const uploaded = await uploadToCloudinary(buffer, {
      folder: "pixora/selfies",
      resourceType: "image",
    });

    await db.user.update({
      where: { id: session.user.id },
      data: { referenceImageUrl: uploaded.url },
    });

    // 2. Confirm selfie has a detectable face
    const selfieResource = await new Promise<{ faces?: number[][] }>((resolve) => {
      cloudinary.api.resource(uploaded.publicId, { faces: true }, (err: unknown, res: unknown) => {
        resolve((err ? {} : res) as { faces?: number[][] });
      });
    });

    if (!selfieResource.faces || selfieResource.faces.length === 0) {
      return NextResponse.json(
        { error: "No face detected in your selfie. Please upload a clear front-facing photo." },
        { status: 400 }
      );
    }

    // 3. Get pixel fingerprint for selfie face crop
    const selfieCropUrl = faceCropUrl(uploaded.publicId);
    const selfiePixels = await getFacePixels(selfieCropUrl);

    if (!selfiePixels) {
      return NextResponse.json(
        { error: "Could not process your selfie. Please try again." },
        { status: 400 }
      );
    }

    // 4. Fetch accessible event photos (respect same visibility rules as media API)
    const role = session.user.role;
    let mediaWhere: Record<string, unknown> = { type: "IMAGE" };

    if (role !== "ADMIN") {
      const memberships = await db.eventMember.findMany({
        where: { userId: session.user.id },
        select: { eventId: true },
      });
      const memberEventIds = memberships.map((m) => m.eventId);

      if (role === "PHOTOGRAPHER") {
        // Photographers never see memberOnly casual uploads
        mediaWhere = memberEventIds.length > 0
          ? { type: "IMAGE", OR: [{ isPublic: true, memberOnly: false }, { eventId: { in: memberEventIds }, memberOnly: false }] }
          : { type: "IMAGE", isPublic: true, memberOnly: false };
      } else if (role === "CLUB_ADMIN") {
        const adminEvents = await db.eventAdmin.findMany({ where: { userId: session.user.id }, select: { eventId: true } });
        const adminEventIds = adminEvents.map((e) => e.eventId);
        mediaWhere = { type: "IMAGE", OR: [{ isPublic: true }, { eventId: { in: adminEventIds } }] };
      } else {
        // VIEWER: public non-memberOnly + all media from their EventMember events
        mediaWhere = memberEventIds.length > 0
          ? { type: "IMAGE", OR: [{ isPublic: true, memberOnly: false }, { eventId: { in: memberEventIds } }] }
          : { type: "IMAGE", isPublic: true, memberOnly: false };
      }
    }

    const allMedia = await db.media.findMany({
      where: mediaWhere,
      select: { id: true, url: true, publicId: true, thumbnailUrl: true, eventId: true },
      orderBy: { createdAt: "desc" },
      take: MAX_SCAN,
    });

    console.log(`[face-search] scanning ${allMedia.length} photos with pixel NCC`);

    const matchedIds: string[] = [];

    // 5. Compare each photo's primary face crop against selfie using NCC
    for (const media of allMedia) {
      try {
        const res = await new Promise<{ faces?: number[][] }>((resolve) => {
          cloudinary.api.resource(media.publicId, { faces: true }, (err: unknown, r: unknown) => {
            resolve((err ? {} : r) as { faces?: number[][] });
          });
        });

        if (!res.faces || res.faces.length === 0) continue;

        const photoCropUrl = faceCropUrl(media.publicId);
        const photoPixels = await getFacePixels(photoCropUrl);
        if (!photoPixels) continue;

        const similarity = ncc(selfiePixels, photoPixels);
        console.log(`[face-search] ${media.publicId} ncc=${similarity.toFixed(3)}`);

        if (similarity >= NCC_THRESHOLD) {
          matchedIds.push(media.id);
          await db.faceMatch.upsert({
            where: { userId_mediaId: { userId: session.user.id, mediaId: media.id } },
            create: { userId: session.user.id, mediaId: media.id, confidence: Math.max(0, Math.min(1, similarity)) },
            update: { confidence: Math.max(0, Math.min(1, similarity)) },
          });
        }
      } catch {
        // Skip photo on error
      }
    }

    // Remove stale matches no longer above threshold
    await db.faceMatch.deleteMany({
      where: { userId: session.user.id, mediaId: { notIn: matchedIds } },
    });

    const matchedMedia = await db.media.findMany({
      where: { id: { in: matchedIds } },
      include: {
        event: { select: { name: true, id: true } },
        _count: { select: { likes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      referenceImageUrl: uploaded.url,
      matchCount: matchedMedia.length,
      matches: matchedMedia,
      mode: "pixel-comparison",
    });
  } catch (error) {
    console.error("[face-search] error:", error instanceof Error ? error.message : error);
    if (error instanceof Error) console.error(error.stack);
    return NextResponse.json({ error: "Face search failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [matches, user] = await Promise.all([
      db.faceMatch.findMany({
        where: { userId: session.user.id },
        include: {
          media: {
            include: {
              event: { select: { name: true, id: true } },
              _count: { select: { likes: true } },
            },
          },
        },
        orderBy: { confidence: "desc" },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { referenceImageUrl: true },
      }),
    ]);

    return NextResponse.json({
      matches: matches.map((m) => m.media),
      referenceImageUrl: user?.referenceImageUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
