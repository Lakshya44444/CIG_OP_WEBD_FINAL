import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const KEEP_EMAILS = [
  "admin@snapvault.com",
  "photographer@snapvault.com",
  "member@snapvault.com",
  "viewer@snapvault.com",
];

async function main() {
  const users = await db.user.findMany({
    where: { email: { notIn: KEEP_EMAILS } },
    select: { id: true, name: true, email: true },
  });

  if (users.length === 0) {
    console.log("No user accounts to delete (only seeded accounts exist).");
    return;
  }

  console.log(`Found ${users.length} account(s) to delete:`);
  users.forEach((u) => console.log(` - ${u.email} | ${u.name}`));

  const ids = users.map((u) => u.id);

  // Delete events (and cascaded media/albums) created by these users
  const deletedEvents = await db.event.deleteMany({ where: { createdById: { in: ids } } });
  if (deletedEvents.count > 0) console.log(`  Removed ${deletedEvents.count} event(s) they created`);

  // Delete any remaining media uploaded by them
  const deletedMedia = await db.media.deleteMany({ where: { uploadedById: { in: ids } } });
  if (deletedMedia.count > 0) console.log(`  Removed ${deletedMedia.count} media file(s)`);

  await db.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`\nDeleted ${users.length} account(s) successfully.`);
  console.log("Remaining accounts: admin, photographer, member, viewer @snapvault.com");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
