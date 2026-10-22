import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

let prisma = null;

if (process.env.DATABASE_URL) {
  try {
    prisma = new PrismaClient();
  } catch (err) {
    console.warn('⚠️ Prisma client initialization warning:', err.message);
    prisma = null;
  }
}

export default prisma;
