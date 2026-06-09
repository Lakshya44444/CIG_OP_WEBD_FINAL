import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("password123", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@snapvault.com" },
    update: { emailVerified: true, role: "ADMIN" },
    create: {
      name: "Admin User",
      username: "admin",
      email: "admin@snapvault.com",
      passwordHash: adminHash,
      role: "ADMIN",
      bio: "Platform administrator",
      emailVerified: true,
    },
  });

  // Photographer user
  const photoHash = await bcrypt.hash("password123", 10);
  const photographer = await db.user.upsert({
    where: { email: "photographer@snapvault.com" },
    update: { emailVerified: true, role: "PHOTOGRAPHER" },
    create: {
      name: "Alex Photographer",
      username: "alex_photo",
      email: "photographer@snapvault.com",
      passwordHash: photoHash,
      role: "PHOTOGRAPHER",
      bio: "Professional event photographer",
      emailVerified: true,
    },
  });

  // Club member test user (VIEWER role — add as EventMember of specific clubs to test private access)
  const memberHash = await bcrypt.hash("password123", 10);
  const member = await db.user.upsert({
    where: { email: "member@snapvault.com" },
    update: { emailVerified: true, role: "VIEWER" },
    create: {
      name: "Jane Member",
      username: "jane_member",
      email: "member@snapvault.com",
      passwordHash: memberHash,
      role: "VIEWER",
      emailVerified: true,
    },
  });

  // Viewer user
  const viewerHash = await bcrypt.hash("password123", 10);
  await db.user.upsert({
    where: { email: "viewer@snapvault.com" },
    update: { emailVerified: true, role: "VIEWER" },
    create: {
      name: "View Only",
      username: "viewer",
      email: "viewer@snapvault.com",
      passwordHash: viewerHash,
      role: "VIEWER",
      emailVerified: true,
    },
  });

  // Sample events
  const event1 = await db.event.upsert({
    where: { id: "seed-event-1" },
    update: {},
    create: {
      id: "seed-event-1",
      name: "Annual Photography Workshop 2024",
      description: "A comprehensive workshop for aspiring photographers covering composition, lighting, and post-processing.",
      date: new Date("2024-09-15"),
      location: "Mumbai, India",
      category: "WORKSHOP",
      isPublic: true,
      createdById: admin.id,
    },
  });

  const event2 = await db.event.upsert({
    where: { id: "seed-event-2" },
    update: {},
    create: {
      id: "seed-event-2",
      name: "Cultural Fest 2024",
      description: "Celebrating diversity through art, music, and dance.",
      date: new Date("2024-11-20"),
      location: "Delhi, India",
      category: "CULTURAL",
      isPublic: true,
      createdById: photographer.id,
    },
  });

  // Albums
  await db.album.upsert({
    where: { id: "seed-album-1" },
    update: {},
    create: {
      id: "seed-album-1",
      name: "Day 1 - Morning Sessions",
      eventId: event1.id,
      createdById: photographer.id,
      isPublic: true,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("\nDemo accounts (all with password123):");
  console.log("  Admin:        admin@snapvault.com");
  console.log("  Photographer: photographer@snapvault.com");
  console.log("  Member:       member@snapvault.com");
  console.log("  Viewer:       viewer@snapvault.com");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
