-- OptiFlow Seed Data

-- Clear existing sample data if needed (optional)
-- DELETE FROM campus_locations;

-- Seed UCC Campus Locations (9 Waypoints as described in Chapter 4)
INSERT INTO campus_locations (name, code, description, estimated_minutes, waypoints)
VALUES
(
    'Main Campus Gate',
    'MAIN_GATE',
    'Primary entry gate to UCC Main Campus near the ceremonial grounds.',
    8,
    '[
        {"step": 1, "title": "Main Entrance", "instruction": "Head north from the Main Gate towards University Avenue.", "distance": "150m"},
        {"step": 2, "title": "Faculty of Arts Roundabout", "instruction": "At the roundabout, take the second exit towards the Central Administration.", "distance": "200m"},
        {"step": 3, "title": "Library Junction", "instruction": "Turn right opposite the Sam Jonah Library.", "distance": "120m"},
        {"step": 4, "title": "UCC Eye Clinic Arrival", "instruction": "The UCC Eye Clinic building is on your immediate left, adjacent to the Health Services Center.", "distance": "50m"}
    ]'::jsonb
),
(
    'Sam Jonah Central Library',
    'CENTRAL_LIBRARY',
    'Central academic library located at the heart of campus.',
    4,
    '[
        {"step": 1, "title": "Library Forecourt", "instruction": "Exit the main library steps and walk east towards the Health Sciences walkway.", "distance": "100m"},
        {"step": 2, "title": "Health Center Corridor", "instruction": "Follow the covered canopy past the pharmacy department.", "distance": "150m"},
        {"step": 3, "title": "UCC Eye Clinic Entrance", "instruction": "Enter through the glass reception doors of the Eye Clinic building.", "distance": "30m"}
    ]'::jsonb
),
(
    'Super3 / Valco Hall',
    'VALCO_HALL',
    'Student residential hall located on North Campus.',
    12,
    '[
        {"step": 1, "title": "Valco Exit", "instruction": "Head south along Hall Road past the cafeteria.", "distance": "300m"},
        {"step": 2, "title": "Science Block Intersect", "instruction": "Cross the pedestrian walkway past the School of Physical Sciences.", "distance": "250m"},
        {"step": 3, "title": "Main Health Complex", "instruction": "Walk 100 meters straight ahead to reach UCC Eye Clinic.", "distance": "100m"}
    ]'::jsonb
),
(
    'Casely Hayford Hall (Casford)',
    'CASFORD_HALL',
    'Male residential hall near the sports stadium.',
    10,
    '[
        {"step": 1, "title": "Casford Gate", "instruction": "Walk east towards the Sports Stadium road.", "distance": "200m"},
        {"step": 2, "title": "Administration Path", "instruction": "Follow the pine tree path towards Central Admin.", "distance": "350m"},
        {"step": 3, "title": "Eye Clinic Annex", "instruction": "The clinic entrance is clearly marked on your right.", "distance": "80m"}
    ]'::jsonb
),
(
    'Adehye Hall',
    'ADEHYE_HALL',
    'Female residential hall near the North Campus gate.',
    9,
    '[
        {"step": 1, "title": "Adehye Quadrangle", "instruction": "Exit main quad towards the central shuttle drop-off point.", "distance": "180m"},
        {"step": 2, "title": "Shuttle Walkway", "instruction": "Walk past the Faculty of Education block.", "distance": "300m"},
        {"step": 3, "title": "UCC Eye Clinic", "instruction": "Arrive at UCC Eye Clinic building front desk.", "distance": "60m"}
    ]'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- Seed Upcoming Capacity Slots for the Next 4 Days (8 AM to 4 PM, no booking after 3 PM)
-- Identical time slots for both Main Campus and Old Site Annex
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

-- Seed Admin and Doctor Accounts (Main Campus & Old Site)
INSERT INTO profiles (id, email, full_name, role, assigned_location, onboarding_completed)
VALUES 
    ('00000000-0000-4000-a000-000000000001', 'admin@gmail.com', 'Clinic Admin', 'admin', 'Main Campus', true),
    ('00000000-0000-4000-a000-000000000002', 'prince@gmail.com', 'Dr. Prince', 'doctor', 'Main Campus', true),
    ('00000000-0000-4000-a000-000000000008', 'princeannan4332@gmail.com', 'Dr. Prince Annan', 'doctor', 'Main Campus', true),
    ('00000000-0000-4000-a000-000000000003', 'maxwell@gmail.com', 'Dr. Maxwell', 'doctor', 'Old Site', true),
    ('00000000-0000-4000-a000-000000000004', 'sarah@gmail.com', 'Dr. Sarah Mensah', 'doctor', 'Main Campus', true),
    ('00000000-0000-4000-a000-000000000005', 'emmanuel@gmail.com', 'Dr. Emmanuel Kojo', 'doctor', 'Main Campus', true),
    ('00000000-0000-4000-a000-000000000006', 'grace@gmail.com', 'Dr. Grace Amoah', 'doctor', 'Old Site', true),
    ('00000000-0000-4000-a000-000000000007', 'daniel@gmail.com', 'Dr. Daniel Osei', 'doctor', 'Old Site', true)
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, assigned_location = EXCLUDED.assigned_location, onboarding_completed = true;

