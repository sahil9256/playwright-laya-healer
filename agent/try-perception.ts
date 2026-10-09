/**
 * Step 9 check: open the real cart page, collect candidates, and ask the decision model.
 * Nothing is clicked by the agent yet. Run with:
 *   node agent/try-perception.ts            (hidden browser)
 *   $env:HEADED="1"; node agent/try-perception.ts   (visible browser)
 */
import dotenv from 'dotenv';
import { chromium, selectors } from '@playwright/test';
import { DecisionClient } from './decision-client.ts';
import { perceive, toChoiceOptions } from './perception.ts';

dotenv.config({ path: 'env/.env.decision.local', quiet: true });
selectors.setTestIdAttribute('data-test'); // same as playwright.config.ts

const client = DecisionClient.fromEnv();
const browser = await chromium.launch({ headless: !process.env.HEADED });
const page = await browser.newPage({
  baseURL: 'https://practicesoftwaretesting.com',
  viewport: { width: 1920, height: 1080 },
});

try {
  // Setup is scripted (not the agent's job yet): put one product in the cart and open the cart.
  await page.goto('/');
  await page.locator('a.card').first().click();
  await page.getByTestId('add-to-cart').click();
  await page.getByTestId('cart-quantity').waitFor();
  await page.getByTestId('nav-cart').click();
  await page.getByTestId('proceed-1').waitFor();

  const { options, dropped } = await perceive(page);

  const goal = 'complete the purchase of the items in the cart';
  const answer = await client.choose({
    state: `Goal: ${goal}. Current page: shopping cart (checkout step 1).`,
    instructions: 'Which element should be clicked next to reach the goal?',
    options: toChoiceOptions(options),
  });

  console.log(`\nSent ${options.length} options to the model (page: ${page.url()})`);
  options.forEach((c, i) => {
    const marker = i === answer.index ? '<- picked' : '';
    console.log(
      `  ${answer.probabilities[i].toFixed(3)}  [${c.region}] ${c.role} "${c.name}" ${marker}`
    );
  });
  console.log(`  confidence ${answer.confidence.toFixed(2)}, ${answer.latencyMs} ms`);

  console.log(`\nLeft out (${dropped.length}):`);
  dropped.forEach((c) => console.log(`  [${c.region}] ${c.role} "${c.name}"`));
} finally {
  await browser.close();
}
