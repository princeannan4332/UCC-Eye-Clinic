import { pool } from '../config/db.js';
import crypto from 'crypto';

// ── GET System Overview Metrics & Analytics ──────────────────────────────────────
export const getSystemOverview = async (req, res) => {
    try {
        const patientsRes = await pool.query("SELECT COUNT(*) FROM profiles WHERE role = 'student'");
        const doctorsRes = await pool.query("SELECT COUNT(*) FROM profiles WHERE role = 'doctor'");
        const assistantsRes = await pool.query("SELECT COUNT(*) FROM profiles WHERE role = 'doctor_assistant'");
        const appointmentsRes = await pool.query("SELECT COUNT(*) FROM appointments");
        const completedRes = await pool.query("SELECT COUNT(*) FROM appointments WHERE status = 'completed'");
        const pendingRes = await pool.query("SELECT COUNT(*) FROM appointments WHERE status = 'pending'");
        const capacityRes = await pool.query("SELECT COUNT(*) FROM clinic_capacity WHERE is_active = TRUE");

        // Recent appointments
        const recentAppts = await pool.query(`
            SELECT a.id, a.appointment_date, a.appointment_time, a.service_type, a.status, a.location,
                   p.full_name as patient_name, d.full_name as doctor_name
            FROM appointments a
            LEFT JOIN profiles p ON a.student_id = p.id
            LEFT JOIN profiles d ON a.doctor_id = d.id
            ORDER BY a.created_at DESC
            LIMIT 10;
        `);

        return res.status(200).json({
            stats: {
                totalPatients: parseInt(patientsRes.rows[0].count, 10),
                totalDoctors: parseInt(doctorsRes.rows[0].count, 10),
                totalAssistants: parseInt(assistantsRes.rows[0].count, 10),
                totalAppointments: parseInt(appointmentsRes.rows[0].count, 10),
                completedAppointments: parseInt(completedRes.rows[0].count, 10),
                pendingAppointments: parseInt(pendingRes.rows[0].count, 10),
                activeCapacitySlots: parseInt(capacityRes.rows[0].count, 10)
            },
            recentAppointments: recentAppts.rows
        });
    } catch (err) {
        console.error('Error fetching Super Admin overview:', err);
        return res.status(500).json({ error: 'Failed to retrieve system overview statistics.' });
    }
};

// ── GET All Staff Members (Doctors & Doctor Assistants) ──────────────────────────
export const getAllStaff = async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.email, p.full_name, p.role, p.phone, p.assigned_location, p.supervisor_doctor_id, p.created_at,
                   d.full_name as supervisor_doctor_name, d.email as supervisor_doctor_email
            FROM profiles p
            LEFT JOIN profiles d ON p.supervisor_doctor_id = d.id
            WHERE p.role IN ('doctor', 'doctor_assistant')
            ORDER BY p.role ASC, p.full_name ASC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ staff: result.rows });
    } catch (err) {
        console.error('Error fetching staff members:', err);
        return res.status(500).json({ error: 'Failed to retrieve staff directory.' });
    }
};

// ── POST Add Doctor or Doctor Assistant via Email ──────────────────────────────
export const createStaffMember = async (req, res) => {
    try {
        const { email, full_name, role, phone, assigned_location, supervisor_doctor_id } = req.body;

        if (!email || !full_name || !role) {
            return res.status(400).json({ error: 'Email, Full Name, and Role are required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = full_name.trim();

        if (role !== 'doctor' && role !== 'doctor_assistant') {
            return res.status(400).json({ error: "Role must be either 'doctor' or 'doctor_assistant'." });
        }

        if (role === 'doctor_assistant' && !supervisor_doctor_id) {
            return res.status(400).json({ error: 'Please select a Supervising Doctor for this Doctor Assistant.' });
        }

        const HARDCODED_EMAILS = [
            'superadmin@gmail.com',
            'admin@gmail.com',
            'prince@gmail.com',
            'maxwell@gmail.com',
            'sarah@gmail.com',
            'emmanuel@gmail.com',
            'grace@gmail.com',
            'daniel@gmail.com'
        ];

        if (HARDCODED_EMAILS.includes(cleanEmail)) {
            return res.status(409).json({ error: `An account with email '${cleanEmail}' already exists in the system.` });
        }

        // Check if email already exists in database
        const existing = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [cleanEmail]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: `An account with email '${cleanEmail}' already exists in the system.` });
        }

        const newId = crypto.randomUUID();

        const insertQuery = `
            INSERT INTO profiles (id, email, full_name, role, phone, assigned_location, supervisor_doctor_id, onboarding_completed, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE)
            RETURNING *;
        `;

        const values = [
            newId,
            cleanEmail,
            cleanName,
            role,
            phone || null,
            assigned_location || 'Main Campus',
            role === 'doctor_assistant' ? supervisor_doctor_id : null
        ];

        const result = await pool.query(insertQuery, values);

        console.log(`✅ Super Admin created ${role}: ${cleanEmail} (Default Password: Test)`);

        return res.status(201).json({
            message: `Successfully created ${role === 'doctor' ? 'Doctor' : 'Doctor Assistant'} account. Default password is 'Test'.`,
            staff: result.rows[0]
        });

    } catch (err) {
        console.error('Error creating staff member:', err);
        return res.status(500).json({ error: 'Failed to create staff account.' });
    }
};

// ── PATCH Update Staff Member Role (Doctor / Doctor Assistant) ─────────────────
export const updateStaffRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, supervisor_doctor_id, assigned_location } = req.body;

        if (!role || (role !== 'doctor' && role !== 'doctor_assistant')) {
            return res.status(400).json({ error: "Role must be either 'doctor' or 'doctor_assistant'." });
        }

        if (role === 'doctor_assistant' && !supervisor_doctor_id) {
            return res.status(400).json({ error: 'Supervising Doctor is required when assigning role to Doctor Assistant.' });
        }

        const updateQuery = `
            UPDATE profiles
            SET role = $1,
                supervisor_doctor_id = $2,
                assigned_location = COALESCE($3, assigned_location)
            WHERE id = $4 AND role IN ('doctor', 'doctor_assistant')
            RETURNING *;
        `;

        const values = [
            role,
            role === 'doctor_assistant' ? supervisor_doctor_id : null,
            assigned_location || null,
            id
        ];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found.' });
        }

        return res.status(200).json({
            message: `Staff member role updated to ${role === 'doctor' ? 'Doctor' : 'Doctor Assistant'} successfully.`,
            staff: result.rows[0]
        });

    } catch (err) {
        console.error('Error updating staff role:', err);
        return res.status(500).json({ error: 'Failed to update staff role.' });
    }
};

// ── DELETE Staff Member ────────────────────────────────────────────────────────
export const deleteStaffMember = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query("DELETE FROM profiles WHERE id = $1 AND role IN ('doctor', 'doctor_assistant') RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found.' });
        }

        return res.status(200).json({ message: 'Staff member removed successfully.' });
    } catch (err) {
        console.error('Error deleting staff member:', err);
        return res.status(500).json({ error: 'Failed to delete staff member.' });
    }
};
