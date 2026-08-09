import express from 'express';
import { validateLogin, syncUserProfile, getUserProfile, getProfileByEmail, updateUserProfile, getDoctors, sendVerificationOtp, verifyOtpAndRegister, updateDoctorAvailability } from '../controllers/authController.js';

import { getAvailableCapacity, createCapacitySlot, updateCapacitySlot, deleteCapacitySlot, reopenCapacitySlot } from '../controllers/capacityController.js';
import { 
    createAppointment, 
    getStudentAppointments, 
    getDoctorAppointments, 
    getAllAppointments, 
    updateAppointmentStatus, 
    cancelStudentAppointment,
    startConsultation,
    completeConsultation,
    getDoctorAnalytics,
    getPatientHistory,
    assignPatientToAssistant
} from '../controllers/appointmentController.js';
import { submitReview, getDoctorReviews, getAppointmentReview } from '../controllers/reviewController.js';
import { getStudentNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { getCampusLocations } from '../controllers/navigationController.js';
import multer from 'multer';
import { translateTextOrAudio, streamTranslation, synthesizeSpeech } from '../controllers/voiceController.js';

import { getSystemOverview, getAllStaff, createStaffMember, deleteStaffMember, updateStaffRole } from '../controllers/superAdminController.js';
import { getAssistantOverview, getAssistantStats, logAssistantActivity, updatePreExamVitals, getDoctorAssistantLogs, removeDoctorAssistant } from '../controllers/assistantController.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();


// Auth & User routes
router.post('/auth/login', validateLogin);
router.post('/auth/sync', syncUserProfile);
router.post('/auth/send-otp', sendVerificationOtp);
router.post('/auth/verify-otp', verifyOtpAndRegister);
router.get('/auth/profile/:id', getUserProfile);
router.get('/auth/profile/by-email/:email', getProfileByEmail);
router.put('/auth/profile/:id', updateUserProfile);
router.get('/doctors', getDoctors);
router.patch('/doctor/:doctorId/availability', updateDoctorAvailability);
router.patch('/appointments/:id/assign-assistant', assignPatientToAssistant);

// Super Admin routes
router.get('/superadmin/overview', getSystemOverview);
router.get('/superadmin/staff', getAllStaff);
router.post('/superadmin/staff', createStaffMember);
router.patch('/superadmin/staff/:id/role', updateStaffRole);
router.delete('/superadmin/staff/:id', deleteStaffMember);

// Assistant routes
router.get('/assistant/:assistantId/overview', getAssistantOverview);
router.get('/assistant/:assistantId/stats', getAssistantStats);
router.post('/assistant/activity', logAssistantActivity);
router.patch('/assistant/appointments/:appointmentId/vitals', updatePreExamVitals);
router.get('/doctor/:doctorId/assistant-logs', getDoctorAssistantLogs);
router.delete('/doctor/:doctorId/assistants/:assistantId', removeDoctorAssistant);

// Capacity routes
router.get('/capacity', getAvailableCapacity);
router.post('/capacity', createCapacitySlot);
router.put('/capacity/:id', updateCapacitySlot);
router.put('/capacity/:id/reopen', reopenCapacitySlot);
router.delete('/capacity/:id', deleteCapacitySlot);

// Appointment routes
router.post('/appointments', createAppointment);
router.get('/appointments/student/:studentId', getStudentAppointments);
router.get('/appointments/patient/:studentId/history', getPatientHistory);
router.get('/appointments/doctor/:doctorId', getDoctorAppointments);
router.get('/appointments/doctor/:doctorId/analytics', getDoctorAnalytics);
router.get('/appointments/admin', getAllAppointments);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.patch('/appointments/:id/start', startConsultation);
router.patch('/appointments/:id/complete', completeConsultation);
router.patch('/appointments/:id/cancel', cancelStudentAppointment);

// Review routes
router.post('/reviews', submitReview);
router.get('/reviews/doctor/:doctorId', getDoctorReviews);
router.get('/reviews/appointment/:appointmentId', getAppointmentReview);

// Notification routes
router.get('/notifications/:studentId', getStudentNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// Navigation routes
router.get('/campus-locations', getCampusLocations);

// Voice Translation & Synthesis routes
router.post('/translate', upload.single('audio'), translateTextOrAudio);
router.get('/translate/stream', streamTranslation);
router.post('/tts', upload.single('refAudio'), synthesizeSpeech);

export default router;
