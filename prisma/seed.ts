import prisma from '../src/db';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('test123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      userId: user.id,
    },
  });

  await prisma.post.create({
    data: {
      caption: 'Hello World!',
      projectId: project.id,
    },
  });

  console.log('Seed finished 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
