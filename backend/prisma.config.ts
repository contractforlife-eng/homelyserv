import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// Load environment variables explicitly from your .env file
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});