# 👁️ OptiFlow - UCC Eye Clinic Management & Tele-Optometry Platform

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**OptiFlow** is an enterprise-grade clinical workflow and tele-optometry platform engineered specifically for the **University of Cape Coast (UCC) Eye Clinic**. Designed to serve both the **Main Campus** and **Old Site Annex**, OptiFlow streamlines patient intake, intelligent appointment scheduling, real-time queue management, multi-role clinical collaboration, interactive consultation analytics, and voice-assisted translations.

---

## 👥 System User Roles & Detailed Responsibilities

The OptiFlow ecosystem is built around 5 specialized user roles, ensuring smooth communication and clear division of responsibilities across the entire clinic workflow:

### 👨‍🎓 1. Patient / Student Portal
- **Target Users**: UCC Students, Staff, Faculty, and General Public Patients.
- **Detailed Responsibilities & Features**:
  - **Account Registration & OTP Verification**: Sign up using a verified email address with OTP security codes. Patients fill out complete profile information including contact numbers and occupation (e.g., *Student*, *Lecturer*, *Trader*, *Civil Servant*).
  - **Location-Aware Appointment Booking**: Choose between treatment at **Main Campus Clinic** or **Old Site Annex**.
  - **Smart Time-Slot Booking**: Select 1-hour time slots operating strictly between **8:00 AM and 4:00 PM**. Bookings automatically close at **3:00 PM** to allow doctors to finish consultations by 4:00 PM.
  - **Real-Time Queue & Status Tracking**: Monitor live appointment status on the dashboard (`Pending`, `Assigned`, `In Progress`, `Done`, or `Cancelled`).
  - **Instant Dashboard Notifications**: Receive automated push notifications when a receptionist assigns a doctor, when consultation starts/ends, or if a slot is closed by the clinic with an explanation.
  - **Patient Medical Dossier & History**: View personal onboarding data, calculated current age (computed from date of birth), and historical diagnosis records from past clinic visits.
  - **Doctor Rating & Review Submission**: After the doctor completes a consultation, patients unlock the ability to leave a 1-to-5 star rating and detailed written feedback on their care experience.
  - **Turn-by-Turn Campus Navigation Tour**: Interactive visual guide providing step-by-step route directions from 9 major UCC landmarks (Main Gate, Sam Jonah Library, Valco Hall, Casford Hall, Adehye Hall) straight to the Eye Clinic reception desk.

---

### 🛎️ 2. Receptionist Portal *(Front Desk Administration)*
- **Target Users**: Clinic Receptionists, Front-Desk Operations Staff, and Triage Administrators.
- **Detailed Responsibilities & Features**:
  - **Centralized Multi-Branch Queue Management**: Monitor all incoming patient check-ins and appointments across both Main Campus and Old Site Annex in real time.
  - **Location-Based Doctor Assignment**: Match incoming unassigned patient bookings to available optometrists based strictly on the selected clinic branch (Main Campus vs. Old Site).
  - **Doctor Daily Workload Quota Enforcement**: Monitor each doctor's daily assigned count to enforce the strict policy limit of **9 patients per doctor per day**, preventing practitioner burnout and ensuring quality patient care.
  - **Capacity Slot Management**: Open, modify, or close hourly time slots (8:00 AM – 4:00 PM) based on clinic operations.
  - **Slot Closure & Automated Patient Alerting**: When closing a slot (e.g. for staff meetings or emergency closures), receptionists can provide an optional closure reason. The system automatically cancels affected bookings and sends instant dashboard notification alerts to impacted patients.
  - **Live Patient Dossier Access**: View complete patient demographic info, calculated age, contact numbers, and occupation during physical check-in at the front desk.

---

### 🩺 3. Doctor / Optometrist Portal
- **Target Users**: Licensed Optometrists, Ophthalmologists, and Resident Doctors.
- **Detailed Responsibilities & Features**:
  - **Assigned Consultation Queue**: View today's patient queue assigned specifically to them by receptionists, filtered by location.
  - **Patient Dossier & Medical History**: Review patient age, occupation, past visual acuity readings, historical diagnoses, and clinical notes prior to calling the patient in.
  - **Pre-Examination Triage Vitals**: Inspect preliminary diagnostic data (Visual Acuity L/R, Intraocular Pressure IOP, Chief Complaint) recorded by Clinical Assistants.
  - **Live Consultation Stopwatch**: Clicking **"Start Consultation"** initiates an automatic timer that tracks exact time spent with the active patient.
  - **Real-Time Active Patient Status**: Updating a patient to *In Progress* immediately reflects on the Receptionist Dashboard so the front desk knows which patient is currently in the consultation room.
  - **Clinical Outcome Recording**: Document case types (e.g., *Refractive Errors*, *Glaucoma*, *Cataracts*, *Conjunctivitis*) and outcomes (e.g., *Prescribed Glasses*, *Medication Dispensed*, *Referred to Specialist*).
  - **Marking Patients "Done"**: Marking a patient as complete updates the Receptionist dashboard, stops the consultation timer, and enables post-consultation review submission on the patient portal.
  - **Automated Daily Queue Reset**: The doctor's active daily consultation dashboard automatically clears after 24 hours (overnight) to start fresh for the next clinical day.
  - **Doctor Analytics Dashboard**: Interactive visual charts rendering:
    - Total patients attended per day/week/month.
    - Average consultation duration per patient.
    - Case type distribution pie/bar charts.
    - Outcome ratios (referrals vs prescriptions).
    - Overall patient review ratings and feedback breakdown.

---

### 📋 4. Clinical Assistant / Doctor Assistant Portal
- **Target Users**: Ophthalmic Nurses, Optometry Interns, and Clinical Triage Assistants.
- **Detailed Responsibilities & Features**:
  - **Pre-Examination Triage & Vitals Logging**: Measure and record essential preliminary eye metrics before the doctor consultation, including Visual Acuity (e.g., `6/6`, `6/12`), Intraocular Pressure (`IOP in mmHg`), and primary patient complaints.
  - **Activity & Clinical Logging**: Log daily triage activities and attach findings directly to the patient's digital dossier.
  - **Doctor Collaboration**: Assist assigned optometrists by preparing patient charts and ensuring patient readiness in exam rooms.

---

### 👑 5. Super Administrator Portal
- **Target Users**: Eye Clinic Directors, IT Administrators, and Executive Management.
- **Detailed Responsibilities & Features**:
  - **Institutional Telemetry Overview**: High-level metrics monitoring total registered patients, overall system appointment counts, active staff members, and location performance.
  - **Staff Governance & Onboarding**: Create, edit, role-update (`Receptionist`, `Doctor`, `Clinical Assistant`, `Super Admin`), and delete staff accounts across the entire organization.
  - **Branch Location Allocation**: Assign new doctors and staff to their designated primary operating location (Main Campus vs Old Site Annex).
  - **Doctor-Assistant Pairings**: Assign or reassign clinical assistants to work directly under specific doctors.

---

### 🎙️ 6. Voice Translation AI Studio *(Special Feature)*
- **Real-Time Speech-to-Text (STT)**: Voice-driven dictation for doctors during clinical note-taking.
- **Multi-Lingual Translation**: Low-latency translation between local languages (e.g., Twi, Fante) and English to remove communication barriers during consultations.
- **Text-to-Speech (TTS)**: Auditory synthesis for patient instruction and prescription guidance.

---

## 🏗️ Architecture & Technology Stack

```mermaid
graph TD
    A[React 19 + Vite Frontend] -->|REST / HTTP| B[Node.js + Express API Backend]
    A -->|WebSockets| B
    B -->|PostgreSQL Pooler / WS| C[(Supabase PostgreSQL Database)]
    B -->|Confana SDK| D[Confana AI Engine - STT & Voice]
    B -->|Nodemailer| E[SMTP Email OTP Gateway]
```

### **Frontend**
- **Framework**: React 19 + Vite 8
- **Styling**: TailwindCSS v4
- **Icons**: Lucide React
- **State & Routing**: Component-driven architecture with context-based auth and notification providers.

### **Backend**
- **Runtime**: Node.js ES Modules + Express 4
- **Real-time Communication**: Native WebSockets (`ws`) for live STT audio streaming and agent voice sessions.
- **Database Client**: `pg` (PostgreSQL client) with Supabase connection pooling & `@supabase/supabase-js`.
- **Authentication**: Email OTP verification via Nodemailer + Supabase Auth.
- **AI Integration**: `@dexel-confana/confana-dev` SDK for voice recognition and translation.

---

## 📁 Repository Structure

```text
OptiFlow/
├── backend/
│   ├── db/
│   │   ├── migrate.js        # Automated schema & seed migration runner
│   │   ├── schema.sql        # Database tables, triggers, and constraints
│   │   └── seed.sql          # Seed data (capacity slots, campus locations, demo users)
│   ├── src/
│   │   ├── config/           # Database & Confana SDK configurations
│   │   ├── controllers/      # Auth, capacity, appointment, review, voice controllers
│   │   ├── routes/           # API endpoints routing definitions
│   │   ├── utils/            # Helper utilities (Email OTP, token generation)
│   │   └── server.js         # Main Express & WebSocket server initialization
│   ├── .env.example          # Environment variables template
│   └── package.json
│
├── frontend/
│   ├── public/               # Static assets & favicon
│   ├── src/
│   │   ├── assets/           # UI media & brand logos
│   │   ├── components/       # Dossier modals, analytics charts, custom selects, notifications
│   │   ├── context/          # Global application state contexts
│   │   ├── lib/              # Supabase & API utility clients
│   │   ├── pages/            # Multi-portal dashboards (Student, Doctor, Receptionist, Voice AI)
│   │   ├── App.jsx           # Root router & layout configuration
│   │   └── main.jsx          # React app entry point
│   └── package.json
│
├── info.txt                  # Project requirements & specifications
├── .gitignore                # Root Git ignore rules
└── README.md                 # System documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm** or **pnpm**
- **PostgreSQL Database** (or a free [Supabase](https://supabase.com/) project)

---

### 📦 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file inside `backend/` using `.env.example` as a reference:
   ```bash
   cp .env.example .env
   ```
   Fill in your PostgreSQL `DATABASE_URL`, Supabase API keys, and Email credentials:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://<user>:<password>@<host>:6543/postgres
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   ```

4. Run Database Migration & Seeding:
   ```bash
   npm run db:migrate
   ```

5. Start Backend Server:
   ```bash
   npm run dev
   ```
   The backend will start running on **`http://localhost:5000`**.

---

### 💻 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Vite Development Server:
   ```bash
   npm run dev
   ```
   The frontend application will be live at **`http://localhost:5173`**.

---

## 🔑 Demo Login Credentials

The database migration automatically seeds standard test accounts for rapid testing:

| Role | Email | Default Password | Location |
| :--- | :--- | :--- | :--- |
| **Receptionist** | `admin@gmail.com` | `Test` | Main Campus |
| **Doctor (Main Campus)** | `prince@gmail.com` | `Test` | Main Campus |
| **Doctor (Main Campus)** | `sarah@gmail.com` | `Test` | Main Campus |
| **Doctor (Main Campus)** | `emmanuel@gmail.com` | `Test` | Main Campus |
| **Doctor (Old Site)** | `maxwell@gmail.com` | `Test` | Old Site Annex |
| **Doctor (Old Site)** | `grace@gmail.com` | `Test` | Old Site Annex |
| **Doctor (Old Site)** | `daniel@gmail.com` | `Test` | Old Site Annex |
| **Patient / Student** | *(Self Sign-up with OTP)* | Custom | Main / Old Site |

---

## 🌐 API & WebSocket Reference

### Core REST Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & retrieve profile |
| `POST` | `/api/auth/send-otp` | Send email verification OTP code |
| `POST` | `/api/auth/verify-otp` | Verify OTP code & complete student registration |
| `GET` | `/api/capacity` | Fetch available clinic capacity time slots |
| `POST` | `/api/appointments` | Book new eye clinic appointment |
| `GET` | `/api/appointments/doctor/:doctorId` | Retrieve queue for specific doctor |
| `PATCH` | `/api/appointments/:id/start` | Start consultation (starts live timer) |
| `PATCH` | `/api/appointments/:id/complete` | Complete consultation & record outcomes |
| `GET` | `/api/appointments/doctor/:doctorId/analytics` | Fetch clinical case analytics & metrics |
| `POST` | `/api/reviews` | Submit patient doctor rating & review |

### WebSockets

- **Agent Voice Session**: `ws://localhost:5000/api/agent-session?agentId=<AGENT_ID>`
- **Real-Time STT Stream**: `ws://localhost:5000/api/stt-stream?language=en`

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 🤝 Acknowledgments & Authors
Developed for **University of Cape Coast (UCC) Eye Clinic** to modernize optometry services across campus.

- **Developer**: Prince Annan ([@princeannan4332](https://github.com/princeannan4332))
