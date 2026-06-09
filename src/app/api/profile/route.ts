import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validate, profileUpdateSchema } from "@/lib/validations";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, username: true, email: true,
        bio: true, avatar: true, role: true, createdAt: true,
        _count: {
          select: {
            media: true, likes: true, favorites: true,
            followers: true, following: true,
          },
        },
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") || "";

    let name: string | undefined;
    let username: string | undefined;
    let bio: string | undefined;
    let avatarBuffer: Buffer | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = formData.get("name") as string | undefined || undefined;
      username = formData.get("username") as string | undefined || undefined;
      bio = formData.get("bio") as string | undefined || undefined;

      const avatarFile = formData.get("avatar") as File | null;
      if (avatarFile) {
        avatarBuffer = Buffer.from(await avatarFile.arrayBuffer());
      }
    } else {
      const body = await req.json();
      ({ name, username, bio } = body);
    }

    const { data, error } = validate(profileUpdateSchema, { name, username, bio });
    if (error) return NextResponse.json({ error }, { status: 400 });

    // Check username uniqueness
    if (data!.username) {
      const existing = await db.user.findFirst({
        where: { username: data!.username, NOT: { id: session.user.id } },
      });
      if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    let avatarUrl: string | undefined;
    if (avatarBuffer) {
      const uploaded = await uploadToCloudinary(avatarBuffer, {
        folder: "pixora/avatars",
        resourceType: "image",
      });
      avatarUrl = uploaded.url;
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(data!.name && { name: data!.name }),
        ...(data!.username && { username: data!.username }),
        ...(data!.bio !== undefined && { bio: data!.bio }),
        ...(avatarUrl && { avatar: avatarUrl }),
      },
      select: { id: true, name: true, username: true, email: true, bio: true, avatar: true, role: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
