/**
 * Quick manual check of the decision client. Run with:
 *   node agent/try-client.ts
 */
import dotenv from 'dotenv';
import { DecisionClient, type ChoiceOption } from './decision-client.ts';

dotenv.config({ path: 'env/.env.decision.local', quiet: true });

const client = DecisionClient.fromEnv();

const state = 'Goal: complete the purchase. Current page: shopping cart (checkout step 1).';
const instructions = 'Which element should be clicked next to reach the goal?';

const pageOrder: ChoiceOption[] = [
  { label: 'button "Proceed to checkout"' },
  { label: 'link "Home"' },
  { label: 'button "Remove item"' },
];

async function ask(title: string, options: ChoiceOption[]): Promise<void> {
  const answer = await client.choose({ state, instructions, options });
  console.log(`\n${title}`);
  options.forEach((option, i) => {
    const marker = i === answer.index ? '<- picked' : '';
    console.log(`  ${answer.probabilities[i].toFixed(3)}  ${option.label} ${marker}`);
  });
  console.log(`  confidence ${answer.confidence.toFixed(2)}, ${answer.latencyMs} ms`);
}

await ask('Page order', pageOrder);
await ask('Same question again (should be identical)', pageOrder);
await ask('Reversed order (expect lower confidence)', [...pageOrder].reverse());
