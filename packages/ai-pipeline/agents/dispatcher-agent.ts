/**
 * @file dispatcher-agent.ts
 * @description Agent C — Dispatcher. This module finds the nearest available worker of the required type, generates a route, and translates the dispatch message into the worker's native language.
 */

import type { DispatchResult, Worker } from '@halo/shared';
import * as fs from 'fs';
import * as path from 'path';

/** 
 * Path to the prompt file for the dispatcher agent.
 * @constant {string}
 */
const DISPATCHER_PROMPT_PATH: string = path.join(__dirname, '../prompts/dispatcher.txt');

/** 
 * The raw prompt text loaded from the file system.
 * @constant {string}
 */
const DISPATCHER_PROMPT: string = fs.readFileSync(DISPATCHER_PROMPT_PATH, 'utf-8');

/**
 * Constant defining the AI model to use for dispatching.
 * @constant {string}
 */
const DISPATCHER_MODEL: string = 'gemini-1.5-flash-8b';

/**
 * Constant defining the temperature for the AI model to use.
 * @constant {number}
 */
const DISPATCHER_TEMPERATURE: number = 0.3;

/**
 * The input type required for the Dispatcher Agent.
 */
export interface DispatcherInput {
  incident_id: string;
  incident_type: string;
  severity: number;
  location: string;
  section_id: number | null;
  english_translation: string;
}

/**
 * Generates dispatch instructions and a translated message for the assigned worker.
 *
 * @param {DispatcherInput} incident - The prioritized incident data.
 * @param {Worker} worker - The worker assigned to the incident.
 * @param {string} geminiApiKey - The API key used to authenticate with the Google Gemini API.
 * @returns {Promise<DispatchResult>} A promise resolving to the final dispatch instructions.
 * @throws {Error} Throws if the API key is invalid or network fails.
 */
export async function runDispatcherAgent(
  incident: DispatcherInput,
  worker: Worker,
  geminiApiKey: string
): Promise<DispatchResult> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const context = {
    ...incident,
    worker: {
      id: worker.id,
      name: worker.name,
      type: worker.type,
      language: worker.language,
      current_section: worker.section,
    },
  };

  const response = await ai.models.generateContent({
    model: DISPATCHER_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${DISPATCHER_PROMPT}\n\nDispatch context:\n${JSON.stringify(context, null, 2)}`,
          },
        ],
      },
    ],
    config: {
      temperature: DISPATCHER_TEMPERATURE,
      responseMimeType: 'application/json',
    },
  });

  const text: string = response.text ?? '';
  return parseDispatcherResponse(text, incident, worker);
}

/**
 * Helper function to parse the raw JSON string from the AI into a DispatchResult.
 *
 * @param {string} aiResponseText - The raw text response from the Gemini API.
 * @param {DispatcherInput} incident - The original incident input used as a fallback if parsing fails.
 * @param {Worker} worker - The assigned worker used as a fallback.
 * @returns {DispatchResult} The parsed dispatch result, or a safe fallback if parsing fails.
 */
function parseDispatcherResponse(
  aiResponseText: string, 
  incident: DispatcherInput, 
  worker: Worker
): DispatchResult {
  const cleaned: string = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned) as DispatchResult;
  } catch {
    return generateFallbackDispatch(incident, worker);
  }
}

/**
 * Generates deterministic fallback dispatch instructions when the AI fails.
 *
 * @param {DispatcherInput} incident - The incident to generate fallback data for.
 * @param {Worker} worker - The assigned worker.
 * @returns {DispatchResult} The fallback dispatch instructions.
 */
function generateFallbackDispatch(incident: DispatcherInput, worker: Worker): DispatchResult {
  const METERS_PER_SECTION: number = 50;
  const MIN_ETA_MINUTES: number = 2;
  const MAX_ETA_MINUTES: number = 15;
  const DEFAULT_SECTION: number = 100;

  const sectionDiff: number = Math.abs((incident.section_id ?? DEFAULT_SECTION) - worker.section);
  const etaMinutes: number = Math.max(MIN_ETA_MINUTES, Math.min(MAX_ETA_MINUTES, sectionDiff));

  return {
    incident_id: incident.incident_id,
    assigned_worker_id: worker.id,
    worker_name: worker.name,
    worker_type: worker.type,
    distance_meters: sectionDiff * METERS_PER_SECTION,
    eta_minutes: etaMinutes,
    route_instructions: `Proceed to Section ${incident.section_id ?? 'Unknown'} from your current location at Section ${worker.section}.`,
    translated_message: `🚨 ${incident.incident_type.toUpperCase()} at ${incident.location}. Please respond immediately. ETA: ${etaMinutes} minutes.`,
    target_language: worker.language,
  };
}

/**
 * Finds the nearest available worker of the required type to the incident location.
 * Uses a simple section-distance heuristic.
 *
 * @param {Worker[]} workers - The pool of all available workers.
 * @param {string} requiredType - The specific worker type required (e.g., 'janitor', 'medic').
 * @param {number | null} incidentSection - The section ID where the incident occurred.
 * @returns {Worker | null} The nearest available worker, or null if none are found.
 */
export function findNearestWorker(
  workers: Worker[],
  requiredType: string,
  incidentSection: number | null
): Worker | null {
  const available: Worker[] = workers.filter(
    (w: Worker) => w.type === requiredType && (w.status === 'on-duty' || w.status === 'off-duty')
  );

  if (available.length === 0) return null;
  if (incidentSection === null) return available[0];

  available.sort((a: Worker, b: Worker) => {
    const distA: number = Math.abs(a.section - incidentSection);
    const distB: number = Math.abs(b.section - incidentSection);
    return distA - distB;
  });

  return available[0];
}
