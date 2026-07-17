import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { runCrisisBridgePipeline } from './packages/ai-pipeline/pipeline';
import type { Incident, Worker } from '@halo/shared';
import * as dotenv from 'dotenv';
dotenv.config();

// Mocks for standalone operation without DB
const mockRecentIncidents: Incident[] = [
  {
    id: 'inc-1',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 mins ago
    reporter_id: 'fan-123',
    raw_text: 'There is a huge spill near the bathrooms',
    parsed_type: 'spill',
    section_id: 102,
    priority: 3,
    status: 'assigned'
  }
];

const mockWorkers: Worker[] = [
  { id: 'w-1', name: 'John (Janitor)', type: 'janitor', section: 101, status: 'on-duty', language: 'en' },
  { id: 'w-2', name: 'Maria (Medic)', type: 'medic', section: 105, status: 'on-duty', language: 'es' },
  { id: 'w-3', name: 'Dave (Security)', type: 'security', section: 103, status: 'on-duty', language: 'en' }
];

async function main() {
  console.log('==================================================');
  console.log(' HALO Stadium Operations Assistant (Hackathon CLI)');
  console.log('==================================================\n');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    console.error('ERROR: Missing or invalid GEMINI_API_KEY in .env');
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });
  
  try {
    const rawText = await rl.question('Enter incident report (e.g., "huge water spill here!"): ');
    if (!rawText.trim()) {
      console.log('No input provided. Exiting.');
      process.exit(0);
    }
    
    console.log('\n--- Processing Incident ---');
    
    const result = await runCrisisBridgePipeline({
      rawText,
      reporterId: 'cli-user-1',
      reporterName: 'CLI User',
      geminiApiKey: apiKey,
      recentIncidents: mockRecentIncidents,
      availableWorkers: mockWorkers
    });

    if (result.error) {
      console.error('\n[ERROR]', result.error);
      process.exit(1);
    }

    console.log('\n================== RESULTS ==================');
    console.log(`[Classification] Type: ${result.intake.incident_type?.toUpperCase()} | Location: ${result.intake.location} | Urgency: ${result.intake.urgency_hint}`);
    
    // Explicitly showing the reasoning from the Prioritizer Agent
    console.log(`\n[Decision Logic - AI Reasoning]`);
    console.log(`- Severity Score: ${result.priority.severity}/5`);
    console.log(`- Escalated: ${result.priority.escalated ? 'Yes' : 'No'}`);
    console.log(`- Worker Type Required: ${result.priority.required_worker_type}`);
    console.log(`- Explanation: "${result.priority.reasoning}"`);
    
    if (result.priority.is_duplicate) {
      console.log(`\n[Action] This is a duplicate of ${result.priority.duplicate_of}. No dispatch needed.`);
    } else if (result.dispatch) {
      console.log(`\n[Action - Dispatching Staff]`);
      console.log(`- Assigned: ${result.dispatch.worker_name} (${result.dispatch.worker_type})`);
      console.log(`- ETA: ${result.dispatch.eta_minutes} mins`);
      console.log(`- Worker Instructions (translated to ${result.dispatch.target_language}):\n  ${result.dispatch.translated_message}`);
    } else {
      console.log('\n[Action] Could not find an available worker of the requested type.');
    }
    
    console.log('=============================================\n');

  } catch (err) {
    console.error('Fatal Error:', err);
  } finally {
    rl.close();
  }
}

main();
