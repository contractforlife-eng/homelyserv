import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// إنشاء اتصال باستخدام pg pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// إنشاء الـ adapter
const adapter = new PrismaPg(pool);

// تمرير الـ adapter إلى PrismaClient
const prisma = new PrismaClient({ adapter });

export default prisma;