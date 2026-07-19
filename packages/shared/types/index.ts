// ─── User & Auth ───────────────────────────────────────────

export type UserRole = 'admin' | 'staff' | 'fan';

export interface User {
  id: string;
  email: string;
  client_id: string;
  role: UserRole;
  full_name: string;
  language: string;
  avatar_url?: string;
  created_at: string;
}

// ─── Worker ────────────────────────────────────────────────

export type WorkerType = 'janitor' | 'medic' | 'security';
export type WorkerStatus = 'on-duty' | 'completed' | 'off-duty' | 'retired';

export interface Worker {
  id: string;
  worker_id: string;       // e.g. "10001"
  user_id: string;
  name: string;
  type: WorkerType;
  section: number;
  status: WorkerStatus;
  efficiency: number;       // 0-100 percentage
  location_lat?: number;
  location_lng?: number;
  language: string;
  created_at: string;
}

// ─── Incident ──────────────────────────────────────────────

export type IncidentType = 'spill' | 'medical' | 'security' | 'fire' | 'structural' | 'noise' | 'accessibility' | 'other';
export type IncidentSeverity = 1 | 2 | 3 | 4 | 5; // 1 = critical, 5 = trivial
export type IncidentStatus = 'new' | 'processing' | 'assigned' | 'in-progress' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  reported_by: string;       // user_id of fan
  reporter_name: string;
  raw_text: string;          // original message in any language
  detected_language: string;
  english_translation: string;
  parsed_type: IncidentType;
  severity: IncidentSeverity;
  section_id?: number;
  location_description: string;
  status: IncidentStatus;
  assigned_worker_id?: string;
  assigned_at?: string;
  resolved_at?: string;
  eta_minutes?: number;
  confidence: number;        // AI confidence 0-1
  ai_reasoning?: string;     // Added reasoning from AI
  created_at: string;
}

// ─── Section ───────────────────────────────────────────────

export interface Section {
  id: number;
  name: string;
  capacity: number;
  current_occupancy: number;
  noise_level: number;       // 0-100 decibels normalized
  gate: string;
  floor: number;
  is_accessible: boolean;
  map_coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ─── Salary ────────────────────────────────────────────────

export type SalaryGrade = 'A' | 'B' | 'C' | 'D';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface Salary {
  id: string;
  worker_id: string;
  worker_name: string;
  grade: SalaryGrade;
  type: WorkerType;
  section: number;
  base_pay: number;
  bonus: number;
  total: number;
  payment_status: PaymentStatus;
  pay_period: string;        // e.g. "2026-07"
}

// ─── Notification ──────────────────────────────────────────

export type NotificationType = 'incident' | 'dispatch' | 'system' | 'alert';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ─── Dashboard Stats ───────────────────────────────────────

export interface DashboardStats {
  active_workers: number;
  incident_workers: number;
  total_problems: number;
  problem_solved: number;
  efficiency: number;
}

// ─── AI Pipeline Types ─────────────────────────────────────

export interface IntakeResult {
  original_text: string;
  detected_language: string;
  english_translation: string;
  incident_type: IncidentType;
  location: string;
  section_id: number | null;
  urgency_hint: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
}

export interface PrioritizedIncident {
  incident_id: string;
  severity: IncidentSeverity;
  is_duplicate: boolean;
  duplicate_of?: string;
  escalated: boolean;
  required_worker_type: WorkerType;
  reasoning: string;
}

export interface DispatchResult {
  incident_id: string;
  assigned_worker_id: string;
  worker_name: string;
  worker_type: WorkerType;
  distance_meters: number;
  eta_minutes: number;
  route_instructions: string;
  translated_message: string;
  target_language: string;
}
