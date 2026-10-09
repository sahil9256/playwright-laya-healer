import { test, expect } from '../../../setup/api/fixtures.ts';

test.describe('API HTTP QUERY (RFC 10008)', () => {
  test('search products using HTTP QUERY method (RFC 10008) or search fallback', async ({
    apiGuest,
    productHelper,
  }) => {
    // Request using HTTP QUERY method (RFC 10008)
    const queryResponse = await apiGuest.fetch('/products', {
      method: 'QUERY',
      data: { query: 'Hammer' },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (queryResponse.status() === 200) {
      const body = await queryResponse.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body).toHaveProperty('current_page');
    } else {
      // Fallback to standard search endpoint when QUERY is not supported
      const fallbackResponse = await productHelper.searchProductsResponse('Hammer');
      expect(fallbackResponse.status()).toBe(200);

      const fallbackBody = await fallbackResponse.json();
      expect(Array.isArray(fallbackBody.data)).toBe(true);
      expect(fallbackBody.data.length).toBeGreaterThan(0);
    }
  });
});
