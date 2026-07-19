import { describe, it, expect, vi } from 'vitest';
import { runCrisisBridgePipeline } from '../packages/ai-pipeline/pipeline';
import type { Worker } from '@halo/shared';

// We mock the inner AI calls to simulate an end-to-end flow without hitting real APIs
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockImplementation(async (opts: any) => {
          const prompt = opts.contents[0].parts[0].text;
          
          if (prompt.includes('You are Agent A')) {
            // Default English, preserving the raw text for triggers
            const originalMatch = prompt.match(/"([^"]+)"$/);
            const raw = originalMatch ? originalMatch[1] : "spill here";
            return { text: JSON.stringify({
              original_text: raw,
              detected_language: "en",
              english_translation: raw,
              incident_type: "spill",
              location: "Section 105",
              section_id: 105,
              urgency_hint: "medium",
              confidence: 0.9
            })};
          } else if (prompt.includes('You are Agent B')) {
            if (prompt.includes('duplicate_trigger')) {
              return { text: JSON.stringify({
                incident_id: "temp-id",
                severity: 3,
                is_duplicate: true,
                duplicate_of: "old-1",
                escalated: false,
                required_worker_type: "janitor",
                reasoning: "Duplicate."
              })};
            }
            if (prompt.includes('mismatch_worker_trigger')) {
              return { text: JSON.stringify({
                incident_id: "temp-id",
                severity: 3,
                is_duplicate: false,
                escalated: false,
                required_worker_type: "security",
                reasoning: "Actually needs security."
              })};
            }
            return { text: JSON.stringify({
              incident_id: "temp-id",
              severity: 3,
              is_duplicate: false,
              escalated: false,
              required_worker_type: "janitor",
              reasoning: "Routine spill requiring cleanup."
            })};
          } else if (prompt.includes('You are Agent C')) {
            return { text: JSON.stringify({
              incident_id: "temp-id",
              assigned_worker_id: "w-1",
              worker_name: "John",
              worker_type: "janitor",
              eta_minutes: 3,
              route_instructions: "Walk to 105",
              translated_message: "🚨 SPILL at Section 105",
              target_language: "en"
            })};
          }
          return { text: "{}" };
        })
      };
    }
  };
});

describe('Pipeline Integration', () => {
  it('runs an incident through the full triage and dispatch pipeline', async () => {
    const mockWorkers: Worker[] = [
      { id: 'w-1', name: 'John', type: 'janitor', section: 101, status: 'on-duty', language: 'en', worker_id: 'W-TEST', user_id: 'U-TEST', efficiency: 95, created_at: '2026-07-19T00:00:00Z' }
    ];

    const result = await runCrisisBridgePipeline({
      rawText: 'There is a spill in 105',
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: mockWorkers
    });

    expect(result.error).toBeUndefined();
    
    // Intake Assertions
    expect(result.intake.incident_type).toBe('spill');
    
    // Priority Assertions
    expect(result.priority.severity).toBe(3);
    expect(result.priority.required_worker_type).toBe('janitor');
    expect(result.priority.reasoning).toBe('Routine spill requiring cleanup.');
    
    // Dispatch Assertions
    expect(result.dispatch).toBeDefined();
    expect(result.dispatch?.assigned_worker_id).toBe('w-1');
  });

  it('uses cached results for identical pipeline runs', async () => {
    const mockWorkers: Worker[] = [
      { id: 'w-1', name: 'John', type: 'janitor', section: 101, status: 'on-duty', language: 'en', worker_id: 'W-TEST', user_id: 'U-TEST', efficiency: 95, created_at: '2026-07-19T00:00:00Z' }
    ];

    // First run populates cache
    await runCrisisBridgePipeline({
      rawText: 'Spill near cache test',
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: mockWorkers
    });

    // Second run should hit intake and dispatch caches
    const result2 = await runCrisisBridgePipeline({
      rawText: 'Spill near cache test', // exact same input (case insensitive)
      reporterId: 'fan-2',
      reporterName: 'Bob',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: mockWorkers
    });

    expect(result2.intake.incident_type).toBe('spill');
    expect(result2.dispatch?.worker_name).toBe('John');
  });

  it('handles empty or fully sanitized input', async () => {
    const result = await runCrisisBridgePipeline({
      rawText: '<script></script>', // Sanitizes to empty string
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: []
    });

    expect(result.error).toBe("Input text is empty or invalid after sanitization.");
    expect(result.dispatch).toBeNull();
  });

  it('stops at Prioritizer if incident is a duplicate', async () => {
    const result = await runCrisisBridgePipeline({
      rawText: 'Agent B duplicate_trigger',
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: []
    });

    expect(result.priority.is_duplicate).toBe(true);
    expect(result.dispatch).toBeNull();
  });

  it('returns an error if no appropriate worker is found', async () => {
    const result = await runCrisisBridgePipeline({
      rawText: 'Agent A needs medic',
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: [] // No workers available
    });

    // In the mock, Agent A returns incident_type: 'spill', then Agent B returns required_worker_type: 'janitor'
    expect(result.error).toBe("No available janitor workers found");
    expect(result.dispatch).toBeNull();
  });

  it('re-routes to a different worker type if Prioritizer overrides Intake prediction', async () => {
    const mockWorkers: Worker[] = [
      { id: 'w-sec', name: 'Dave', type: 'security', section: 101, status: 'on-duty', language: 'en', worker_id: 'W-TEST', user_id: 'U-TEST', efficiency: 95, created_at: '2026-07-19T00:00:00Z' }
    ];

    const result = await runCrisisBridgePipeline({
      rawText: 'Agent B mismatch_worker_trigger',
      reporterId: 'fan-1',
      reporterName: 'Alice',
      geminiApiKey: 'fake-key',
      recentIncidents: [],
      availableWorkers: mockWorkers
    });

    expect(result.error).toBeUndefined();
    expect(result.priority.required_worker_type).toBe('security');
    expect(result.dispatch?.assigned_worker_id).toBe('w-sec');
  });
});
