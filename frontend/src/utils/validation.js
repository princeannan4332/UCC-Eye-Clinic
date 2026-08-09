/**
 * Validates phone numbers for OptiFlow.
 * Enforces exact 10-digit requirement for local Ghanaian numbers (e.g., 0241234567)
 * and strict formatting for +233 international numbers.
 *
 * @param {string} phone - Phone number input
 * @param {string} fieldName - Descriptive name of the phone field
 * @returns {string|null} Error string if invalid, null if valid
 */
export const validatePhoneNumber = (phone, fieldName = 'phone number') => {
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
        return `Please enter a valid ${fieldName}.`;
    }

    const cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');

    // Check for dummy repetitive numbers (e.g., 0000000000, 1111111111)
    if (/^(\d)\1+$/.test(cleaned)) {
        return `Please enter a valid, active ${fieldName} (dummy numbers like '${cleaned}' are invalid).`;
    }

    // Local numbers starting with 0 MUST be exactly 10 digits
    if (cleaned.startsWith('0')) {
        if (!/^\d+$/.test(cleaned)) {
            return `The ${fieldName} contains invalid characters.`;
        }
        if (cleaned.length !== 10) {
            return `The ${fieldName} must be exactly 10 digits long (you entered ${cleaned.length} digits). Example: 0241234567 or 0551234567.`;
        }
        return null;
    }

    // International numbers starting with +233 MUST be +233 followed by 9 digits
    if (cleaned.startsWith('+233')) {
        if (!/^\+233\d{9}$/.test(cleaned)) {
            return `Ghanaian international ${fieldName} must be +233 followed by 9 digits (e.g., +233241234567).`;
        }
        return null;
    }

    // Numbers starting with 233 without +
    if (cleaned.startsWith('233')) {
        if (!/^233\d{9}$/.test(cleaned)) {
            return `Ghanaian ${fieldName} starting with 233 must be 12 digits long (e.g., 233241234567).`;
        }
        return null;
    }

    // General international numbers starting with +
    if (cleaned.startsWith('+')) {
        if (!/^\+[1-9]\d{8,13}$/.test(cleaned)) {
            return `Please enter a valid international ${fieldName} (e.g., +233241234567).`;
        }
        return null;
    }

    // Default numeric check
    if (!/^\d{10}$/.test(cleaned)) {
        return `The ${fieldName} must be exactly 10 digits (e.g., 0241234567 or 0551234567).`;
    }

    return null;
};
