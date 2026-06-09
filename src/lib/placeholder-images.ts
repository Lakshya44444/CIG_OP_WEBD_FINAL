// Curated Unsplash images for event categories
export const EVENT_COVER_IMAGES: Record<string, string> = {
  PHOTOSHOOT: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop",
  WORKSHOP: "https://images.unsplash.com/photo-1552581234-26160f608093?w=600&h=400&fit=crop",
  TRIP: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&h=400&fit=crop",
  COMPETITION: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop",
  CULTURAL: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
  PARTY: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop",
  SPORTS: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop",
  OTHER: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
};

// Gallery placeholder images (for demo purposes)
export const GALLERY_PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=450&fit=crop",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=450&fit=crop",
];

export function getEventCoverImage(category: string): string {
  return EVENT_COVER_IMAGES[category] || EVENT_COVER_IMAGES.OTHER;
}
