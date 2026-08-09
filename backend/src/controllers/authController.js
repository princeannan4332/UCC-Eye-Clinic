import { pool } from '../config/db.js';
import { sendOtpEmail } from '../utils/mailer.js';

// In-memory OTP store: email -> { otp, expiresAt, fullName, password }
const otpStore = new Map();

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Doctor accounts dictionary with credentials
const DOCTOR_ACCOUNTS = {
    'prince@gmail.com': { id: '00000000-0000-4000-a000-000000000002', full_name: 'Dr. Prince', location: 'Main Campus' },
    'maxwell@gmail.com': { id: '00000000-0000-4000-a000-000000000003', full_name: 'Dr. Maxwell', location: 'Old Site' },
    'sarah@gmail.com': { id: '00000000-0000-4000-a000-000000000004', full_name: 'Dr. Sarah Mensah', location: 'Main Campus' },
    'emmanuel@gmail.com': { id: '00000000-0000-4000-a000-000000000005', full_name: 'Dr. Emmanuel Kojo', location: 'Main Campus' },
    'grace@gmail.com': { id: '00000000-0000-4000-a000-000000000006', full_name: 'Dr. Grace Amoah', location: 'Old Site' },
    'daniel@gmail.com': { id: '00000000-0000-4000-a000-000000000007', full_name: 'Dr. Daniel Osei', location: 'Old Site' }
};

export const validateLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ error: 'Email address is required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ error: 'Invalid email address format (e.g., patient@gmail.com).' });
        }

        if (!password || typeof password !== 'string' || !password.trim()) {
            return res.status(400).json({ error: 'Password is required.' });
        }

        const cleanPass = password.trim();
        if (cleanPass.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
        }

        // 1. Super Admin Authentication Check
        if (cleanEmail === 'superadmin@gmail.com') {
            if (cleanPass !== 'Test' && cleanPass.toLowerCase() !== 'test') {
                return res.status(401).json({ error: 'Invalid password for Super Admin. Default password is "Test".' });
            }

            const superAdminId = '00000000-0000-4000-a000-000000000000';
            const superAdminProfile = {
                id: superAdminId,
                email: 'superadmin@gmail.com',
                full_name: 'Super Admin',
                role: 'superadmin',
                onboarding_completed: true
            };

            await pool.query(`
                INSERT INTO profiles (id, email, full_name, role, onboarding_completed)
                VALUES ($1, $2, $3, $4, TRUE)
                ON CONFLICT (email) DO UPDATE SET role = 'superadmin', onboarding_completed = TRUE
                RETURNING *;
            `, [superAdminId, 'superadmin@gmail.com', 'Super Admin', 'superadmin']).catch(() => {});

            return res.status(200).json({
                message: 'Super Admin authentication successful',
                profile: superAdminProfile,
                user: { id: superAdminId, email: 'superadmin@gmail.com' }
            });
        }

        // 2. Admin Authentication Check
        if (cleanEmail === 'admin@gmail.com') {
            if (cleanPass !== 'Test' && cleanPass.toLowerCase() !== 'test') {
                return res.status(401).json({ error: 'Invalid password for Clinic Administrator. Default password is "Test".' });
            }

            const adminId = '00000000-0000-4000-a000-000000000001';
            const adminProfile = {
                id: adminId,
                email: 'admin@gmail.com',
                full_name: 'Clinic Admin',
                role: 'admin',
                onboarding_completed: true
            };

            await pool.query(`
                INSERT INTO profiles (id, email, full_name, role, onboarding_completed)
                VALUES ($1, $2, $3, $4, TRUE)
                ON CONFLICT (email) DO UPDATE SET role = 'admin', onboarding_completed = TRUE
                RETURNING *;
            `, [adminId, 'admin@gmail.com', 'Clinic Admin', 'admin']).catch(() => {});

            return res.status(200).json({
                message: 'Admin authentication successful',
                profile: adminProfile,
                user: { id: adminId, email: 'admin@gmail.com' }
            });
        }

        // 3. Preconfigured Doctor Accounts Check
        if (DOCTOR_ACCOUNTS[cleanEmail]) {
            if (cleanPass !== 'Test' && cleanPass.toLowerCase() !== 'test') {
                return res.status(401).json({ error: `Invalid password for ${DOCTOR_ACCOUNTS[cleanEmail].full_name}. Default password is "Test".` });
            }

            const docInfo = DOCTOR_ACCOUNTS[cleanEmail];

            // Upsert doctor profile — use email as the conflict key
            await pool.query(`
                INSERT INTO profiles (id, email, full_name, role, assigned_location, onboarding_completed)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                ON CONFLICT (email) DO UPDATE SET role = 'doctor', assigned_location = $5, onboarding_completed = TRUE
                RETURNING *;
            `, [docInfo.id, cleanEmail, docInfo.full_name, 'doctor', docInfo.location]).catch(() => {});

            // Always fetch the REAL profile row from DB (the id may differ if it was created earlier)
            const realProfileRes = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [cleanEmail]);
            const realProfile = realProfileRes.rows[0] || {
                id: docInfo.id,
                email: cleanEmail,
                full_name: docInfo.full_name,
                role: 'doctor',
                assigned_location: docInfo.location,
                onboarding_completed: true
            };

            return res.status(200).json({
                message: 'Doctor authentication successful',
                profile: realProfile,
                user: { id: realProfile.id, email: cleanEmail }
            });
        }

        // 4. Database User & Dynamically Added Staff Authentication Check
        const dbResult = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [cleanEmail]);
        if (dbResult.rows.length > 0) {
            const existingProfile = dbResult.rows[0];

            // If user is Staff (doctor, doctor_assistant, admin, superadmin), authenticate with password 'Test'
            if (['doctor', 'doctor_assistant', 'admin', 'superadmin'].includes(existingProfile.role)) {
                if (cleanPass !== 'Test' && cleanPass.toLowerCase() !== 'test') {
                    return res.status(401).json({ error: `Invalid password for ${existingProfile.full_name || 'Staff'}. Default password is "Test".` });
                }

                return res.status(200).json({
                    message: `${existingProfile.role} authentication successful`,
                    requiresOtp: false,
                    profile: existingProfile,
                    user: { id: existingProfile.id, email: existingProfile.email }
                });
            }

            // Normal Patient -> Requires Email OTP Verification
            const otp = generateOtp();
            const expiresAt = Date.now() + 10 * 60 * 1000;
            otpStore.set(cleanEmail, {
                otp,
                expiresAt,
                profile: existingProfile,
                user: { id: existingProfile.id, email: existingProfile.email },
                type: 'login'
            });

            // Send OTP Email to patient
            await sendOtpEmail(cleanEmail, otp, existingProfile.full_name || 'Patient');

            console.log(`📧 Patient login OTP sent to ${cleanEmail}`);
            return res.status(200).json({
                message: 'OTP verification code sent to your email.',
                requiresOtp: true,
                email: cleanEmail
            });
        }

        // Account does not exist in database
        return res.status(404).json({
            error: `Account not found. No registered account exists with '${cleanEmail}'. Please register an account first.`
        });



    } catch (err) {
        console.error('Error during login validation:', err);
        return res.status(500).json({ error: 'Server authentication validation error.' });
    }
};

const validatePhoneString = (phone, fieldLabel = 'phone number') => {
    if (!phone) return null;
    const cleaned = String(phone).trim().replace(/[\s\-\(\)]/g, '');
    if (!cleaned) return null;

    if (/^(\d)\1+$/.test(cleaned)) {
        return `Dummy repetitive numbers for ${fieldLabel} are invalid.`;
    }

    if (cleaned.startsWith('0')) {
        if (!/^\d+$/.test(cleaned)) {
            return `The ${fieldLabel} contains invalid non-numeric characters.`;
        }
        if (cleaned.length !== 10) {
            return `The ${fieldLabel} must be exactly 10 digits long (you provided ${cleaned.length} digits). Example: 0241234567.`;
        }
        return null;
    }

    if (cleaned.startsWith('+233')) {
        if (!/^\+233\d{9}$/.test(cleaned)) {
            return `Ghanaian international ${fieldLabel} must be +233 followed by 9 digits (e.g. +233241234567).`;
        }
        return null;
    }

    if (cleaned.startsWith('233')) {
        if (!/^233\d{9}$/.test(cleaned)) {
            return `Ghanaian ${fieldLabel} starting with 233 must be 12 digits long (e.g. 233241234567).`;
        }
        return null;
    }

    if (cleaned.startsWith('+')) {
        if (!/^\+[1-9]\d{8,13}$/.test(cleaned)) {
            return `Invalid international ${fieldLabel} format (e.g. +233241234567).`;
        }
        return null;
    }

    if (!/^\d{10}$/.test(cleaned)) {
        return `The ${fieldLabel} must be exactly 10 digits long (e.g. 0241234567).`;
    }

    return null;
};


export const syncUserProfile = async (req, res) => {
    try {
        const { id, email, full_name, role, phone, assigned_location } = req.body;
        if (!id || !email || !role) {
            return res.status(400).json({ error: 'Missing required user profile fields (id, email, role)' });
        }

        if (phone) {
            const phoneErr = validatePhoneString(phone, 'phone number');
            if (phoneErr) {
                return res.status(400).json({ error: phoneErr });
            }
        }

        const query = `
            INSERT INTO profiles (id, email, full_name, role, phone, assigned_location)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) 
            DO UPDATE SET 
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role,
                phone = COALESCE(EXCLUDED.phone, profiles.phone),
                assigned_location = COALESCE(EXCLUDED.assigned_location, profiles.assigned_location)
            RETURNING *;
        `;
        const values = [id, email, full_name || email.split('@')[0], role, phone || null, assigned_location || 'Main Campus'];
        const result = await pool.query(query, values);

        console.log(`✅ Saved profile into DB: ${email} (${role})`);
        return res.status(200).json({ message: 'Profile synced successfully', profile: result.rows[0] });
    } catch (err) {
        console.error('Error syncing user profile:', err);
        return res.status(500).json({ error: 'Failed to sync user profile' });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            dob,
            gender,
            is_student,
            student_id,
            occupation,
            allergies,
            medical_conditions,
            current_medications,
            blood_group,
            emergency_contact,
            personal_contact
        } = req.body;

        const personalPhoneErr = validatePhoneString(personal_contact, 'personal phone contact');
        if (personalPhoneErr) {
            return res.status(400).json({ error: personalPhoneErr });
        }

        const emergencyPhoneErr = validatePhoneString(emergency_contact, 'emergency contact phone');
        if (emergencyPhoneErr) {
            return res.status(400).json({ error: emergencyPhoneErr });
        }


        const query = `
            UPDATE profiles
            SET 
                dob = $1,
                gender = $2,
                is_student = $3,
                student_id = $4,
                occupation = $5,
                allergies = $6,
                medical_conditions = $7,
                current_medications = $8,
                blood_group = $9,
                emergency_contact = $10,
                personal_contact = $11,
                phone = $11,
                onboarding_completed = TRUE
            WHERE id = $12
            RETURNING *;
        `;
        const values = [
            dob || null,
            gender || null,
            is_student !== undefined ? is_student : true,
            student_id || null,
            occupation || 'Student',
            allergies || null,
            medical_conditions || null,
            current_medications || null,
            blood_group || 'None',
            emergency_contact || null,
            personal_contact || null,
            id
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        console.log(`✅ Updated onboarding profile for user ID: ${id}`);
        return res.status(200).json({ message: 'Profile updated successfully', profile: result.rows[0] });
    } catch (err) {
        console.error('Error updating user profile:', err);
        return res.status(500).json({ error: 'Failed to update user profile' });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        return res.status(200).json({ profile: result.rows[0] });
    } catch (err) {
        console.error('Error getting user profile:', err);
        return res.status(500).json({ error: 'Failed to retrieve profile' });
    }
};

export const getProfileByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const result = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = LOWER($1)', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        return res.status(200).json({ profile: result.rows[0] });
    } catch (err) {
        console.error('Error getting profile by email:', err);
        return res.status(500).json({ error: 'Failed to retrieve profile' });
    }
};

export const getDoctors = async (req, res) => {
    try {
        const { location } = req.query;
        let query = `
            SELECT p.id, p.email, p.full_name, p.role, p.phone, p.assigned_location, p.supervisor_doctor_id, COALESCE(p.is_available, true) as is_available,
                   d.full_name as supervisor_doctor_name
            FROM profiles p
            LEFT JOIN profiles d ON p.supervisor_doctor_id = d.id
            WHERE p.role IN ('doctor', 'doctor_assistant')
        `;
        const params = [];
        if (location) {
            query += ` AND (p.assigned_location = $1 OR p.assigned_location IS NULL)`;
            params.push(location);
        }
        query += ` ORDER BY p.role ASC, p.full_name ASC;`;
        
        const result = await pool.query(query, params);
        return res.status(200).json({ doctors: result.rows });
    } catch (err) {
        console.error('Error fetching doctors and assistants list:', err);
        return res.status(500).json({ error: 'Failed to retrieve doctors list' });
    }
};

// ── PATCH Update Doctor Availability (Available vs Unavailable) ─────────────
export const updateDoctorAvailability = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { is_available } = req.body;

        const updateRes = await pool.query(`
            UPDATE profiles
            SET is_available = $1
            WHERE id = $2 AND role IN ('doctor', 'doctor_assistant')
            RETURNING *;
        `, [Boolean(is_available), doctorId]);

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor profile not found.' });
        }

        return res.status(200).json({
            message: `Availability status updated to ${is_available ? 'Available' : 'Unavailable'}.`,
            profile: updateRes.rows[0]
        });
    } catch (err) {
        console.error('Error updating doctor availability:', err);
        return res.status(500).json({ error: 'Failed to update doctor availability.' });
    }
};

// ── OTP: Send Verification Email ──────────────────────────────────────────────
export const sendVerificationOtp = async (req, res) => {
    try {
        const { email, fullName, password } = req.body;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ error: 'Email address is required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ error: 'Invalid email address format.' });
        }

        // Try querying DB for existing profile (with safe fallback)
        let existingProfile = null;
        try {
            const existing = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [cleanEmail]);
            if (existing.rows.length > 0) {
                existingProfile = existing.rows[0];
            }
        } catch (dbErr) {
            console.warn('⚠️ DB lookup warning in sendVerificationOtp:', dbErr.message);
        }

        if (existingProfile) {
            if (existingProfile.is_verified) {
                return res.status(409).json({ error: `An account with '${cleanEmail}' is already registered and verified. Please sign in.` });
            }

            if (fullName && fullName.trim()) {
                pool.query('UPDATE profiles SET full_name = $1 WHERE id = $2', [fullName.trim(), existingProfile.id]).catch(() => {});
                existingProfile.full_name = fullName.trim();
            }

            const otp = generateOtp();
            const expiresAt = Date.now() + 10 * 60 * 1000;
            otpStore.set(cleanEmail, {
                otp,
                expiresAt,
                profile: existingProfile,
                user: { id: existingProfile.id, email: existingProfile.email },
                type: 'login'
            });

            await sendOtpEmail(cleanEmail, otp, existingProfile.full_name || 'Patient');
            console.log(`📧 Sent OTP to unverified user: ${cleanEmail}`);
            return res.status(200).json({ message: 'Verification code sent to your email address.' });
        }

        // Fresh Registration: Validate full name & password
        if (!fullName || !fullName.trim() || fullName.trim().length < 2) {
            return res.status(400).json({ error: 'Please enter your full name (minimum 2 characters).' });
        }

        if (!password || typeof password !== 'string' || password.trim().length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
        }

        const newId = (() => {
            try { return crypto.randomUUID(); } catch (e) {
                return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            }
        })();

        let createdProfile = {
            id: newId,
            email: cleanEmail,
            full_name: fullName.trim(),
            role: 'student',
            onboarding_completed: false,
            is_verified: false
        };

        try {
            const insertQuery = `
                INSERT INTO profiles (id, email, full_name, role, onboarding_completed, is_verified)
                VALUES ($1, $2, $3, 'student', FALSE, FALSE)
                ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
                RETURNING *;
            `;
            const insertRes = await pool.query(insertQuery, [newId, cleanEmail, fullName.trim()]);
            if (insertRes.rows.length > 0) {
                createdProfile = insertRes.rows[0];
            }
        } catch (dbErr) {
            console.warn('⚠️ DB profile insert warning in sendVerificationOtp:', dbErr.message);
        }

        // Generate and store OTP (10-minute expiry)
        const otp = generateOtp();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        otpStore.set(cleanEmail, {
            otp,
            expiresAt,
            profile: createdProfile,
            user: { id: createdProfile.id, email: createdProfile.email },
            type: 'signup'
        });

        // Send OTP email via Nodemailer
        await sendOtpEmail(cleanEmail, otp, fullName.trim());

        console.log(`📧 Registration OTP sent to ${cleanEmail}`);
        return res.status(200).json({ message: 'Verification code sent to your email address.' });

    } catch (err) {
        console.error('Error sending OTP:', err);
        return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }
};

// ── OTP: Verify Code and Mark Account Verified ─────────────────────────────────
export const verifyOtpAndRegister = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP code are required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanOtp = String(otp).trim();

        const stored = otpStore.get(cleanEmail);

        if (!stored) {
            return res.status(400).json({ error: 'No verification code found for this email. Please request a new code.' });
        }

        if (Date.now() > stored.expiresAt) {
            otpStore.delete(cleanEmail);
            return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
        }

        if (cleanOtp !== stored.otp) {
            return res.status(400).json({ error: 'Incorrect verification code. Please check your email and try again.' });
        }

        // OTP is valid! Mark profile as verified in database
        otpStore.delete(cleanEmail);

        let finalProfile = stored.profile || {
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            email: cleanEmail,
            role: 'student',
            onboarding_completed: false,
            is_verified: true
        };

        try {
            const updateRes = await pool.query(
                `INSERT INTO profiles (id, email, full_name, role, onboarding_completed, is_verified)
                 VALUES ($1, $2, $3, 'student', FALSE, TRUE)
                 ON CONFLICT (email) DO UPDATE SET is_verified = TRUE
                 RETURNING *;`,
                [finalProfile.id || crypto.randomUUID(), cleanEmail, finalProfile.full_name || cleanEmail.split('@')[0]]
            );
            if (updateRes.rows.length > 0) {
                finalProfile = updateRes.rows[0];
            }
        } catch (dbErr) {
            console.warn('⚠️ DB profile update warning in verifyOtpAndRegister:', dbErr.message);
            finalProfile.is_verified = true;
        }

        console.log(`✅ Email verified for patient: ${cleanEmail}`);
        return res.status(200).json({
            message: 'Email verified successfully. Authentication complete.',
            profile: finalProfile,
            user: { id: finalProfile.id, email: finalProfile.email }
        });

    } catch (err) {
        console.error('Error verifying OTP:', err);
        return res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
};



