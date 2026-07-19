/**
 * Crisis-Bridge Pipeline Orchestrator
 * 
 * Chains Agent A → Agent B → Agent C to process a raw fan report
 * into a fully dispatched, translated incident with ETA.
 * 
 * Flow:
 * 1. Fan submits raw text (any language)
 * 2. Agent A: Parse → classify → translate
 * 3. Agent B: Score severity → detect duplicates → determine worker type
 * 4. Agent C: Find nearest worker → generate route → translate dispatch
 * 5. Result: Worker receives push notification in their language
 */

import { runIntakeAgent } from './agents/intake-agent';
import { runPrioritizerAgent } from './agents/prioritizer-agent';
import { runDispatcherAgent, findNearestWorker } from './agents/dispatcher-agent';
import type {
  IntakeResult,
  PrioritizedIncident,
  DispatchResult,
  Incident,
  Worker,
} from '@halo/shared';

export interface PipelineInput {
  rawText: string;
  reporterId: string;
  reporterName: string;
  geminiApiKey: string;
  recentIncidents: Incident[];
  availableWorkers: Worker[];
}

export interface PipelineResult {
  intake: IntakeResult;
  priority: PrioritizedIncident;
  dispatch: DispatchResult | null;
  error?: string;
}

/**
 * Sanitize and validate user-submitted text to prevent prompt injection 
 * and buffer overflows. 
 */
export function sanitizeInput(text: string): string {
  if (!text) return "";
  // Strip control characters and basic HTML tags to prevent injection/XSS
  let sanitized = text.replace(/[\x00-\x1F\x7F]/g, '');
  sanitized = sanitized.replace(/<[^>]*>?/g, '');
  
  // Prompt Injection Mitigations
  const adversarialKeywords = [
    /ignore previous instructions/gi,
    /ignore all previous instructions/gi,
    /system prompt/gi,
    /you are a /gi,
    /bypass instructions/gi
  ];
  for (const pattern of adversarialKeywords) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // Limit length to prevent DoS via massive context
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  return sanitized.trim();
}

// Caches for efficiency
const intakeCache = new Map<string, IntakeResult>();
const dispatchCache = new Map<string, DispatchResult>();

/**
 * Run the full Crisis-Bridge pipeline.
 * Returns structured results from all three agents.
 */
export async function runCrisisBridgePipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  // ── Input Validation & Sanitization ─────────────────────
  const sanitizedText = sanitizeInput(input.rawText);
  if (!sanitizedText) {
    return {
      intake: {} as IntakeResult,
      priority: {} as PrioritizedIncident,
      dispatch: null,
      error: "Input text is empty or invalid after sanitization."
    };
  }

  // ── Stage 1: Agent A — Intake ───────────────────────────
  let intake: IntakeResult;
  const normalizedInput = sanitizedText.toLowerCase();
  if (intakeCache.has(normalizedInput)) {
    intake = intakeCache.get(normalizedInput)!;
  } else {
    intake = await runIntakeAgent(sanitizedText, input.geminiApiKey);
    intakeCache.set(normalizedInput, intake);
  }

  // Generate a temporary ID for this incident
  const tempId = crypto.randomUUID();

  // ── Parallel Stage 2: Prioritizer & Worker Search ───────
  
  // Pre-filter recent incidents to save LLM context window tokens
  const relevantIncidents = input.recentIncidents.filter(
    (i) => i.parsed_type === intake.incident_type || i.section_id === intake.section_id
  );

  // Deterministically map worker type to search in parallel with AI prioritizer
  const typeToWorker: Record<string, string> = {
    medical: 'medic', fire: 'security', security: 'security',
    structural: 'security', spill: 'janitor', noise: 'janitor',
    accessibility: 'janitor', other: 'security',
  };
  const predictedWorkerType = typeToWorker[intake.incident_type] || 'security';

  const [priority, nearestWorker] = await Promise.all([
    runPrioritizerAgent(
      {
        incident_id: tempId,
        incident_type: intake.incident_type,
        english_translation: intake.english_translation,
        location: intake.location,
        section_id: intake.section_id,
        urgency_hint: intake.urgency_hint,
      },
      relevantIncidents,
      input.geminiApiKey
    ),
    Promise.resolve(findNearestWorker(
      input.availableWorkers,
      predictedWorkerType,
      intake.section_id
    ))
  ]);

  // Skip dispatch if duplicate
  if (priority.is_duplicate) {
    return { intake, priority, dispatch: null };
  }

  // Fallback if priority agent returned a DIFFERENT worker type than we predicted
  // (In 99% of cases, it won't, so we save time)
  let assignedWorker = nearestWorker;
  if (priority.required_worker_type !== predictedWorkerType) {
    assignedWorker = findNearestWorker(
      input.availableWorkers,
      priority.required_worker_type,
      intake.section_id
    );
  }

  if (!assignedWorker) {
    return {
      intake,
      priority,
      dispatch: null,
      error: `No available ${priority.required_worker_type} workers found`,
    };
  }

  // ── Stage 3: Agent C — Dispatcher ──────────────────────
  const dispatchCacheKey = `${intake.incident_type}:${intake.location}:${intake.section_id}:${assignedWorker.language}:${assignedWorker.section}`;
  let dispatch: DispatchResult;

  if (dispatchCache.has(dispatchCacheKey)) {
    // Clone and inject correct dynamic IDs
    dispatch = { 
      ...dispatchCache.get(dispatchCacheKey)!, 
      incident_id: tempId, 
      assigned_worker_id: assignedWorker.id, 
      worker_name: assignedWorker.name, 
      worker_type: assignedWorker.type 
    };
  } else {
    dispatch = await runDispatcherAgent(
      {
        incident_id: tempId,
        incident_type: intake.incident_type,
        severity: priority.severity,
        location: intake.location,
        section_id: intake.section_id,
        english_translation: intake.english_translation,
      },
      assignedWorker,
      input.geminiApiKey
    );
    dispatchCache.set(dispatchCacheKey, dispatch);
  }

  return { intake, priority, dispatch };
}

// Re-export agents for individual use
export { runIntakeAgent } from './agents/intake-agent';
export { runPrioritizerAgent } from './agents/prioritizer-agent';
export { runDispatcherAgent, findNearestWorker } from './agents/dispatcher-agent';
