import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.fcrcfkhythtmepcfiyik:7hD4yd3N8WW40TuZ@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

export const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
    console.log('✅ Connected to Supabase PostgreSQL database');
});

pool.on('error', (err) => {
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        console.warn('⚠️ Supabase DB Connection Notice:', err.message);
    } else {
        console.error('❌ Unexpected DB pool error:', err.message);
    }
});


export async function initDbSchema() {
    try {
        await pool.query(`
            -- TRUNCATE TABLE appointments CASCADE;
            -- TRUNCATE TABLE assistant_activity_logs CASCADE;
            -- TRUNCATE TABLE reviews CASCADE;
            -- UPDATE clinic_capacity SET booked_slots = 0;

            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob DATE;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT true;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_id VARCHAR(100);
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_location VARCHAR(100) DEFAULT 'Main Campus';
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_medications TEXT;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20) DEFAULT 'None';
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100);
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_contact VARCHAR(100);
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(100);
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS supervisor_doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

            ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
            ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'admin', 'doctor', 'superadmin', 'doctor_assistant'));

            ALTER TABLE clinic_capacity ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Main Campus';
            ALTER TABLE clinic_capacity ADD COLUMN IF NOT EXISTS closure_reason TEXT;

            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assistant_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Main Campus';
            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_start_time TIMESTAMP WITH TIME ZONE;
            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_end_time TIMESTAMP WITH TIME ZONE;
            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes INT;
            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS case_type VARCHAR(100);
            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS case_outcome VARCHAR(100);
            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinical_notes TEXT;
            ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pre_exam_vitals JSONB;

            ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
            ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled', 'rescheduled'));

            CREATE TABLE IF NOT EXISTS reviews (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
                patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                rating INT CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS assistant_activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                assistant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                assistant_name VARCHAR(255),
                doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                patient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
                appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
                action_type VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO profiles (id, email, full_name, role, assigned_location, onboarding_completed)
            VALUES 
                ('00000000-0000-4000-a000-000000000000', 'superadmin@gmail.com', 'Super Admin', 'superadmin', 'Main Campus', true),
                ('00000000-0000-4000-a000-000000000001', 'admin@gmail.com', 'Clinic Admin', 'admin', 'Main Campus', true),
                ('00000000-0000-4000-a000-000000000002', 'prince@gmail.com', 'Dr. Prince', 'doctor', 'Main Campus', true),
                ('00000000-0000-4000-a000-000000000003', 'maxwell@gmail.com', 'Dr. Maxwell', 'doctor', 'Old Site', true),
                ('00000000-0000-4000-a000-000000000004', 'sarah@gmail.com', 'Dr. Sarah Mensah', 'doctor', 'Main Campus', true),
                ('00000000-0000-4000-a000-000000000005', 'emmanuel@gmail.com', 'Dr. Emmanuel Kojo', 'doctor', 'Main Campus', true),
                ('00000000-0000-4000-a000-000000000006', 'grace@gmail.com', 'Dr. Grace Amoah', 'doctor', 'Old Site', true),
                ('00000000-0000-4000-a000-000000000007', 'daniel@gmail.com', 'Dr. Daniel Osei', 'doctor', 'Old Site', true)
            ON CONFLICT (email) DO UPDATE 
            SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, assigned_location = EXCLUDED.assigned_location, onboarding_completed = true;

            ALTER TABLE clinic_capacity DROP CONSTRAINT IF EXISTS unique_date_time_slot;
            ALTER TABLE clinic_capacity DROP CONSTRAINT IF EXISTS unique_date_time_location_slot;
            
            CREATE TABLE IF NOT EXISTS clinic_capacity (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                slot_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                location VARCHAR(100) DEFAULT 'Main Campus',
                max_slots INT NOT NULL DEFAULT 6,
                booked_slots INT NOT NULL DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_date_time_location_slot UNIQUE (slot_date, start_time, end_time, location)
            );

            ALTER TABLE clinic_capacity ADD CONSTRAINT unique_date_time_location_slot UNIQUE (slot_date, start_time, end_time, location);

            DELETE FROM clinic_capacity WHERE start_time::text LIKE '%:30:%';

            INSERT INTO clinic_capacity (slot_date, start_time, end_time, location, max_slots, booked_slots)
            VALUES 
                -- TODAY: Main Campus
                (CURRENT_DATE, '08:00:00', '09:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE, '09:00:00', '10:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE, '10:00:00', '11:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE, '11:00:00', '12:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE, '13:00:00', '14:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE, '14:00:00', '15:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE, '15:00:00', '16:00:00', 'Main Campus', 6, 0),

                -- TODAY: Old Site (Identical Slots)
                (CURRENT_DATE, '08:00:00', '09:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE, '09:00:00', '10:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE, '10:00:00', '11:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE, '11:00:00', '12:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE, '13:00:00', '14:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE, '14:00:00', '15:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE, '15:00:00', '16:00:00', 'Old Site', 6, 0),

                -- TOMORROW (+1 day): Main Campus
                (CURRENT_DATE + INTERVAL '1 day', '08:00:00', '09:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '09:00:00', '10:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '10:00:00', '11:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '11:00:00', '12:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '13:00:00', '14:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '14:00:00', '15:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '15:00:00', '16:00:00', 'Main Campus', 6, 0),

                -- TOMORROW (+1 day): Old Site (Identical Slots)
                (CURRENT_DATE + INTERVAL '1 day', '08:00:00', '09:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '09:00:00', '10:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '10:00:00', '11:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '11:00:00', '12:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '13:00:00', '14:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '14:00:00', '15:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '1 day', '15:00:00', '16:00:00', 'Old Site', 6, 0),

                -- DAY AFTER (+2 days): Main Campus
                (CURRENT_DATE + INTERVAL '2 day', '08:00:00', '09:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '09:00:00', '10:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '10:00:00', '11:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '11:00:00', '12:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '13:00:00', '14:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '14:00:00', '15:00:00', 'Main Campus', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '15:00:00', '16:00:00', 'Main Campus', 6, 0),

                -- DAY AFTER (+2 days): Old Site (Identical Slots)
                (CURRENT_DATE + INTERVAL '2 day', '08:00:00', '09:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '09:00:00', '10:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '10:00:00', '11:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '11:00:00', '12:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '13:00:00', '14:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '14:00:00', '15:00:00', 'Old Site', 6, 0),
                (CURRENT_DATE + INTERVAL '2 day', '15:00:00', '16:00:00', 'Old Site', 6, 0)
            ON CONFLICT (slot_date, start_time, end_time, location) DO NOTHING;
        `);
        console.log('✅ Database schema, doctor accounts, clinic capacity slots, and reviews table synchronized successfully');
    } catch (err) {
        console.error('⚠️ DB Migration warning:', err.message);
    }
}
