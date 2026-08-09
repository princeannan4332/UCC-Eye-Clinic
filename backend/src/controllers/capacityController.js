import { pool } from '../config/db.js';

// Helper: Auto-ensure default rotation of time intervals (8 AM to 4 PM, 1-hour sequential blocks)
export const ensureWeeklyDefaultSlots = async () => {
    try {
        const defaultIntervals = [
            // Main Campus (Strict 1-hour blocks from 8:00 AM to 4:00 PM)
            { start: '08:00:00', end: '09:00:00', max: 6, loc: 'Main Campus' },
            { start: '09:00:00', end: '10:00:00', max: 6, loc: 'Main Campus' },
            { start: '10:00:00', end: '11:00:00', max: 6, loc: 'Main Campus' },
            { start: '11:00:00', end: '12:00:00', max: 6, loc: 'Main Campus' },
            { start: '12:00:00', end: '13:00:00', max: 6, loc: 'Main Campus' },
            { start: '13:00:00', end: '14:00:00', max: 6, loc: 'Main Campus' },
            { start: '14:00:00', end: '15:00:00', max: 6, loc: 'Main Campus' },
            { start: '15:00:00', end: '16:00:00', max: 6, loc: 'Main Campus' },

            // Old Site (Identical 1-hour blocks)
            { start: '08:00:00', end: '09:00:00', max: 6, loc: 'Old Site' },
            { start: '09:00:00', end: '10:00:00', max: 6, loc: 'Old Site' },
            { start: '10:00:00', end: '11:00:00', max: 6, loc: 'Old Site' },
            { start: '11:00:00', end: '12:00:00', max: 6, loc: 'Old Site' },
            { start: '12:00:00', end: '13:00:00', max: 6, loc: 'Old Site' },
            { start: '13:00:00', end: '14:00:00', max: 6, loc: 'Old Site' },
            { start: '14:00:00', end: '15:00:00', max: 6, loc: 'Old Site' },
            { start: '15:00:00', end: '16:00:00', max: 6, loc: 'Old Site' }
        ];

        const insertQuery = `
            INSERT INTO clinic_capacity (slot_date, start_time, end_time, location, max_slots)
            SELECT (CURRENT_DATE + (i || ' day')::interval)::date, $1, $2, $4, $3
            FROM generate_series(0, 6) AS i
            ON CONFLICT (slot_date, start_time, end_time, location) DO NOTHING;
        `;

        for (const slot of defaultIntervals) {
            await pool.query(insertQuery, [slot.start, slot.end, slot.max, slot.loc]);
        }
    } catch (err) {
        console.error('Error ensuring weekly default capacity slots:', err);
    }
};

// Get available clinic capacity slots
export const getAvailableCapacity = async (req, res) => {
    try {
        await ensureWeeklyDefaultSlots();

        const { location, include_inactive } = req.query;
        let query = `
            SELECT 
                id, 
                TO_CHAR(slot_date, 'YYYY-MM-DD') as slot_date, 
                start_time, 
                end_time, 
                location,
                closure_reason,
                max_slots, 
                booked_slots, 
                GREATEST(0, max_slots - booked_slots) as slots_remaining,
                is_active
            FROM clinic_capacity
            WHERE 1=1
        `;
        const params = [];
        if (include_inactive !== 'true') {
            query += ` AND is_active = true`;
        }
        if (location) {
            params.push(location);
            query += ` AND location = $${params.length}`;
        }
        query += ` ORDER BY slot_date ASC, start_time ASC;`;

        const result = await pool.query(query, params);
        return res.status(200).json({ capacity: result.rows });
    } catch (err) {
        console.error('Error fetching clinic capacity:', err);
        return res.status(500).json({ error: 'Failed to fetch capacity slots' });
    }
};

// Admin: Add or update capacity slot (Enforces 8 AM to 4 PM, start <= 15:00)
export const createCapacitySlot = async (req, res) => {
    try {
        const { slot_date, start_time, end_time, location, max_slots } = req.body;
        if (!slot_date || !start_time || !end_time) {
            return res.status(400).json({ error: 'slot_date, start_time, and end_time are required' });
        }

        const [startH] = String(start_time).split(':').map(Number);
        if (startH < 8 || startH >= 15) {
            return res.status(400).json({ error: 'Clinic operating hours are 8:00 AM to 4:00 PM. Time slots must start between 08:00 AM and 03:00 PM.' });
        }

        const query = `
            INSERT INTO clinic_capacity (slot_date, start_time, end_time, location, max_slots)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (slot_date, start_time, end_time, location)
            DO UPDATE SET max_slots = EXCLUDED.max_slots, is_active = true, closure_reason = NULL
            RETURNING id, TO_CHAR(slot_date, 'YYYY-MM-DD') as slot_date, start_time, end_time, location, max_slots, booked_slots;
        `;
        const values = [slot_date, start_time, end_time, location || 'Main Campus', max_slots || 5];
        const result = await pool.query(query, values);
        return res.status(201).json({ message: 'Capacity slot configured successfully', slot: result.rows[0] });
    } catch (err) {
        console.error('Error creating capacity slot:', err);
        return res.status(500).json({ error: 'Failed to create capacity slot' });
    }
};

// Admin: Edit existing capacity slot
export const updateCapacitySlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { slot_date, start_time, end_time, location, max_slots } = req.body;
        if (!slot_date || !start_time || !end_time) {
            return res.status(400).json({ error: 'slot_date, start_time, and end_time are required' });
        }

        const [startH] = String(start_time).split(':').map(Number);
        if (startH < 8 || startH >= 15) {
            return res.status(400).json({ error: 'Clinic operating hours are 8:00 AM to 4:00 PM. Time slots must start between 08:00 AM and 03:00 PM.' });
        }

        const query = `
            UPDATE clinic_capacity
            SET slot_date = $1, start_time = $2, end_time = $3, location = $4, max_slots = $5
            WHERE id = $6
            RETURNING id, TO_CHAR(slot_date, 'YYYY-MM-DD') as slot_date, start_time, end_time, location, max_slots, booked_slots;
        `;
        const values = [slot_date, start_time, end_time, location || 'Main Campus', max_slots || 5, id];
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Capacity slot not found' });
        }
        return res.status(200).json({ message: 'Capacity slot updated successfully', slot: result.rows[0] });
    } catch (err) {
        console.error('Error updating capacity slot:', err);
        return res.status(500).json({ error: 'Failed to update capacity slot' });
    }
};

// Admin: Close Capacity Slot with Reason & Notify Booked Patients
export const deleteCapacitySlot = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { closure_reason } = req.body || {};

        const slotRes = await client.query(`SELECT *, TO_CHAR(slot_date, 'YYYY-MM-DD') as slot_date_str FROM clinic_capacity WHERE id = $1 FOR UPDATE`, [id]);
        if (slotRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Capacity slot not found' });
        }
        const slot = slotRes.rows[0];

        // Mark slot inactive and store reason
        const reasonText = closure_reason || 'Administrative schedule change / Maintenance';
        await client.query(
            `UPDATE clinic_capacity SET is_active = false, closure_reason = $1 WHERE id = $2`,
            [reasonText, id]
        );

        // Find all active/pending/approved appointments for this slot
        const apptsRes = await client.query(
            `SELECT id, student_id, service_type FROM appointments WHERE capacity_id = $1 AND status IN ('pending', 'approved', 'rescheduled')`,
            [id]
        );

        const reasonMessage = closure_reason ? `Reason: ${closure_reason}` : 'Reason: Schedule maintenance';

        // Notify affected patients and update appointment status to cancelled
        for (const appt of apptsRes.rows) {
            await client.query(
                `UPDATE appointments SET status = 'cancelled', reschedule_reason = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [`Slot closed by clinic administration. ${reasonMessage}`, appt.id]
            );

            const notifMsg = `⚠️ Slot Closed: Your appointment for ${appt.service_type} on ${slot.slot_date_str} at ${slot.start_time} (${slot.location}) has been closed by administration. ${reasonMessage}. Please rebook another available time slot.`;
            
            await client.query(
                `INSERT INTO notifications (student_id, appointment_id, title, message, type)
                 VALUES ($1, $2, '⚠️ Appointment Slot Closed', $3, 'warning')`,
                [appt.student_id, appt.id, notifMsg]
            );
        }

        await client.query('COMMIT');
        return res.status(200).json({
            message: `Capacity slot closed successfully. ${apptsRes.rows.length} booked patient(s) were notified on their dashboard.`,
            affected_patients: apptsRes.rows.length
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error closing capacity slot:', err);
        return res.status(500).json({ error: 'Failed to close capacity slot' });
    } finally {
        client.release();
    }
};

// Admin: Re-open Closed Capacity Slot (Reversal)
export const reopenCapacitySlot = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            UPDATE clinic_capacity
            SET is_active = true, closure_reason = NULL
            WHERE id = $1
            RETURNING id, TO_CHAR(slot_date, 'YYYY-MM-DD') as slot_date, start_time, end_time, location, max_slots, booked_slots, is_active;
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Capacity slot not found' });
        }
        return res.status(200).json({ message: 'Capacity slot re-opened successfully', slot: result.rows[0] });
    } catch (err) {
        console.error('Error re-opening capacity slot:', err);
        return res.status(500).json({ error: 'Failed to re-open capacity slot' });
    }
};

