-- OptiFlow Database Schema

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table (Linked to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'admin', 'doctor', 'superadmin', 'doctor_assistant')),
    index_number VARCHAR(100),
    phone VARCHAR(50),
    dob DATE,
    gender VARCHAR(50),
    is_student BOOLEAN DEFAULT TRUE,
    student_id VARCHAR(100),
    occupation VARCHAR(100),
    assigned_location VARCHAR(100) DEFAULT 'Main Campus',
    supervisor_doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    allergies TEXT,
    medical_conditions TEXT,
    current_medications TEXT,
    blood_group VARCHAR(20) DEFAULT 'None',
    emergency_contact VARCHAR(100),
    personal_contact VARCHAR(100),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clinic Capacity & Slot Management Table (Set by Admin)
CREATE TABLE IF NOT EXISTS clinic_capacity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100) DEFAULT 'Main Campus',
    closure_reason TEXT,
    max_slots INT NOT NULL DEFAULT 5,
    booked_slots INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_date_time_location_slot UNIQUE (slot_date, start_time, end_time, location)
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    capacity_id UUID REFERENCES clinic_capacity(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assistant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    location VARCHAR(100) DEFAULT 'Main Campus',
    service_type VARCHAR(100) NOT NULL,
    symptom_notes TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled', 'rescheduled')),
    consultation_start_time TIMESTAMP WITH TIME ZONE,
    consultation_end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INT,
    case_type VARCHAR(100),
    case_outcome VARCHAR(100),
    clinical_notes TEXT,
    reschedule_reason TEXT,
    rescheduled_date DATE,
    rescheduled_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctor Reviews & Star Ratings Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table (Pushed to Patient Dashboard when Admin updates status)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campus Locations Dataset (For Navigation Tour Module)
CREATE TABLE IF NOT EXISTS campus_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    estimated_minutes INT DEFAULT 5,
    waypoints JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
