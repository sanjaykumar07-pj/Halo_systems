/**
 * Agent A — Intake Parser
 * Parses chaotic, multilingual fan reports into structured incident data.
 * Uses Gemini Flash for fast inference on classification + translation.
 */

import type { IntakeResult } from '@halo/shared';

import * as fs from 'fs';
import * as path from 'path';

const INTAKE_PROMPT = fs.readFileSync(path.join(__dirname, '../prompts/intake.txt'), 'utf-8');

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
