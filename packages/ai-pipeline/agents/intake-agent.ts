/**
 * @file intake-agent.ts
 * @description Agent A — Intake Parser. This module is responsible for parsing chaotic, multilingual fan reports into structured incident data. It uses the Gemini API for fast classification and translation.
 */

import type { IntakeResult } from '@halo/shared';
import * as fs from 'fs';
import * as path from 'path';

/** 
 * Path to the prompt file for the intake agent.
 * @constant {string}
 */
const INTAKE_PROMPT_PATH: string = path.join(__dirname, '../prompts/intake.txt');

/** 
 * The raw prompt text loaded from the file system.
 * @constant {string}
 */
const INTAKE_PROMPT: string = fs.readFileSync(INTAKE_PROMPT_PATH, 'utf-8');

/**
 * Constant defining the AI model to use for intake.
 * @constant {string}
 */
const INTAKE_MODEL: string = 'gemini-1.5-flash-8b';

/**
 * Constant defining the temperature for the AI model to use.
 * @constant {number}
 */
const INTAKE_TEMPERATURE: number = 0.1;

/**
 * Parses a raw fan report into a structured IntakeResult.
 *
 * @param {string} rawText - The unformatted, potentially multilingual text reported by the fan.
 * @param {string} geminiApiKey - The API key used to authenticate with the Google Gemini API.
 * @returns {Promise<IntakeResult>} A promise resolving to the parsed incident data.
 * @throws {Error} Throws if the API key is invalid or network fails, though parsing errors are caught and fallbacked.
 */
export async function runIntakeAgent(
  rawText: string,
  geminiApiKey: string
): Promise<IntakeResult> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const response = await ai.models.generateContent({
    model: INTAKE_MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ text: `${INTAKE_PROMPT}\n\nFan report:\n"${rawText}"` }],
      },
    ],
    config: {
      temperature: INTAKE_TEMPERATURE,
      responseMimeType: 'application/json',
    },
  });

  const text: string = response.text ?? '';
  return parseIntakeResponse(text, rawText);
}

/**
 * Helper function to parse the raw JSON string from the AI into an IntakeResult.
 * Falls back to a default structure if parsing fails.
 *
 * @param {string} aiResponseText - The raw text response from the Gemini API.
 * @param {string} rawText - The original fan report text (used for the fallback).
 * @returns {IntakeResult} The parsed intake result, or a safe fallback if parsing fails.
 */
function parseIntakeResponse(aiResponseText: string, rawText: string): IntakeResult {
  const cleaned: string = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
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
