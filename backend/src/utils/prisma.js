const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.uyzyxmrkdleywpogtpfs:Killuemad-123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;