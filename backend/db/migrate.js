import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.fcrcfkhythtmepcfiyik:7hD4yd3N8WW40TuZ@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

console.log('🔄 Connecting to PostgreSQL database for migration...');

const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('📌 Executing schema.sql...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        await client.query(schemaSql);
        console.log('✅ Schema tables created/updated successfully!');

        console.log('🌱 Executing seed.sql...');
        const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
        await client.query(seedSql);
        console.log('✅ Seed data inserted successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
        console.log('🎉 Migration completed cleanly!');
    }
}

runMigration();
