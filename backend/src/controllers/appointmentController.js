import { pool } from '../config/db.js';

// Patient: Book Appointment (Slot must exist in clinic_capacity DB)
export const createAppointment = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { student_id, capacity_id, appointment_date, appointment_time, location, service_type, symptom_notes } = req.body;

        if (!student_id || !appointment_date || !appointment_time || !service_type || !symptom_notes) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Missing required appointment fields' });
        }

        if (!capacity_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'A valid clinic capacity slot created by administration is required for booking.' });
        }

        // Ensure patient profile exists in profiles table to prevent foreign key error
        const profileCheck = await client.query('SELECT id FROM profiles WHERE id = $1', [student_id]);
        if (profileCheck.rows.length === 0) {
            await client.query(
                `INSERT INTO profiles (id, email, full_name, role, onboarding_completed)
                 VALUES ($1, $2, $3, 'student', false)
                 ON CONFLICT (id) DO NOTHING`,
                [student_id, `patient_${student_id.slice(0, 8)}@gmail.com`, 'Patient User']
            );
        }

        // Lock check on slot capacity
        const capCheck = await client.query(
            `SELECT max_slots, booked_slots, TO_CHAR(slot_date, 'YYYY-MM-DD') as slot_date, start_time, end_time, location as slot_loc, is_active 
             FROM clinic_capacity WHERE id = $1 FOR UPDATE`, 
            [capacity_id]
        );
        if (capCheck.rows.length === 0 || !capCheck.rows[0].is_active) {
            await client.query('ROLLBACK');
            return res.status(410).json({ error: 'This time slot has just been removed by administration and is no longer available. Please select another slot.' });
        }

        const { max_slots, booked_slots, slot_date, start_time, slot_loc } = capCheck.rows[0];

        // Check time range (8 AM to 4 PM, no booking after 3 PM)
        const dbTimeClean = String(start_time).slice(0, 5);
        const [h] = dbTimeClean.split(':').map(Number);
        if (h < 8 || h >= 15) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Clinic operating hours are 8:00 AM to 4:00 PM. No bookings permitted after 3:00 PM.' });
        }

        const reqTimeClean = String(appointment_time).slice(0, 5);
        if (slot_date !== appointment_date || dbTimeClean !== reqTimeClean) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'This time slot was recently modified by administration. Please re-select an available slot from the updated schedule.' });
        }

        const slotDateObj = new Date(slot_date);
        const todayObj = new Date();
        todayObj.setHours(0, 0, 0, 0);
        if (slotDateObj < todayObj) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'This slot is for a day that has already passed and is no longer available for booking.' });
        }

        if (booked_slots >= max_slots) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Selected slot is fully booked. Please select another time.' });
        }

        // Increment booked slots
        await client.query('UPDATE clinic_capacity SET booked_slots = booked_slots + 1 WHERE id = $1', [capacity_id]);

        const selectedLoc = location || slot_loc || 'Main Campus';

        const insertQuery = `
            INSERT INTO appointments (student_id, capacity_id, appointment_date, appointment_time, location, service_type, symptom_notes, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING *;
        `;
        const values = [student_id, capacity_id, appointment_date, appointment_time, selectedLoc, service_type, symptom_notes];
        const result = await client.query(insertQuery, values);
        const newAppointment = result.rows[0];

        const notifQuery = `
            INSERT INTO notifications (student_id, appointment_id, title, message, type)
            VALUES ($1, $2, 'Appointment Received', $3, 'info');
        `;
        await client.query(notifQuery, [
            student_id,
            newAppointment.id,
            `Your appointment request for ${service_type} on ${appointment_date} at ${appointment_time} (${selectedLoc}) has been received and is pending admin approval.`
        ]);

        await client.query('COMMIT');
        return res.status(201).json({ message: 'Appointment booked successfully', appointment: newAppointment });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating appointment:', err);
        return res.status(500).json({ error: 'Failed to complete appointment booking' });
    } finally {
        client.release();
    }
};

// Patient: Get Patient Appointments
export const getStudentAppointments = async (req, res) => {
    try {
        const { studentId } = req.params;
        const query = `
            SELECT a.*, p.full_name, p.email, p.index_number,
                   CASE 
                       WHEN ast.id IS NOT NULL THEN ast.full_name || ' (Doctor Assistant)'
                       ELSE d.full_name 
                   END AS doctor_name,
                   COALESCE(ast.email, d.email) AS doctor_email,
                   ast.full_name AS assistant_name
            FROM appointments a
            JOIN profiles p ON a.student_id = p.id
            LEFT JOIN profiles d ON a.doctor_id = d.id
            LEFT JOIN profiles ast ON a.assistant_id = ast.id
            WHERE a.student_id = $1
            ORDER BY a.created_at DESC;
        `;
        const result = await pool.query(query, [studentId]);
        return res.status(200).json({ appointments: result.rows });
    } catch (err) {
        console.error('Error getting student appointments:', err);
        return res.status(500).json({ error: 'Failed to retrieve patient appointments' });
    }
};

// Doctor: Get Doctor Allocated Appointments
export const getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const query = `
            SELECT 
                a.id,
                a.student_id AS user_id,
                a.capacity_id,
                a.doctor_id,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
                a.appointment_time,
                a.location,
                a.service_type,
                a.symptom_notes,
                a.status,
                a.consultation_start_time,
                a.consultation_end_time,
                a.duration_minutes,
                a.case_type,
                a.case_outcome,
                a.clinical_notes,
                a.reschedule_reason,
                a.rescheduled_date,
                a.rescheduled_time,
                a.created_at,
                a.updated_at,
                p.full_name, 
                p.email, 
                p.phone,
                p.dob,
                p.gender,
                p.is_student,
                p.student_id,
                p.occupation,
                p.allergies,
                p.medical_conditions,
                p.current_medications,
                p.blood_group,
                p.emergency_contact,
                p.personal_contact,
                p.onboarding_completed,
                COALESCE(ast.full_name, d.full_name) AS doctor_name,
                ast.full_name AS assistant_name
            FROM appointments a
            JOIN profiles p ON a.student_id = p.id
            LEFT JOIN profiles d ON a.doctor_id = d.id
            LEFT JOIN profiles ast ON a.assistant_id = ast.id
            WHERE (a.doctor_id = $1 OR a.assistant_id IN (SELECT id FROM profiles WHERE supervisor_doctor_id = $1))
              AND (a.status IN ('pending', 'approved', 'active', 'rescheduled') OR a.appointment_date >= (CURRENT_DATE - INTERVAL '7 days'))
            ORDER BY a.appointment_date ASC, a.appointment_time ASC;
        `;
        const result = await pool.query(query, [doctorId]);
        return res.status(200).json({ appointments: result.rows });
    } catch (err) {
        console.error('Error getting doctor appointments:', err);
        return res.status(500).json({ error: 'Failed to retrieve doctor appointments' });
    }
};

// Admin: Get All Appointments
export const getAllAppointments = async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id,
                a.student_id AS user_id,
                a.capacity_id,
                a.doctor_id,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
                a.appointment_time,
                a.location,
                a.service_type,
                a.symptom_notes,
                a.status,
                a.consultation_start_time,
                a.consultation_end_time,
                a.duration_minutes,
                a.case_type,
                a.case_outcome,
                a.clinical_notes,
                a.reschedule_reason,
                a.rescheduled_date,
                a.rescheduled_time,
                a.created_at,
                a.updated_at,
                p.full_name, 
                p.email, 
                p.phone,
                p.dob,
                p.gender,
                p.is_student,
                p.student_id,
                p.occupation,
                p.allergies,
                p.medical_conditions,
                p.current_medications,
                p.blood_group,
                p.emergency_contact,
                p.personal_contact,
                p.onboarding_completed,
                a.assistant_id,
                d.full_name AS doctor_name,
                d.email AS doctor_email,
                ast.full_name AS assistant_name,
                ast.email AS assistant_email
            FROM appointments a
            JOIN profiles p ON a.student_id = p.id
            LEFT JOIN profiles d ON a.doctor_id = d.id
            LEFT JOIN profiles ast ON a.assistant_id = ast.id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ appointments: result.rows });
    } catch (err) {
        console.error('Error getting all appointments for admin:', err);
        return res.status(500).json({ error: 'Failed to retrieve appointments list' });
    }
};

// Admin: Update Status (Approve with mandatory Doctor allocation & Max 9 Patient per day check)
export const updateAppointmentStatus = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { status, reschedule_reason, rescheduled_date, rescheduled_time, doctor_id } = req.body;

        if (!['approved', 'active', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid appointment status' });
        }

        if (status === 'approved' && !doctor_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'An allocated doctor must be selected when approving an appointment.' });
        }

        const apptQuery = `SELECT * FROM appointments WHERE id = $1 FOR UPDATE`;
        const apptRes = await client.query(apptQuery, [id]);
        if (apptRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Appointment not found' });
        }
        const appt = apptRes.rows[0];
        const targetDate = status === 'rescheduled' && rescheduled_date ? rescheduled_date : appt.appointment_date;

        // Check Doctor Daily Capacity Limit (Max 9 Patients per Doctor per Day)
        if (doctor_id && (status === 'approved' || status === 'active')) {
            const countQuery = `
                SELECT COUNT(*) as patient_count 
                FROM appointments 
                WHERE doctor_id = $1 
                  AND appointment_date = $2 
                  AND id != $3
                  AND status IN ('approved', 'active', 'completed');
            `;
            const countRes = await client.query(countQuery, [doctor_id, targetDate, id]);
            const currentCount = parseInt(countRes.rows[0]?.patient_count || 0, 10);
            if (currentCount >= 9) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Doctor has already reached their maximum daily capacity of 9 patients for this date (${targetDate}). Please select another doctor or date.`
                });
            }
        }

        let doctorName = 'Assigned Staff';
        let assignedDoctorId = appt.doctor_id || null;
        let assignedAssistantId = appt.assistant_id || null;

        if (doctor_id) {
            const staffRes = await client.query(`SELECT full_name, role, supervisor_doctor_id FROM profiles WHERE id = $1`, [doctor_id]);
            if (staffRes.rows.length > 0) {
                const staff = staffRes.rows[0];
                doctorName = staff.full_name;
                if (staff.role === 'doctor_assistant') {
                    assignedAssistantId = staff.id;
                    assignedDoctorId = staff.supervisor_doctor_id || null;
                    doctorName += ' (Doctor Assistant)';

                    await client.query(`
                        INSERT INTO assistant_activity_logs (assistant_id, assistant_name, doctor_id, patient_id, appointment_id, action_type, description)
                        VALUES ($1, $2, $3, $4, $5, 'APPOINTMENT_ASSIGNED', $6);
                    `, [staff.id, staff.full_name, assignedDoctorId, appt.student_id, id, `Assigned to patient appointment (${appt.service_type})`]).catch(() => {});
                } else {
                    assignedDoctorId = staff.id;
                    assignedAssistantId = null;
                }
            }
        }

        let updateQuery = `
            UPDATE appointments 
            SET status = $1, 
                reschedule_reason = $2, 
                rescheduled_date = $3, 
                rescheduled_time = $4,
                doctor_id = $5,
                assistant_id = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *;
        `;
        const updatedRes = await client.query(updateQuery, [
            status,
            reschedule_reason || null,
            rescheduled_date || null,
            rescheduled_time || null,
            assignedDoctorId,
            assignedAssistantId,
            id
        ]);
        const updatedAppt = updatedRes.rows[0];

        let notifTitle = '';
        let notifMessage = '';
        let notifType = 'info';

        if (status === 'approved') {
            notifTitle = 'Appointment Confirmed! ✅';
            notifMessage = `Your ${appt.service_type} appointment on ${appt.appointment_date} at ${appt.appointment_time} (${appt.location || 'Main Campus'}) has been APPROVED and allocated to ${doctorName}. Please arrive 10 minutes early.`;
            notifType = 'success';
        } else if (status === 'cancelled') {
            notifTitle = 'Appointment Cancelled ❌';
            notifMessage = `Your appointment for ${appt.service_type} on ${appt.appointment_date} has been cancelled. Reason: ${reschedule_reason || 'Administrative decision'}.`;
            notifType = 'danger';

            if (appt.capacity_id) {
                await client.query('UPDATE clinic_capacity SET booked_slots = GREATEST(0, booked_slots - 1) WHERE id = $1', [appt.capacity_id]);
            }
        } else if (status === 'rescheduled') {
            notifTitle = 'Appointment Rescheduled 📅';
            notifMessage = `Your appointment has been rescheduled to ${rescheduled_date} at ${rescheduled_time}. Reason: ${reschedule_reason || 'Clinic schedule adjustment'}.`;
            notifType = 'warning';
        }

        if (notifTitle) {
            const insertNotif = `
                INSERT INTO notifications (student_id, appointment_id, title, message, type)
                VALUES ($1, $2, $3, $4, $5);
            `;
            await client.query(insertNotif, [appt.student_id, id, notifTitle, notifMessage, notifType]);
        }

        await client.query('COMMIT');
        return res.status(200).json({ message: `Appointment status updated to ${status}`, appointment: updatedAppt });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating appointment status:', err);
        return res.status(500).json({ error: 'Failed to update appointment status' });
    } finally {
        client.release();
    }
};

// Doctor: Start Consultation (Mark patient as active)
export const startConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            UPDATE appointments
            SET status = 'active',
                consultation_start_time = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        return res.status(200).json({ message: 'Consultation started - patient is active', appointment: result.rows[0] });
    } catch (err) {
        console.error('Error starting consultation:', err);
        return res.status(500).json({ error: 'Failed to start consultation' });
    }
};

// Doctor / Assistant: Complete Consultation (Mark patient as done)
export const completeConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const { case_type, case_outcome, clinical_notes, duration_minutes, assistant_id, assistant_name } = req.body;

        // Calculate time spent if start time recorded
        const apptRes = await pool.query('SELECT student_id, doctor_id, assistant_id, consultation_start_time FROM appointments WHERE id = $1', [id]);
        if (apptRes.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        const appt = apptRes.rows[0];

        let calcDuration = duration_minutes || 15;
        if (appt.consultation_start_time) {
            const startMs = new Date(appt.consultation_start_time).getTime();
            const nowMs = Date.now();
            calcDuration = Math.max(1, Math.round((nowMs - startMs) / 60000));
        }

        const query = `
            UPDATE appointments
            SET status = 'completed',
                consultation_end_time = CURRENT_TIMESTAMP,
                duration_minutes = $1,
                case_type = $2,
                case_outcome = $3,
                clinical_notes = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *;
        `;
        const values = [
            calcDuration,
            case_type || 'Refraction & Visual Acuity Test',
            case_outcome || 'Capably Treated / Discharged',
            clinical_notes || 'Consultation completed.',
            id
        ];
        const result = await pool.query(query, values);
        const completedAppt = result.rows[0];

        // Auto-log to assistant_activity_logs if completed by an assistant
        const activeAssistantId = assistant_id || appt.assistant_id;
        if (activeAssistantId) {
            await pool.query(`
                INSERT INTO assistant_activity_logs (assistant_id, assistant_name, doctor_id, patient_id, appointment_id, action_type, description)
                VALUES ($1, $2, $3, $4, $5, 'COMPLETED_CONSULTATION', $6);
            `, [
                activeAssistantId,
                assistant_name || 'Assistant',
                appt.doctor_id,
                appt.student_id,
                id,
                `Completed consultation (${calcDuration} mins). Case: ${case_type || 'General'}. Outcome: ${case_outcome || 'Done'}. Notes: ${clinical_notes || 'None'}`
            ]).catch(() => {});
        }

        // Notify patient that consultation is completed & invite rating
        const insertNotif = `
            INSERT INTO notifications (student_id, appointment_id, title, message, type)
            VALUES ($1, $2, 'Consultation Completed! 🎉', $3, 'success');
        `;
        await pool.query(insertNotif, [
            completedAppt.student_id,
            id,
            `Your eye consultation with your doctor is completed! Please take a moment to rate and review your experience.`
        ]);

        return res.status(200).json({ message: 'Patient consultation completed cleanly', appointment: completedAppt });
    } catch (err) {
        console.error('Error completing consultation:', err);
        return res.status(500).json({ error: 'Failed to mark patient consultation as completed' });
    }
};

// Doctor: Get Patient Analysis & Metrics Report (Supports Month Filtering)
export const getDoctorAnalytics = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { month } = req.query; // e.g. '2026-07' or 'all'

        let dateFilter = '';
        const params = [doctorId];

        if (month && month !== 'all') {
            dateFilter = ` AND TO_CHAR(appointment_date, 'YYYY-MM') = $2`;
            params.push(month);
        }

        // Metrics Query
        const totalQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE status = 'completed') as total_attended,
                COUNT(*) FILTER (WHERE status IN ('approved', 'active')) as scheduled_count,
                AVG(duration_minutes) FILTER (WHERE status = 'completed')::numeric(10,1) as avg_duration
            FROM appointments
            WHERE doctor_id = $1 ${dateFilter};
        `;
        const totalRes = await pool.query(totalQuery, params);

        // Diagnosed Case Types Query
        const caseTypesQuery = `
            SELECT case_type, COUNT(*) as count
            FROM appointments
            WHERE doctor_id = $1 AND status = 'completed' AND case_type IS NOT NULL ${dateFilter}
            GROUP BY case_type
            ORDER BY count DESC;
        `;
        const caseTypesRes = await pool.query(caseTypesQuery, params);

        // Patient Complaints & Cases Brought Query
        const patientCasesQuery = `
            SELECT service_type as complaint_type, COUNT(*) as count
            FROM appointments
            WHERE doctor_id = $1 ${dateFilter}
            GROUP BY service_type
            ORDER BY count DESC;
        `;
        const patientCasesRes = await pool.query(patientCasesQuery, params);

        // Case Outcomes Query
        const caseOutcomesQuery = `
            SELECT case_outcome, COUNT(*) as count
            FROM appointments
            WHERE doctor_id = $1 AND status = 'completed' AND case_outcome IS NOT NULL ${dateFilter}
            GROUP BY case_outcome
            ORDER BY count DESC;
        `;
        const caseOutcomesRes = await pool.query(caseOutcomesQuery, params);

        // Available Months Query for Filter Dropdown
        const monthsQuery = `
            SELECT DISTINCT TO_CHAR(appointment_date, 'YYYY-MM') as month_key
            FROM appointments
            WHERE doctor_id = $1 AND appointment_date IS NOT NULL
            ORDER BY month_key DESC;
        `;
        const monthsRes = await pool.query(monthsQuery, [doctorId]);

        return res.status(200).json({
            metrics: {
                total_attended: parseInt(totalRes.rows[0]?.total_attended || 0, 10),
                scheduled_count: parseInt(totalRes.rows[0]?.scheduled_count || 0, 10),
                avg_duration_minutes: parseFloat(totalRes.rows[0]?.avg_duration || 0)
            },
            case_types: caseTypesRes.rows,
            patient_cases: patientCasesRes.rows,
            case_outcomes: caseOutcomesRes.rows,
            available_months: monthsRes.rows.map(r => r.month_key)
        });
    } catch (err) {
        console.error('Error fetching doctor analytics report:', err);
        return res.status(500).json({ error: 'Failed to retrieve doctor analysis report' });
    }
};

// Patient: Cancel Appointment & Free Capacity Slot
export const cancelStudentAppointment = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { student_id, reason } = req.body;

        const apptQuery = `SELECT * FROM appointments WHERE id = $1 AND student_id = $2 FOR UPDATE`;
        const apptRes = await client.query(apptQuery, [id, student_id]);
        if (apptRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }
        const appt = apptRes.rows[0];

        if (appt.status === 'cancelled') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Appointment is already cancelled' });
        }

        const updateQuery = `
            UPDATE appointments
            SET status = 'cancelled',
                reschedule_reason = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `;
        const updatedRes = await client.query(updateQuery, [reason || 'Cancelled by patient', id]);
        const updatedAppt = updatedRes.rows[0];

        if (appt.capacity_id) {
            await client.query(
                'UPDATE clinic_capacity SET booked_slots = GREATEST(0, booked_slots - 1) WHERE id = $1',
                [appt.capacity_id]
            );
        }

        const insertNotif = `
            INSERT INTO notifications (student_id, appointment_id, title, message, type)
            VALUES ($1, $2, 'Appointment Cancelled', $3, 'danger');
        `;
        await client.query(insertNotif, [
            student_id,
            id,
            `You cancelled your ${appt.service_type} appointment for ${appt.appointment_date} at ${appt.appointment_time}. The slot has been freed.`
        ]);

        await client.query('COMMIT');
        return res.status(200).json({ message: 'Appointment cancelled successfully and slot freed', appointment: updatedAppt });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error cancelling student appointment:', err);
        return res.status(500).json({ error: 'Failed to cancel appointment' });
    } finally {
        client.release();
    }
};

// Doctor: Get Complete Patient Clinical Encounter History (Past Completed Encounters Across All Doctors)
export const getPatientHistory = async (req, res) => {
    try {
        const { studentId } = req.params;

        const query = `
            SELECT 
                a.id,
                a.student_id,
                a.service_type,
                a.location,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
                a.appointment_time,
                a.status,
                a.symptom_notes,
                a.case_type,
                a.case_outcome,
                a.clinical_notes,
                a.duration_minutes,
                a.consultation_start_time,
                a.consultation_end_time,
                CASE 
                    WHEN ast.id IS NOT NULL THEN ast.full_name || ' (Doctor Assistant)'
                    ELSE p.full_name 
                END as doctor_name,
                COALESCE(ast.email, p.email) as doctor_email,
                ast.full_name as assistant_name
            FROM appointments a
            LEFT JOIN profiles p ON a.doctor_id = p.id
            LEFT JOIN profiles ast ON a.assistant_id = ast.id
            WHERE (
                a.student_id::text = $1::text OR 
                a.student_id IN (SELECT id FROM profiles WHERE id::text = $1::text OR email = $1 OR full_name = $1)
            ) AND a.status = 'completed'
            ORDER BY a.appointment_date DESC, a.appointment_time DESC;
        `;

        const result = await pool.query(query, [studentId]);
        return res.status(200).json({ history: result.rows });
    } catch (err) {
        console.error('Error fetching patient medical history:', err);
        return res.status(500).json({ error: 'Failed to retrieve patient medical history' });
    }
};

// Doctor: Assign Patient to Assistant (Only if not already assigned to that assistant)
export const assignPatientToAssistant = async (req, res) => {
    try {
        const { id } = req.params;
        const { assistant_id, doctor_id } = req.body;

        if (!assistant_id) {
            return res.status(400).json({ error: 'Please select an Assistant.' });
        }

        const apptRes = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
        if (apptRes.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }
        const appt = apptRes.rows[0];

        // Check if ALREADY assigned to THIS assistant
        if (appt.assistant_id === assistant_id) {
            return res.status(400).json({ error: 'This patient is already assigned to this assistant.' });
        }

        const asstRes = await pool.query("SELECT id, full_name FROM profiles WHERE id = $1 AND role = 'doctor_assistant'", [assistant_id]);
        if (asstRes.rows.length === 0) {
            return res.status(404).json({ error: 'Selected doctor assistant not found.' });
        }
        const assistantName = asstRes.rows[0].full_name;

        const updateRes = await pool.query(`
            UPDATE appointments
            SET assistant_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `, [assistant_id, id]);

        // Auto-log activity
        await pool.query(`
            INSERT INTO assistant_activity_logs (assistant_id, assistant_name, doctor_id, patient_id, appointment_id, action_type, description)
            VALUES ($1, $2, $3, $4, $5, 'APPOINTMENT_ASSIGNED_BY_DOCTOR', $6);
        `, [
            assistant_id,
            assistantName,
            doctor_id || appt.doctor_id,
            appt.student_id,
            id,
            `Assigned to patient appointment by supervising doctor (${appt.service_type})`
        ]).catch(() => {});

        return res.status(200).json({
            message: `Patient assigned to assistant ${assistantName} successfully.`,
            appointment: updateRes.rows[0]
        });

    } catch (err) {
        console.error('Error assigning patient to assistant:', err);
        return res.status(500).json({ error: 'Failed to assign patient to assistant.' });
    }
};
