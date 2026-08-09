import { pool } from '../config/db.js';

// Submit review & star rating for a completed appointment
export const submitReview = async (req, res) => {
    try {
        const { appointment_id, patient_id, doctor_id, rating, comment } = req.body;

        if (!appointment_id || !patient_id || !doctor_id || !rating) {
            return res.status(400).json({ error: 'appointment_id, patient_id, doctor_id, and rating (1-5) are required' });
        }

        const numRating = parseInt(rating, 10);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
        }

        // Verify appointment status is completed
        const apptCheck = await pool.query('SELECT status FROM appointments WHERE id = $1', [appointment_id]);
        if (apptCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const insertQuery = `
            INSERT INTO reviews (appointment_id, patient_id, doctor_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [appointment_id, patient_id, doctor_id, numRating, comment || '']);
        return res.status(201).json({ message: 'Review submitted successfully', review: result.rows[0] });
    } catch (err) {
        console.error('Error submitting review:', err);
        return res.status(500).json({ error: 'Failed to submit patient review' });
    }
};

// Get reviews and average rating for a doctor
export const getDoctorReviews = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const query = `
            SELECT r.*, p.full_name AS patient_name, a.appointment_date, a.service_type
            FROM reviews r
            JOIN profiles p ON r.patient_id = p.id
            LEFT JOIN appointments a ON r.appointment_id = a.id
            WHERE r.doctor_id = $1
            ORDER BY r.created_at DESC;
        `;
        const result = await pool.query(query, [doctorId]);

        const avgQuery = `
            SELECT AVG(rating)::numeric(10,1) as avg_rating, COUNT(*) as total_reviews
            FROM reviews
            WHERE doctor_id = $1;
        `;
        const avgResult = await pool.query(avgQuery, [doctorId]);

        return res.status(200).json({
            reviews: result.rows,
            summary: {
                avg_rating: parseFloat(avgResult.rows[0]?.avg_rating || 0),
                total_reviews: parseInt(avgResult.rows[0]?.total_reviews || 0, 10)
            }
        });
    } catch (err) {
        console.error('Error fetching doctor reviews:', err);
        return res.status(500).json({ error: 'Failed to fetch doctor reviews' });
    }
};

// Get review for a specific appointment
export const getAppointmentReview = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const result = await pool.query('SELECT * FROM reviews WHERE appointment_id = $1', [appointmentId]);
        return res.status(200).json({ review: result.rows[0] || null });
    } catch (err) {
        console.error('Error fetching appointment review:', err);
        return res.status(500).json({ error: 'Failed to fetch appointment review' });
    }
};
