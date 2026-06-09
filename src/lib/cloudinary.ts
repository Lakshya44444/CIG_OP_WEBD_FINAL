import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Validate credentials are present
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("⚠️  Cloudinary credentials missing in .env!");
}

export { cloudinary };

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    resourceType?: "image" | "video" | "auto";
    mimeType?: string;
    transformation?: object[];
    tags?: string[];
    categorization?: string;
  } = {}
): Promise<{
  url: string;
  thumbnailUrl: string;
  publicId: string;
  width: number;
  height: number;
  size: number;
  tags: string[];
}> {
  const uploadOptions: Record<string, unknown> = {
    folder: options.folder || "pixora/media",
    resource_type: options.resourceType || "auto",
    // No quality/fetch_format here — let Cloudinary store the original at full quality
  };

  if (options.publicId) uploadOptions.public_id = options.publicId;
  if (options.tags?.length) uploadOptions.tags = options.tags;

  // Use the actual MIME type so Cloudinary stores the correct format (PNG → PNG, not JPEG)
  const mimeType = options.mimeType
    || (options.resourceType === "video" ? "video/mp4" : "image/jpeg");
  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

  // Thumbnail: scale to 800px wide preserving aspect ratio (no forced crop/distortion)
  const thumbnailUrl =
    result.resource_type === "video"
      ? cloudinary.url(result.public_id, {
          resource_type: "video",
          format: "jpg",
          transformation: [{ width: 800, crop: "scale" }],
        })
      : cloudinary.url(result.public_id, {
          transformation: [{ width: 800, crop: "scale", quality: "auto" }],
        });

  return {
    url: result.secure_url,
    thumbnailUrl,
    publicId: result.public_id,
    width: result.width || 0,
    height: result.height || 0,
    size: result.bytes || 0,
    tags: result.tags || [],
  };
}

export async function deleteFromCloudinary(publicId: string, resourceType: "image" | "video" = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export function getWatermarkedUrl(
  publicId: string,
  options: {
    clubName?: string;
    eventName?: string;
    userRole?: string;
  } = {}
): string {
  const text = [options.clubName, options.eventName, options.userRole]
    .filter(Boolean)
    .join(" | ");

  return cloudinary.url(publicId, {
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      {
        overlay: {
          font_family: "Arial",
          font_size: 28,
          font_weight: "bold",
          text: encodeURIComponent(text || "pixora"),
        },
        color: "white",
        opacity: 60,
        gravity: "south_east",
        x: 20,
        y: 20,
        effect: "shadow:30",
      },
    ],
  });
}

export function getThumbnailUrl(publicId: string, width = 800): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width, crop: "scale", quality: "auto" },
    ],
  });
}
