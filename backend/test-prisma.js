const { PrismaClient } = require('@prisma/client');

// Simple initialization - Prisma 7 uses the DATABASE_URL from .env
const prisma = new PrismaClient();

module.exports = prisma;