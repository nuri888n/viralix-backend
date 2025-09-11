import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runWorker() {
  console.log("⏳ Worker gestartet...");

  // Alle 5 Sekunden prüfen
  setInterval(async () => {
    try {
      const duePosts = await prisma.post.findMany({
        where: {
          status: "SCHEDULED",
          scheduledAt: { lte: new Date() }, // fällige Posts
        },
      });

      for (const post of duePosts) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(), // Veröffentlichungszeit setzen
          },
        });
        console.log(`✅ Post ${post.id} published`);
      }
    } catch (err) {
      console.error("❌ Worker Error:", err);
    }
  }, 5000);
}

runWorker()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });