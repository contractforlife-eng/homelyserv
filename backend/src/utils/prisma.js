import { PrismaClient } from '@prisma/client'; 
import { PrismaPg } from '@prisma/adapter-pg'; 
import { Pool } from 'pg'; 
 
const pool = new Pool({ 
  connectionString: "postgresql://postgres.uyzyxmrkdleywpogtpfs:Killuemad-123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres", 
}); 
 
const adapter = new PrismaPg(pool); 
const prisma = new PrismaClient({ adapter }); 
 
export default prisma; 
