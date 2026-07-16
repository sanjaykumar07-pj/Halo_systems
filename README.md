# 🏟️ HALO Stadium Operations Suite

Welcome to the **HALO Stadium Operations Suite** – a modern, real-time crisis and incident management system tailored for high-capacity environments like FIFA World Cup stadiums. 

This ecosystem bridges the gap between fans, on-the-ground staff, and the central command center, ensuring swift responses to emergencies, spills, security concerns, and structural issues.

---

## 🧩 Architecture

The HALO suite is built as a robust monorepo consisting of three interconnected applications, powered by a unified real-time backend.

### 1. 📱 FIFA Fan App (Mobile)
A React Native / Expo application designed for stadium attendees.
- **Multi-lingual Support**: Allow fans to report issues in their native languages.
- **One-Tap Emergency**: Instantly report critical incidents with geographic and categorical tagging.
- **Real-Time Tracking**: Provides fans with an ETA for staff arrival.

### 2. 🛠️ Ratio Staff App (Mobile)
A React Native / Expo application for on-duty janitors, security, and medics.
- **Live Dispatch**: Instantly receives new task assignments via Supabase Realtime subscriptions.
- **Task Management**: Workers can accept tasks, read specific instructions from Command, and mark issues as "Resolved".
- **Profile & Status**: Live syncing of worker efficiency, duty status, and current location.

### 3. 🖥️ Command Center (Web)
A Next.js high-performance dashboard for stadium commanders and administrative staff.
- **Global Overview**: View live statistics on active incidents, staff efficiency, and operational bottlenecks.
- **Incident Management**: Read fan reports, view AI-assisted translations, and dispatch specific staff members to resolve issues.
- **Analytics & Payroll**: Track staff performance and automate salary payments.

### 4. 🗄️ Supabase (Backend)
- **PostgreSQL Database**: Relational schemas connecting `users`, `incidents`, `workers`, `incident_assignments`, and `salary`.
- **Realtime**: WebSockets pushing instant state updates to the React Native apps and the Next.js dashboard.
- **Row Level Security (RLS)**: Enforces strict data access rules between Fans, Staff, and Admins.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI
- A Supabase project with the included SQL migrations applied.

### 1. Environment Setup
Create a `.env.local` file in `apps/command-center` and `.env` files in your mobile apps with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Running the Command Center
```bash
cd apps/command-center
npm install
npm run dev
```
Navigate to `http://localhost:3000` to view the dashboard.

### 3. Running the Mobile Apps
Open two separate terminal windows for the fan and staff apps.
```bash
# Terminal 1: Fan App
cd apps/fifa-fan
npm install
npx expo start -c

# Terminal 2: Staff App
cd apps/ratio-staff
npm install
npx expo start -c
```
Use the Expo Go app on your phone, or an iOS/Android simulator to view the applications.

---

## 🛡️ Key Features
- **Zero-Latency Dispatching**: Thanks to Supabase Realtime, when a fan reports an issue, the Command Center and Ratio Staff apps reflect the new data in milliseconds.
- **Professional Aesthetics**: Sleek dark-mode UIs, utilizing `lucide-react` and `ionicons` for a modern, distraction-free environment.
- **AI-Ready Architecture**: The database includes columns for AI-driven language translations and severity predictions (`english_translation`, `parsed_type`, `confidence`).

---

*Designed for maximum operational efficiency during critical stadium events.*
