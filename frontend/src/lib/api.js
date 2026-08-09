const API_BASE = '/api';

const safeFetch = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        const contentType = res.headers.get('content-type');
        let data = {};
        if (contentType && contentType.includes('application/json')) {
            data = await res.json().catch(() => ({}));
        } else {
            const text = await res.text().catch(() => '');
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { message: text };
            }
        }
        if (!res.ok) {
            return {
                error: data.error || data.message || `Server error (${res.status}). Please try again.`
            };
        }
        return data;
    } catch (err) {
        console.error(`API Fetch Error [${url}]:`, err);
        return {
            error: 'Network connection issue or server unavailable. Please try again.'
        };
    }
};

export const api = {
    // Auth Validation & Login
    loginUser: async (email, password) => {
        return safeFetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    },

    // Auth Profile Sync
    syncProfile: async (userData) => {

        return safeFetch(`${API_BASE}/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
    },

    // OTP: Send verification code
    sendOtp: async (email, fullName, password) => {
        return safeFetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, fullName, password })
        });
    },

    // OTP: Verify code and create account
    verifyOtp: async (email, otp) => {
        return safeFetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
    },


    updateProfile: async (userId, profileData) => {
        return safeFetch(`${API_BASE}/auth/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
    },

    getProfile: async (userId) => {
        return safeFetch(`${API_BASE}/auth/profile/${userId}`);
    },

    getProfileByEmail: async (email) => {
        return safeFetch(`${API_BASE}/auth/profile/by-email/${encodeURIComponent(email)}`);
    },

    // Capacity / Slots
    getCapacity: async (location = '', include_inactive = false) => {
        const params = new URLSearchParams();
        if (location) params.append('location', location);
        if (include_inactive) params.append('include_inactive', 'true');
        const query = params.toString() ? `?${params.toString()}` : '';
        return safeFetch(`${API_BASE}/capacity${query}`);
    },

    createCapacity: async (slotData) => {
        return safeFetch(`${API_BASE}/capacity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slotData)
        });
    },

    updateCapacity: async (id, slotData) => {
        return safeFetch(`${API_BASE}/capacity/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slotData)
        });
    },

    reopenCapacity: async (id) => {
        return safeFetch(`${API_BASE}/capacity/${id}/reopen`, {
            method: 'PUT'
        });
    },

    deleteCapacity: async (id, closure_reason = '') => {
        return safeFetch(`${API_BASE}/capacity/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ closure_reason })
        });
    },

    // Appointments
    bookAppointment: async (appointmentData) => {
        return safeFetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
    },

    getStudentAppointments: async (studentId) => {
        return safeFetch(`${API_BASE}/appointments/student/${studentId}`);
    },

    getPatientHistory: async (studentId) => {
        return safeFetch(`${API_BASE}/appointments/patient/${studentId}/history`);
    },

    getAllAppointments: async () => {
        return safeFetch(`${API_BASE}/appointments/admin`);
    },

    updateAppointmentStatus: async (appointmentId, statusData) => {
        return safeFetch(`${API_BASE}/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statusData)
        });
    },

    startConsultation: async (appointmentId) => {
        return safeFetch(`${API_BASE}/appointments/${appointmentId}/start`, {
            method: 'PATCH'
        });
    },

    completeConsultation: async (appointmentId, payload) => {
        return safeFetch(`${API_BASE}/appointments/${appointmentId}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    cancelAppointment: async (appointmentId, studentId, reason) => {
        return safeFetch(`${API_BASE}/appointments/${appointmentId}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, reason })
        });
    },

    // Doctor Analytics
    getDoctorAnalytics: async (doctorId, month = '') => {
        const url = month && month !== 'all' 
            ? `${API_BASE}/appointments/doctor/${doctorId}/analytics?month=${encodeURIComponent(month)}` 
            : `${API_BASE}/appointments/doctor/${doctorId}/analytics`;
        return safeFetch(url);
    },

    // Reviews & Ratings
    submitReview: async (reviewData) => {
        return safeFetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
    },

    getDoctorReviews: async (doctorId) => {
        return safeFetch(`${API_BASE}/reviews/doctor/${doctorId}`);
    },

    getAppointmentReview: async (appointmentId) => {
        return safeFetch(`${API_BASE}/reviews/appointment/${appointmentId}`);
    },

    // Notifications
    getNotifications: async (studentId) => {
        return safeFetch(`${API_BASE}/notifications/${studentId}`);
    },

    markNotificationRead: async (notifId) => {
        return safeFetch(`${API_BASE}/notifications/${notifId}/read`, {
            method: 'PATCH'
        });
    },

    // Doctors
    getDoctors: async (location = '') => {
        const query = location ? `?location=${encodeURIComponent(location)}` : '';
        return safeFetch(`${API_BASE}/doctors${query}`);
    },

    getDoctorAppointments: async (doctorId) => {
        return safeFetch(`${API_BASE}/appointments/doctor/${doctorId}`);
    },

    // Navigation Locations
    getCampusLocations: async () => {
        return safeFetch(`${API_BASE}/campus-locations`);
    },

    // Voice Translation & Synthesis (Dexel Confana ASR, LLM, TTS)
    translateVoiceOrText: async (payload) => {
        return safeFetch(`${API_BASE}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    translateAudioFile: async (formData) => {
        try {
            const res = await fetch(`${API_BASE}/translate`, {
                method: 'POST',
                body: formData
            });
            return await res.json();
        } catch (err) {
            console.error('Audio translate error:', err);
            return { error: 'Failed to process audio recording' };
        }
    },

    synthesizeTTS: async (payload) => {
        try {
            let res;
            if (payload instanceof FormData) {
                res = await fetch(`${API_BASE}/tts`, {
                    method: 'POST',
                    body: payload
                });
            } else {
                res = await fetch(`${API_BASE}/tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && (contentType.includes('audio') || contentType.includes('octet-stream'))) {
                    const blob = await res.blob();
                    return { audioUrl: URL.createObjectURL(blob) };
                } else {
                    const data = await res.json().catch(() => ({}));
                    return data;
                }
            }
            return { error: 'TTS synthesis network error' };
        } catch (err) {
            console.error('TTS Audio synthesis error:', err);
            return { error: 'TTS synthesis network error' };
        }
    },

    // Super Admin APIs
    getSuperAdminOverview: async () => {
        return safeFetch(`${API_BASE}/superadmin/overview`);
    },

    getAllStaff: async () => {
        return safeFetch(`${API_BASE}/superadmin/staff`);
    },

    createStaffMember: async (staffData) => {
        return safeFetch(`${API_BASE}/superadmin/staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staffData)
        });
    },

    deleteStaffMember: async (staffId) => {
        return safeFetch(`${API_BASE}/superadmin/staff/${staffId}`, {
            method: 'DELETE'
        });
    },

    updateStaffRole: async (staffId, roleData) => {
        return safeFetch(`${API_BASE}/superadmin/staff/${staffId}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roleData)
        });
    },

    // Doctor Assistant APIs
    getAssistantOverview: async (assistantId) => {
        return safeFetch(`${API_BASE}/assistant/${assistantId}/overview`);
    },

    logAssistantActivity: async (logData) => {
        return safeFetch(`${API_BASE}/assistant/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
        });
    },

    updatePreExamVitals: async (appointmentId, vitalsData) => {
        return safeFetch(`${API_BASE}/assistant/appointments/${appointmentId}/vitals`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vitalsData)
        });
    },

    getDoctorAssistantLogs: async (doctorId) => {
        return safeFetch(`${API_BASE}/doctor/${doctorId}/assistant-logs`);
    },

    getAssistantStats: async (assistantId) => {
        return safeFetch(`${API_BASE}/assistant/${assistantId}/stats`);
    },

    removeDoctorAssistant: async (doctorId, assistantId) => {
        return safeFetch(`${API_BASE}/doctor/${doctorId}/assistants/${assistantId}`, {
            method: 'DELETE'
        });
    },

    updateDoctorAvailability: async (doctorId, is_available) => {
        return safeFetch(`${API_BASE}/doctor/${doctorId}/availability`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available })
        });
    },

    assignPatientToAssistant: async (appointmentId, payload) => {
        return safeFetch(`${API_BASE}/appointments/${appointmentId}/assign-assistant`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },
};
