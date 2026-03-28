import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env.test') });

export const testPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function runMigrations(): Promise<void> {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../db/init.sql'),
    'utf8'
  );
  await testPool.query(sql);
}

export async function truncateAll(): Promise<void> {
  await testPool.query(
    'TRUNCATE TABLE system_logs, tasks, projects, users RESTART IDENTITY CASCADE'
  );
}
