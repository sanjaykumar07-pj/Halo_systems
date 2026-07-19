/**
 * Agent A — Intake Parser
 * Parses chaotic, multilingual fan reports into structured incident data.
 * Uses Gemini Flash for fast inference on classification + translation.
 */

import type { IntakeResult } from '@halo/shared';

const INTAKE_PROMPT = `You are Agent A — the Intake Parser for the HALO Stadium Operations system.

Your job is to parse chaotic, multilingual incident reports from stadium fans and extract structured information.

Return ONLY valid JSON with this exact schema:
{
  "original_text": "the exact input text",
  "detected_language": "ISO 639-1 code",
  "english_translation": "accurate English translation",
  "incident_type": "spill | medical | security | fire | structural | noise | accessibility | other",
  "location": "extracted location",
  "section_id": null or integer,
  "urgency_hint": "critical | high | medium | low",
  "confidence": 0.0 to 1.0
}

Classification: medical/hurt/injured→medical, fight/violence/weapon/stuck→security, spill/wet/dirty→spill, fire/smoke→fire, blocked/broken→structural, loud/overwhelming→noise, wheelchair/ramp→accessibility.
Urgency: life-threatening→critical, safety risk→high, operational→medium, comfort→low.
Return ONLY the JSON, no markdown.`;

export async function runIntakeAgent(
  rawText: string,
  geminiApiKey: string
): Promise<IntakeResult> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash-8b',
    contents: [
      {
        role: 'user',
        parts: [{ text: `${INTAKE_PROMPT}\n\nFan report:\n"${rawText}"` }],
      },
    ],
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    const result: IntakeResult = JSON.parse(cleaned);
    return result;
  } catch (e) {
    // Fallback for parse failures
    return {
      original_text: rawText,
      detected_language: 'en',
      english_translation: rawText,
      incident_type: 'other',
      location: 'Unknown',
      section_id: null,
      urgency_hint: 'medium',
      confidence: 0.3,
    };
  }
}
