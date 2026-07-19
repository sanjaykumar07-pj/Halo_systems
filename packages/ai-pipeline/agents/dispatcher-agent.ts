/**
 * Agent C — Dispatcher
 * Finds nearest available worker, generates route, translates dispatch message.
 */

import type { DispatchResult, Worker } from '@halo/shared';

const DISPATCHER_PROMPT = `You are Agent C — the Dispatcher for HALO Stadium Operations.
Generate actionable dispatch instructions for a worker, translated to their language.

Return ONLY valid JSON:
{
  "incident_id": "same as input",
  "assigned_worker_id": "worker id",
  "worker_name": "name",
  "worker_type": "type",
  "eta_minutes": integer,
  "route_instructions": "step-by-step directions using stadium landmarks",
  "translated_message": "full dispatch message in worker's language",
  "target_language": "language code"
}

ETA rules: adjacent sections ~1min, different floors ~2-3min, different gates ~3-5min.
Message format: 🚨 [EMOJI] [TYPE] — [LOCATION] [DESCRIPTION] Route: [ROUTE] ETA: [X]min
Severity emojis: 1=🔴, 2=🟠, 3=🟡, 4=🟢, 5=⚪`;

export async function runDispatcherAgent(
  incident: {
    incident_id: string;
    incident_type: string;
    severity: number;
    location: string;
    section_id: number | null;
    english_translation: string;
  },
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
    model: 'gemini-1.5-flash-8b',
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
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned) as DispatchResult;
  } catch {
    // Fallback with basic distance estimation
    const sectionDiff = Math.abs(
      (incident.section_id ?? 100) - worker.section
    );
    const etaMinutes = Math.max(2, Math.min(15, sectionDiff));

    return {
      incident_id: incident.incident_id,
      assigned_worker_id: worker.id,
      worker_name: worker.name,
      worker_type: worker.type,
      distance_meters: sectionDiff * 50,
      eta_minutes: etaMinutes,
      route_instructions: `Proceed to Section ${incident.section_id ?? 'Unknown'} from your current location at Section ${worker.section}.`,
      translated_message: `🚨 ${incident.incident_type.toUpperCase()} at ${incident.location}. Please respond immediately. ETA: ${etaMinutes} minutes.`,
      target_language: worker.language,
    };
  }
}

/**
 * Find the nearest available worker of the required type.
 * Uses simple section-distance heuristic (production would use GPS).
 */
export function findNearestWorker(
  workers: Worker[],
  requiredType: string,
  incidentSection: number | null
): Worker | null {
  const available = workers.filter(
    (w) => w.type === requiredType && (w.status === 'on-duty' || w.status === 'off-duty')
  );

  if (available.length === 0) return null;
  if (incidentSection === null) return available[0];

  // Sort by distance to incident section
  available.sort((a, b) => {
    const distA = Math.abs(a.section - incidentSection);
    const distB = Math.abs(b.section - incidentSection);
    return distA - distB;
  });

  return available[0];
}
