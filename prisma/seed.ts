// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding…");

  // User anlegen oder holen
  const email = "test@viralix.dev";
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });
  console.log("👤 User:", user.email);

  // Zwei Accounts für den User
  const acc1 = await prisma.account.upsert({
    where: { handle: "viralix.dev" },
    update: {},
    create: {
      handle: "viralix.dev",
      platform: "INSTAGRAM",
      userId: user.id,
    },
  });

  const acc2 = await prisma.account.upsert({
    where: { handle: "viralix.tok" },
    update: {},
    create: {
      handle: "viralix.tok",
      platform: "TIKTOK",
      userId: user.id,
    },
  });

  console.log("📱 Accounts:", acc1.handle, acc2.handle);

  // Ein Projekt für den User
  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "viralix_demo",
      userId: user.id,
    },
  });
  console.log("📦 Project:", project.name);

  // Ein Post im Projekt, verknüpft mit beiden Accounts (M:N)
  const post = await prisma.post.create({
    data: {
      caption: "hello world",
      projectId: project.id,
      accounts: {
        connect: [{ id: acc1.id }, { id: acc2.id }],
      },
    },
    include: { accounts: true },
  });

  console.log("📝 Post:", post.caption, "→ accounts:", post.accounts.map(a => a.handle).join(", "));
  console.log("✅ Minimal-Seed fertig.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });