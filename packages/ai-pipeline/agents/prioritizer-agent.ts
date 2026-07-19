/**
 * @file prioritizer-agent.ts
 * @description Agent B — Prioritizer. This module analyzes an incident to score its severity, detect duplicates against recent incidents, and determine the required worker type.
 */

import type { PrioritizedIncident, Incident, IncidentSeverity, WorkerType } from '@halo/shared';
import * as fs from 'fs';
import * as path from 'path';

/** 
 * Path to the prompt file for the prioritizer agent.
 * @constant {string}
 */
const PRIORITIZER_PROMPT_PATH: string = path.join(__dirname, '../prompts/prioritizer.txt');

/** 
 * The raw prompt text loaded from the file system.
 * @constant {string}
 */
const PRIORITIZER_PROMPT: string = fs.readFileSync(PRIORITIZER_PROMPT_PATH, 'utf-8');

/**
 * Constant defining the AI model to use for prioritization.
 * @constant {string}
 */
const PRIORITIZER_MODEL: string = 'gemini-2.5-flash';

/**
 * Constant defining the temperature for the AI model to use.
 * @constant {number}
 */
const PRIORITIZER_TEMPERATURE: number = 0.1;

/**
 * The input type required for the Prioritizer Agent.
 */
export interface PrioritizerInput {
  incident_id: string;
  incident_type: string;
  english_translation: string;
  location: string;
  section_id: number | null;
  urgency_hint: string;
}

/**
 * Analyzes an incident to determine its priority, required worker type, and if it's a duplicate.
 *
 * @param {PrioritizerInput} incident - The parsed incident data from the intake agent.
 * @param {Incident[]} recentIncidents - A list of recent incidents to check against for duplicates.
 * @param {string} geminiApiKey - The API key used to authenticate with the Google Gemini API.
 * @returns {Promise<PrioritizedIncident>} A promise resolving to the prioritized incident data.
 * @throws {Error} Throws if the API key is invalid or network fails.
 */
export async function runPrioritizerAgent(
  incident: PrioritizerInput,
  recentIncidents: Incident[],
  geminiApiKey: string
): Promise<PrioritizedIncident> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const context = {
    ...incident,
    recent_incidents: recentIncidents.map((i: Incident) => ({
      id: i.id,
      type: i.parsed_type,
      section_id: i.section_id,
      status: i.status,
      created_at: i.created_at,
    })),
  };

  const response = await ai.models.generateContent({
    model: PRIORITIZER_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${PRIORITIZER_PROMPT}\n\nIncident to prioritize:\n${JSON.stringify(context, null, 2)}`,
          },
        ],
      },
    ],
    config: {
      temperature: PRIORITIZER_TEMPERATURE,
      responseMimeType: 'application/json',
    },
  });

  const text: string = response.text ?? '';
  return parsePrioritizerResponse(text, incident);
}

/**
 * Helper function to parse the raw JSON string from the AI into a PrioritizedIncident.
 *
 * @param {string} aiResponseText - The raw text response from the Gemini API.
 * @param {PrioritizerInput} incident - The original incident input used as a fallback if parsing fails.
 * @returns {PrioritizedIncident} The parsed priority result, or a safe fallback if parsing fails.
 */
function parsePrioritizerResponse(aiResponseText: string, incident: PrioritizerInput): PrioritizedIncident {
  const cleaned: string = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned) as PrioritizedIncident;
  } catch {
    return generateFallbackPriority(incident);
  }
}

/**
 * Generates a deterministic fallback priority based on the incident type when the AI fails.
 *
 * @param {PrioritizerInput} incident - The incident to generate fallback data for.
 * @returns {PrioritizedIncident} The fallback prioritized incident.
 */
function generateFallbackPriority(incident: PrioritizerInput): PrioritizedIncident {
  const typeToSeverity: Record<string, IncidentSeverity> = {
    medical: 1,
    fire: 1,
    security: 2,
    structural: 2,
    spill: 3,
    noise: 4,
    accessibility: 3,
    other: 3,
  };
  
  const typeToWorker: Record<string, string> = {
    medical: 'medic',
    fire: 'security',
    security: 'security',
    structural: 'security',
    spill: 'janitor',
    noise: 'janitor',
    accessibility: 'janitor',
    other: 'security',
  };

  const fallbackSeverity: IncidentSeverity = typeToSeverity[incident.incident_type] ?? 3;
  const isEscalated: boolean = fallbackSeverity === 1;

  return {
    incident_id: incident.incident_id,
    severity: fallbackSeverity,
    is_duplicate: false,
    escalated: isEscalated,
    required_worker_type: (typeToWorker[incident.incident_type] ?? 'security') as WorkerType,
    reasoning: 'Fallback: AI parse failed, using rule-based classification',
  };
}
