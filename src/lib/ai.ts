// AI Tagging using Cloudinary's built-in analysis (faces + colors)
// HuggingFace is not used since it's unreliable on many networks

function extractPublicId(url: string): string | null {
  try {
    // Match: /upload/v123456/folder/filename.jpg OR /upload/folder/filename.jpg
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return [r, g, b];
}

function tagsFromColors(colors: [string, number][]): string[] {
  const tags: string[] = [];
  if (!colors?.length) return tags;

  let hasGreen = false, hasBlue = false, hasBright = false;
  let hasDark = true, hasWarm = false;

  for (const [hex, percentage] of colors.slice(0, 5)) {
    const [r, g, b] = hexToRgb(hex);
    const brightness = (r + g + b) / 3;

    if (brightness > 140) hasBright = true;
    if (brightness > 50) hasDark = false;
    if (g > r + 20 && g > b + 20) hasGreen = true; // clearly green
    if (b > r + 20 && b > g - 10) hasBlue = true;  // clearly blue
    if (r > g + 20 && r > b + 10) hasWarm = true;  // warm/red tones
  }

  // Scene detection
  if (hasGreen && hasBlue) tags.push("outdoor", "nature");
  else if (hasGreen) tags.push("outdoor", "greenery");
  else if (hasBlue) tags.push("sky", "outdoor");
  else if (hasBright && !hasGreen && !hasBlue) tags.push("indoor", "well lit");
  else tags.push("indoor");

  if (hasDark) tags.push("night", "low light");
  if (hasWarm) tags.push("warm tones");

  return tags;
}

function tagsFromFaces(faceCount: number, width: number, height: number): string[] {
  const tags: string[] = [];
  if (faceCount === 0) return tags;

  tags.push("people");

  if (faceCount === 1) {
    // Check if it's a selfie (face large relative to image)
    tags.push("portrait");
    tags.push("person");
  } else if (faceCount === 2) {
    tags.push("group");
    tags.push("friends");
    tags.push("two people");
  } else if (faceCount >= 3 && faceCount <= 5) {
    tags.push("group photo");
    tags.push("friends");
    tags.push("group");
  } else if (faceCount > 5) {
    tags.push("crowd");
    tags.push("large group");
    tags.push("event");
  }

  // Aspect ratio hints
  if (width > 0 && height > 0) {
    const ratio = width / height;
    if (ratio < 0.85 && faceCount <= 2) tags.push("selfie");
    if (ratio > 1.3) tags.push("landscape");
    if (ratio < 0.8) tags.push("vertical");
  }

  return tags;
}

// Returns both tags and an AI-generated caption
export async function generateImageTagsAndCaption(
  imageUrl: string,
  existingTags: string[] = [],
  metadata?: { width?: number; height?: number }
): Promise<{ tags: string[]; caption: string | null }> {
  const tags = await generateImageTags(imageUrl, existingTags, metadata);
  // Caption built from tags — readable description
  const caption = tags.length > 0
    ? `${tags.slice(0, 3).join(", ")} — captured at your event`
    : null;
  return { tags, caption };
}

export async function generateImageTags(
  imageUrl: string,
  existingTags: string[] = [],
  metadata?: { width?: number; height?: number }
): Promise<string[]> {
  const allTags = new Set<string>(existingTags.map((t) => t.toLowerCase()));

  try {
    const { cloudinary } = await import("@/lib/cloudinary");
    const publicId = extractPublicId(imageUrl);

    if (!publicId) return [...allTags];

    // Use Cloudinary Admin API to get faces + colors — FREE, no add-on needed
    const resource = await new Promise<{
      faces?: number[][];
      colors?: [string, number][];
      width?: number;
      height?: number;
      tags?: string[];
    }>((resolve, reject) => {
      cloudinary.api.resource(publicId, { faces: true, colors: true }, (err: unknown, res: unknown) => {
        if (err) reject(err);
        else resolve(res as never);
      });
    });

    const faceCount = resource.faces?.length || 0;
    const width = resource.width || metadata?.width || 0;
    const height = resource.height || metadata?.height || 0;
    const colors = resource.colors || [];

    // Generate tags from analysis
    const faceTags = tagsFromFaces(faceCount, width, height);
    const colorTags = tagsFromColors(colors);

    faceTags.forEach((t) => allTags.add(t));
    colorTags.forEach((t) => allTags.add(t));

    // Cloudinary's own auto-tags (if enabled during upload)
    if (resource.tags?.length) {
      resource.tags.forEach((t: string) => allTags.add(t.toLowerCase()));
    }

    // Size-based tags
    if (width > 0 && height > 0) {
      const ratio = width / height;
      if (ratio > 1.5) allTags.add("landscape photo");
      else if (ratio < 0.75) allTags.add("portrait shot");
      if (width >= 2000) allTags.add("high quality");
    }

    // If still no meaningful tags — use sensible defaults based on what we know
    if (allTags.size === 0) {
      allTags.add("event photo");
      allTags.add("captured moment");
    }

  } catch (err) {
    console.error("Cloudinary analysis error:", err);
    // Absolute fallback
    allTags.add("event photo");
  }

  // Always remove these useless generic tags
  allTags.delete("photo");
  allTags.delete("image");
  allTags.delete("");

  return [...allTags].filter((t) => t.length > 1).slice(0, 12);
}

// Face detection — used by facial recognition feature
export async function detectFacesInImage(imageUrl: string): Promise<{
  faces: Array<{ x: number; y: number; width: number; height: number }>;
}> {
  try {
    const { cloudinary } = await import("@/lib/cloudinary");
    const publicId = extractPublicId(imageUrl);
    if (!publicId) return { faces: [] };

    const result = await new Promise<{ faces?: number[][] }>((resolve) => {
      cloudinary.api.resource(publicId, { faces: true }, (error: unknown, res: unknown) => {
        if (error || !res) resolve({ faces: [] });
        else resolve(res as { faces?: number[][] });
      });
    });

    const faces = (result.faces || []).map((f: number[]) => ({
      x: f[0], y: f[1], width: f[2], height: f[3],
    }));

    return { faces };
  } catch {
    return { faces: [] };
  }
}
