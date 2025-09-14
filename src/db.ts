JWT_SECRET=dev-secret-change-me
PORT=3000

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
