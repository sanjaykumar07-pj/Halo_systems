import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Workers ────────────────────────────────────────────
export async function getWorkers() {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .order('worker_id', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getDashboardStats() {
  const { data: workers, error } = await supabase
    .from('workers')
    .select('status, efficiency');
  if (error) throw error;

  const active = workers.filter((w) => w.status === 'on-duty').length;
  const incident = workers.filter((w) => w.status === 'completed').length;
  const effAvg = workers.length
    ? Math.round(workers.reduce((s, w) => s + w.efficiency, 0) / workers.length)
    : 0;

  const { count: totalProblems } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true });

  const { count: solved } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved');

  return {
    active_workers: active,
    incident_workers: incident,
    total_problems: totalProblems ?? 0,
    problem_solved: solved ?? 0,
    efficiency: effAvg,
  };
}

// ─── Incidents ───────────────────────────────────────────
export async function getIncidents() {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ─── Sections ────────────────────────────────────────────
export async function getSections() {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
}

// ─── Salary ──────────────────────────────────────────────
export async function getSalary() {
  const { data, error } = await supabase
    .from('salary')
    .select('*')
    .order('worker_name', { ascending: true });
  if (error) throw error;
  return data;
}

// ─── Analytics ───────────────────────────────────────────
export async function getAnalyticsEvents() {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

// ─── Realtime subscription for incidents ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subscribeToIncidents(callback: (payload: any) => void) {
  return supabase
    .channel(`incidents-changes-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, callback)
    .subscribe();
}

// ─── Mutations & Subscriptions ───────────────────────────
export async function updateIncidentStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('incidents')
    .update({ status })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function assignIncident(incidentId: string, workerDbId: string, instructions: string) {
  // 1. Insert into incident_assignments
  const { error: assignError } = await supabase
    .from('incident_assignments')
    .insert([{
      incident_id: incidentId,
      worker_id: workerDbId,
      status: 'assigned',
      instructions: instructions
    }]);
  if (assignError) throw assignError;

  // 2. Update incidents table
  const { data, error } = await supabase
    .from('incidents')
    .update({ 
      status: 'assigned',
      assigned_worker_id: workerDbId,
      assigned_at: new Date().toISOString()
    })
    .eq('id', incidentId)
    .select();
  if (error) throw error;
  return data;
}

export async function processAllPayments() {
  const { data, error } = await supabase
    .from('salary')
    .update({ payment_status: 'paid' })
    .eq('payment_status', 'pending')
    .select();
  if (error) throw error;
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subscribeToWorkers(callback: (payload: any) => void) {
  return supabase
    .channel(`workers-changes-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, callback)
    .subscribe();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subscribeToSalary(callback: (payload: any) => void) {
  return supabase
    .channel(`salary-changes-${Math.random()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'salary' }, callback)
    .subscribe();
}

export async function addWorker(workerData: { name: string, type: string, section: number, status: string, email: string }) {
  const worker_id = Math.floor(10000 + Math.random() * 90000).toString();
  const { data, error } = await supabase
    .from('workers')
    .insert([{ 
      worker_id, 
      name: workerData.name, 
      type: workerData.type, 
      section: workerData.section, 
      status: workerData.status,
      efficiency: 100 // default
    }])
    .select();
  if (error) throw error;
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateWorker(workerId: string, updates: any) {
  const { data, error } = await supabase
    .from('workers')
    .update(updates)
    .eq('worker_id', workerId)
    .select();
  if (error) throw error;
  return data;
}

export async function removeWorker(workerId: string) {
  const { data, error } = await supabase
    .from('workers')
    .delete()
    .eq('worker_id', workerId)
    .select();
  if (error) throw error;
  return data;
}
