import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1) Demo-User (idempotent)
  const email = 'demo@example.com';
  const password = 'secret123';
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {}, // nichts ändern – nur sicherstellen, dass er existiert
    create: { email, password: hashed, username: 'demo-user' },
  });

  // 2) Demo-Projekt (idempotent je Benutzer + Name)
  const project = await prisma.project.upsert({
    where: { // falls du keinen Unique-Constraint auf (userId, name) hast,
             // nimm ein surrogate-Where (Name + userId) über findFirst + create:
      id: await (async () => {
        const existing = await prisma.project.findFirst({
          where: { userId: user.id, name: 'Demo Project' },
          select: { id: true },
        });
        if (existing) return existing.id;
        return -1; // nicht vorhanden
      })(),
    } as any, // Workaround: upsert braucht ein "where" – wir bauen es manuell
    update: {}, // nichts ändern
    create: {
      userId: user.id,
      name: 'Demo Project',
      description: 'Demo-Daten aus Prisma Seed',
    },
  }).catch(async () => {
    // Fallback, falls oben der Workaround mit "id: -1" clash't:
    const fallback = await prisma.project.findFirst({
      where: { userId: user.id, name: 'Demo Project' },
    });
    return (
      fallback ??
      (await prisma.project.create({
        data: {
          userId: user.id,
          name: 'Demo Project',
          description: 'Demo-Daten aus Prisma Seed',
        },
      }))
    );
  });

  // 3) Social Account (idempotent je Projekt + Handle)
  const account = await prisma.socialAccount.findFirst({
    where: { projectId: project.id, handle: '@demotest' },
  }).then(async (a) =>
    a ??
    (await prisma.socialAccount.create({
      data: {
        projectId: project.id,
        platform: 'INSTAGRAM', // falls Platform enum → anpassen
        handle: '@demotest',
      },
    }))
  );

  // 4) Post (idempotent je Projekt + Caption)
  const caption = 'Seeded demo post ✨';
  const post =
    (await prisma.post.findFirst({
      where: { projectId: project.id, caption },
    })) ??
    (await prisma.post.create({
      data: {
        projectId: project.id,
        caption,
        status: 'DRAFT', // falls dein Enum anders heißt → anpassen
        accountIds: [account.id] as any, // bei Json-Feld
      },
    }));

  console.log('✅ Seed fertig:', {
    user: { id: user.id, email: user.email },
    project: { id: project.id, name: project.name },
    account: { id: account.id, handle: account.handle },
    post: { id: post.id, caption: post.caption },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });