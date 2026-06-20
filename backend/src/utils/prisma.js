const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres.uyzyxmrkdleywpogtpfs:Killuemad-123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
});

module.exports = prisma;