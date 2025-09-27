import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Hash password for demo user
  const passwordHash = await bcrypt.hash('password123', 12)

  // Create or get demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@viralix.ai' },
    update: {},
    create: {
      email: 'demo@viralix.ai',
      passwordHash,
    },
  })

  console.log('✅ Created user:', user.email)

  // Create demo accounts
  const instagramAccount = await prisma.account.create({
    data: {
      handle: '@viralix_official',
      platform: 'INSTAGRAM',
      userId: user.id,
    },
  })

  const tiktokAccount = await prisma.account.create({
    data: {
      handle: '@viralix_tiktok',
      platform: 'TIKTOK',
      userId: user.id,
    },
  })

  console.log('✅ Created accounts:', instagramAccount.handle, tiktokAccount.handle)

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: 'Demo Campaign',
      userId: user.id,
    },
  })

  console.log('✅ Created project:', project.name)

  // Create demo social accounts
  const instagramSocial = await prisma.socialAccount.create({
    data: {
      platform: 'INSTAGRAM',
      username: 'viralix_official',
      status: 'ACTIVE',
      userId: user.id,
    },
  })

  const tiktokSocial = await prisma.socialAccount.create({
    data: {
      platform: 'TIKTOK',
      username: 'viralix_tiktok',
      status: 'ACTIVE',
      userId: user.id,
    },
  })

  console.log('✅ Created social accounts:', instagramSocial.username, tiktokSocial.username)

  // Create demo posts
  const post1 = await prisma.post.create({
    data: {
      content: '🚀 Launching something amazing! Stay tuned... #viralix #socialmedia',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'SCHEDULED',
      userId: user.id,
      projectId: project.id,
      accountId: instagramSocial.id,
    },
  })

  const post2 = await prisma.post.create({
    data: {
      content: '💡 Behind the scenes of our creative process #creativity #innovation',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      status: 'SCHEDULED',
      userId: user.id,
      projectId: project.id,
      accountId: tiktokSocial.id,
    },
  })

  console.log('✅ Created posts:', post1.content?.substring(0, 30) + '...', post2.content?.substring(0, 30) + '...')

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })