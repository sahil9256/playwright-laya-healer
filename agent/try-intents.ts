/**
 * Step 10 check: list every @intent found in the page objects. Run with:
 *   node agent/try-intents.ts
 */
import { findIntentsByTestId, readAllIntents } from './intents.ts';

const intents = readAllIntents();

console.log(`Found ${intents.length} described locators:\n`);
for (const intent of intents) {
  console.log(`${intent.file}:${intent.line}  ${intent.property}`);
  console.log(`  means:   ${intent.role} "${intent.label}" — ${intent.purpose}`);
  console.log(`  locator: ${intent.locatorSource}\n`);
}

// What the healer will do in step 11: a test failed on getByTestId('proceed-1') — what was it for?
console.log(`Lookup for broken test id 'proceed-1':`);
for (const intent of findIntentsByTestId(intents, 'proceed-1')) {
  console.log(`  ${intent.file}:${intent.line} ${intent.property} → ${intent.role} "${intent.label}"`);
}
