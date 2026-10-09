import { test, expect } from '../../fixtures/mock/mock-test.ts';

test.describe('Mock API — Artificial Latency & Delay (Testing Async States)', () => {
  test('delays product catalog API response and completes load gracefully', async ({
    homePage,
    mockHelper,
  }) => {
    const delayMs = 1200;
    const startTime = Date.now();

    // 1. Introduce artificial delay on the products endpoint
    await mockHelper.delayResponse(/\/products(\?.*)?$/, delayMs);

    // 2. Open homepage and wait for page to settle
    await homePage.open();

    const elapsedTime = Date.now() - startTime;

    // 3. Verify that the request was indeed delayed by at least the simulated latency
    expect(elapsedTime).toBeGreaterThanOrEqual(delayMs);

    // 4. Verify products render correctly once the network response finishes
    const count = await homePage.getProductCount();
    expect(count).toBeGreaterThan(0);
  });
});
