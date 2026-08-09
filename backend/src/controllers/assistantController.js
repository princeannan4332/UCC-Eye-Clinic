import { pool } from '../config/db.js';

// ── GET Assistant Overview & Assigned Doctor's Patients ────────────────────────
export const getAssistantOverview = async (req, res) => {
    try {
        const { assistantId } = req.params;

        // Get Assistant profile & supervisor doctor details
        const assistantRes = await pool.query(`
            SELECT a.id, a.email, a.full_name, a.role, a.assigned_location, a.supervisor_doctor_id,
                   d.full_name as supervisor_name, d.email as supervisor_email, d.assigned_location as doctor_location
            FROM profiles a
            LEFT JOIN profiles d ON a.supervisor_doctor_id = d.id
            WHERE a.id = $1 AND a.role = 'doctor_assistant';
        `, [assistantId]);

        if (assistantRes.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor assistant profile not found.' });
        }

        const assistant = assistantRes.rows[0];
        const doctorId = assistant.supervisor_doctor_id;

        // Fetch appointments directly assigned to this assistant OR belonging to supervisor doctor
        const apptRes = await pool.query(`
            SELECT a.id, a.student_id, a.doctor_id, a.assistant_id,
                   TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
                   a.appointment_time,
                   a.service_type, a.symptom_notes, a.status, a.location, a.pre_exam_vitals,
                   a.case_type, a.case_outcome, a.clinical_notes,
                   a.consultation_start_time, a.consultation_end_time, a.duration_minutes,
                   a.created_at, a.updated_at,
                   p.full_name as student_name, p.email as student_email, p.phone as student_phone,
                   p.student_id as student_index_no, p.allergies, p.medical_conditions, p.blood_group,
                   p.dob, p.gender, p.occupation, p.is_student, p.emergency_contact, p.personal_contact,
                   p.onboarding_completed,
                   d.full_name as doctor_name
            FROM appointments a
            LEFT JOIN profiles p ON a.student_id = p.id
            LEFT JOIN profiles d ON a.doctor_id = d.id
            WHERE (a.assistant_id = $1 OR ($2::uuid IS NOT NULL AND a.doctor_id = $2))
              AND (a.status IN ('pending', 'approved', 'active', 'rescheduled') OR a.appointment_date >= (CURRENT_DATE - INTERVAL '7 days'))
            ORDER BY a.appointment_date ASC, a.appointment_time ASC;
        `, [assistantId, doctorId || null]);

        const appointments = apptRes.rows;

        // Get assistant recent activity logs
        const logsRes = await pool.query(`
            SELECT l.*, p.full_name as patient_name, ap.service_type, ap.appointment_date
            FROM assistant_activity_logs l
            LEFT JOIN profiles p ON l.patient_id = p.id
            LEFT JOIN appointments ap ON l.appointment_id = ap.id
            WHERE l.assistant_id = $1
            ORDER BY l.created_at DESC
            LIMIT 30;
        `, [assistantId]);

        return res.status(200).json({
            assistant,
            appointments,
            activityLogs: logsRes.rows
        });
    } catch (err) {
        console.error('Error getting assistant overview:', err);
        return res.status(500).json({ error: 'Failed to retrieve assistant dashboard data.' });
    }
};

// ── GET Assistant Stats (for stats cards) ─────────────────────────────────────
export const getAssistantStats = async (req, res) => {
    try {
        const { assistantId } = req.params;

        const assistantRes = await pool.query(
            `SELECT id, supervisor_doctor_id FROM profiles WHERE id = $1 AND role = 'doctor_assistant'`,
            [assistantId]
        );
        if (assistantRes.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor assistant profile not found.' });
        }
        const doctorId = assistantRes.rows[0].supervisor_doctor_id;

        const todayStr = new Date().toISOString().split('T')[0];

        const statsRes = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE appointment_date = $3::date) as today_total,
                COUNT(*) FILTER (WHERE appointment_date = $3::date AND status = 'pending') as today_pending,
                COUNT(*) FILTER (WHERE appointment_date = $3::date AND status = 'approved') as today_approved,
                COUNT(*) FILTER (WHERE appointment_date = $3::date AND status = 'active') as today_active,
                COUNT(*) FILTER (WHERE appointment_date = $3::date AND status = 'completed') as today_completed,
                COUNT(*) FILTER (WHERE status = 'completed') as total_completed
            FROM appointments
            WHERE (assistant_id = $1 OR ($2::uuid IS NOT NULL AND doctor_id = $2))
        `, [assistantId, doctorId || null, todayStr]);

        return res.status(200).json({ stats: statsRes.rows[0] });
    } catch (err) {
        console.error('Error getting assistant stats:', err);
        return res.status(500).json({ error: 'Failed to retrieve assistant stats.' });
    }
};

// ── POST Log Assistant Action ──────────────────────────────────────────────────
export const logAssistantActivity = async (req, res) => {
    try {
        const { assistant_id, assistant_name, doctor_id, patient_id, appointment_id, action_type, description } = req.body;

        if (!assistant_id || !action_type || !description) {
            return res.status(400).json({ error: 'Assistant ID, action type, and description are required.' });
        }

        const insertQuery = `
            INSERT INTO assistant_activity_logs (assistant_id, assistant_name, doctor_id, patient_id, appointment_id, action_type, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [assistant_id, assistant_name || 'Doctor Assistant', doctor_id || null, patient_id || null, appointment_id || null, action_type, description];
        const result = await pool.query(insertQuery, values);

        return res.status(201).json({ message: 'Activity logged successfully', log: result.rows[0] });
    } catch (err) {
        console.error('Error logging assistant activity:', err);
        return res.status(500).json({ error: 'Failed to record assistant activity.' });
    }
};

// ── PATCH Update Appointment Pre-Exam Vitals & Pre-Assessment ──────────────────
export const updatePreExamVitals = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { assistant_id, assistant_name, doctor_id, pre_exam_vitals } = req.body;

        const updateRes = await pool.query(`
            UPDATE appointments
            SET pre_exam_vitals = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `, [JSON.stringify(pre_exam_vitals), appointmentId]);

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        // Auto-log activity for doctor tracking
        if (assistant_id) {
            const appt = updateRes.rows[0];
            await pool.query(`
                INSERT INTO assistant_activity_logs (assistant_id, assistant_name, doctor_id, patient_id, appointment_id, action_type, description)
                VALUES ($1, $2, $3, $4, $5, 'PRE_EXAM_VITALS', $6);
            `, [
                assistant_id,
                assistant_name || 'Assistant',
                doctor_id || appt.doctor_id,
                appt.student_id,
                appointmentId,
                `Recorded pre-exam vitals (IOP: ${pre_exam_vitals.iop || 'N/A'}, Visual Acuity: ${pre_exam_vitals.visual_acuity || 'N/A'})`
            ]).catch(() => {});
        }

        return res.status(200).json({ message: 'Pre-exam vitals updated successfully', appointment: updateRes.rows[0] });
    } catch (err) {
        console.error('Error updating pre-exam vitals:', err);
        return res.status(500).json({ error: 'Failed to update pre-exam vitals.' });
    }
};

// ── GET Doctor's Assistant Activity Tracker Logs (For Doctor Dashboard) ────────
export const getDoctorAssistantLogs = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Find assistants assigned to this doctor
        const assistantsRes = await pool.query(`
            SELECT id, email, full_name, phone, assigned_location, created_at
            FROM profiles
            WHERE supervisor_doctor_id = $1 AND role = 'doctor_assistant';
        `, [doctorId]);

        // Get activity logs for this doctor or assistants assigned to this doctor
        const logsRes = await pool.query(`
            SELECT l.*, p.full_name as patient_name, a.service_type, a.appointment_date
            FROM assistant_activity_logs l
            LEFT JOIN profiles p ON l.patient_id = p.id
            LEFT JOIN appointments a ON l.appointment_id = a.id
            WHERE l.doctor_id = $1 OR l.assistant_id IN (SELECT id FROM profiles WHERE supervisor_doctor_id = $1)
            ORDER BY l.created_at DESC
            LIMIT 50;
        `, [doctorId]);

        return res.status(200).json({
            assistants: assistantsRes.rows,
            activityLogs: logsRes.rows
        });
    } catch (err) {
        console.error('Error fetching doctor assistant logs:', err);
        return res.status(500).json({ error: 'Failed to retrieve assistant activity tracker data.' });
    }
};

// ── DELETE Remove Assistant from Doctor Supervision ───────────────────────────
export const removeDoctorAssistant = async (req, res) => {
    try {
        const { doctorId, assistantId } = req.params;

        // Verify the assistant belongs to this doctor
        const checkRes = await pool.query(`
            SELECT id, full_name FROM profiles 
            WHERE id = $1 AND supervisor_doctor_id = $2 AND role = 'doctor_assistant';
        `, [assistantId, doctorId]);

        if (checkRes.rows.length === 0) {
            return res.status(404).json({ error: 'Assistant not found or not assigned to this doctor.' });
        }

        const assistantName = checkRes.rows[0].full_name;

        // Unlink supervisor_doctor_id
        await pool.query(`
            UPDATE profiles
            SET supervisor_doctor_id = NULL
            WHERE id = $1;
        `, [assistantId]);

        // Log the activity
        await pool.query(`
            INSERT INTO assistant_activity_logs (assistant_id, assistant_name, doctor_id, action_type, description)
            VALUES ($1, $2, $3, 'REMOVED_FROM_SUPERVISION', $4);
        `, [assistantId, assistantName, doctorId, `Removed assistant ${assistantName} from doctor supervision.`]).catch(() => {});

        return res.status(200).json({ message: `Assistant ${assistantName} removed from your supervision successfully.` });
    } catch (err) {
        console.error('Error removing assistant:', err);
        return res.status(500).json({ error: 'Failed to remove assistant.' });
    }
};
