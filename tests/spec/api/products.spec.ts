import { test, expect } from '../../../setup/api/fixtures.ts';

test.describe('API Products', () => {
  test('retrieve product list with pagination', async ({ productHelper }) => {
    const response = await productHelper.getProductsResponse({ page: 1 });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.current_page).toBe(1);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('per_page');

    const firstProduct = body.data[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('price');
  });

  test('search product by phrase Drill', async ({ productHelper }) => {
    const query = 'Drill';
    const response = await productHelper.searchProductsResponse(query);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const matchFound = body.data.some((product: any) =>
      product.name?.toLowerCase().includes(query.toLowerCase()) ||
      product.description?.toLowerCase().includes(query.toLowerCase())
    );
    expect(matchFound).toBe(true);
  });
});
