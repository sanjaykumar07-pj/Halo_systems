/**
 * @file pipeline.ts
 * @description Crisis-Bridge Pipeline Orchestrator. This module chains Agent A (Intake), Agent B (Prioritizer), and Agent C (Dispatcher) to process a raw fan report into a fully dispatched, translated incident.
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

/**
 * Interface representing the required inputs to run the full pipeline.
 */
export interface PipelineInput {
  rawText: string;
  reporterId: string;
  reporterName: string;
  geminiApiKey: string;
  recentIncidents: Incident[];
  availableWorkers: Worker[];
}

/**
 * Interface representing the complete result of the Crisis-Bridge pipeline.
 */
export interface PipelineResult {
  intake: IntakeResult;
  priority: PrioritizedIncident;
  dispatch: DispatchResult | null;
  error?: string;
}

/**
 * Sanitize and validate user-submitted text to prevent prompt injection 
 * and buffer overflows. 
 *
 * @param {string} text - The raw user input text to sanitize.
 * @returns {string} The sanitized text safe for LLM context processing.
 */
export function sanitizeInput(text: string): string {
  if (!text) return "";
  let sanitized: string = text.replace(/[\x00-\x1F\x7F]/g, '');
  sanitized = sanitized.replace(/<[^>]*>?/g, '');
  
  const adversarialKeywords: RegExp[] = [
    /ignore previous instructions/gi,
    /ignore all previous instructions/gi,
    /system prompt/gi,
    /you are a /gi,
    /bypass instructions/gi
  ];
  for (const pattern of adversarialKeywords) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  const MAX_INPUT_LENGTH: number = 1000;
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
  }
  return sanitized.trim();
}

/** Cache maps for minimizing redundant LLM calls */
const intakeCache = new Map<string, IntakeResult>();
const dispatchCache = new Map<string, DispatchResult>();

/**
 * Run the full Crisis-Bridge pipeline.
 * Returns structured results from all three agents.
 *
 * @param {PipelineInput} input - All necessary parameters to execute the triage process.
 * @returns {Promise<PipelineResult>} A promise resolving to the final end-to-end pipeline results.
 */
export async function runCrisisBridgePipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  const sanitizedText: string = sanitizeInput(input.rawText);
  if (!sanitizedText) {
    return {
      intake: {} as IntakeResult,
      priority: {} as PrioritizedIncident,
      dispatch: null,
      error: "Input text is empty or invalid after sanitization."
    };
  }

  const intake: IntakeResult = await executeIntakeStage(sanitizedText, input.geminiApiKey);
  const tempId: string = crypto.randomUUID();

  const [priority, nearestWorker] = await executePrioritizationStage(tempId, intake, input);

  if (priority.is_duplicate) {
    return { intake, priority, dispatch: null };
  }

  const assignedWorker: Worker | null = resolveFinalWorker(nearestWorker, priority, intake, input);

  if (!assignedWorker) {
    return {
      intake,
      priority,
      dispatch: null,
      error: `No available ${priority.required_worker_type} workers found`,
    };
  }

  const dispatch: DispatchResult = await executeDispatchStage(tempId, intake, priority, assignedWorker, input.geminiApiKey);

  return { intake, priority, dispatch };
}

/**
 * Helper to execute the Intake Stage (Agent A) and handle caching.
 *
 * @param {string} sanitizedText - The cleaned fan report.
 * @param {string} geminiApiKey - The API key.
 * @returns {Promise<IntakeResult>} Resolves to the parsed intake object.
 */
async function executeIntakeStage(sanitizedText: string, geminiApiKey: string): Promise<IntakeResult> {
  const normalizedInput: string = sanitizedText.toLowerCase();
  if (intakeCache.has(normalizedInput)) {
    return intakeCache.get(normalizedInput)!;
  } 
  
  const intake: IntakeResult = await runIntakeAgent(sanitizedText, geminiApiKey);
  intakeCache.set(normalizedInput, intake);
  return intake;
}

/**
 * Helper to execute the Prioritization Stage (Agent B) and pre-fetch workers in parallel.
 *
 * @param {string} tempId - Temporary UUID for the incident.
 * @param {IntakeResult} intake - Results from the Intake Stage.
 * @param {PipelineInput} input - The overall pipeline input.
 * @returns {Promise<[PrioritizedIncident, Worker | null]>} Resolves to the priority scoring and the predicted nearest worker.
 */
async function executePrioritizationStage(
  tempId: string, 
  intake: IntakeResult, 
  input: PipelineInput
): Promise<[PrioritizedIncident, Worker | null]> {
  const relevantIncidents: Incident[] = input.recentIncidents.filter(
    (i: Incident) => i.parsed_type === intake.incident_type || i.section_id === intake.section_id
  );

  const typeToWorker: Record<string, string> = {
    medical: 'medic', fire: 'security', security: 'security',
    structural: 'security', spill: 'janitor', noise: 'janitor',
    accessibility: 'janitor', other: 'security',
  };
  const predictedWorkerType: string = typeToWorker[intake.incident_type] || 'security';

  return Promise.all([
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
}

/**
 * Helper to resolve the final worker assignment if the Prioritizer agent contradicts the basic prediction heuristic.
 *
 * @param {Worker | null} nearestWorker - The proactively predicted worker.
 * @param {PrioritizedIncident} priority - The verified priority data containing required_worker_type.
 * @param {IntakeResult} intake - The intake data containing the location.
 * @param {PipelineInput} input - The overall pipeline input.
 * @returns {Worker | null} The definitively assigned worker, if one exists.
 */
function resolveFinalWorker(
  nearestWorker: Worker | null, 
  priority: PrioritizedIncident, 
  intake: IntakeResult, 
  input: PipelineInput
): Worker | null {
  const typeToWorker: Record<string, string> = {
    medical: 'medic', fire: 'security', security: 'security',
    structural: 'security', spill: 'janitor', noise: 'janitor',
    accessibility: 'janitor', other: 'security',
  };
  const predictedWorkerType: string = typeToWorker[intake.incident_type] || 'security';

  if (priority.required_worker_type !== predictedWorkerType) {
    return findNearestWorker(
      input.availableWorkers,
      priority.required_worker_type,
      intake.section_id
    );
  }
  return nearestWorker;
}

/**
 * Helper to execute the Dispatch Stage (Agent C) and handle caching.
 *
 * @param {string} tempId - Temporary UUID for the incident.
 * @param {IntakeResult} intake - Results from the Intake Stage.
 * @param {PrioritizedIncident} priority - Results from the Prioritizer Stage.
 * @param {Worker} assignedWorker - The worker finalized for the job.
 * @param {string} geminiApiKey - The API key.
 * @returns {Promise<DispatchResult>} Resolves to the finalized dispatch object.
 */
async function executeDispatchStage(
  tempId: string,
  intake: IntakeResult,
  priority: PrioritizedIncident,
  assignedWorker: Worker,
  geminiApiKey: string
): Promise<DispatchResult> {
  const dispatchCacheKey: string = `${intake.incident_type}:${intake.location}:${intake.section_id}:${assignedWorker.language}:${assignedWorker.section}`;
  
  if (dispatchCache.has(dispatchCacheKey)) {
    return { 
      ...dispatchCache.get(dispatchCacheKey)!, 
      incident_id: tempId, 
      assigned_worker_id: assignedWorker.id, 
      worker_name: assignedWorker.name, 
      worker_type: assignedWorker.type 
    };
  } 

  const dispatch: DispatchResult = await runDispatcherAgent(
    {
      incident_id: tempId,
      incident_type: intake.incident_type,
      severity: priority.severity,
      location: intake.location,
      section_id: intake.section_id,
      english_translation: intake.english_translation,
    },
    assignedWorker,
    geminiApiKey
  );
  
  dispatchCache.set(dispatchCacheKey, dispatch);
  return dispatch;
}

// Re-export agents for individual use
export { runIntakeAgent } from './agents/intake-agent';
export { runPrioritizerAgent } from './agents/prioritizer-agent';
export { runDispatcherAgent, findNearestWorker } from './agents/dispatcher-agent';
