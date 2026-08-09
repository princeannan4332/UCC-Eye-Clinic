import { pool } from '../config/db.js';

export const getCampusLocations = async (req, res) => {
    try {
        const query = `SELECT * FROM campus_locations ORDER BY name ASC`;
        const result = await pool.query(query);
        return res.status(200).json({ locations: result.rows });
    } catch (err) {
        console.error('Error fetching campus locations:', err);
        return res.status(500).json({ error: 'Failed to fetch campus locations' });
    }
};
