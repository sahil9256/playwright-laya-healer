import { test, expect } from '../../../setup/api/fixtures.ts';

test.describe('API GraphQL', () => {
  test('execute GraphQL query for product list', async ({ apiGuest }) => {
    const graphqlQuery = {
      query: `
        query GetProducts {
          products {
            data {
              id
              name
              price
            }
          }
        }
      `,
    };

    const response = await apiGuest.post('/graphql', {
      data: graphqlQuery,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('products');
    expect(body.data.products).toHaveProperty('data');
    expect(Array.isArray(body.data.products.data)).toBe(true);
    expect(body.data.products.data.length).toBeGreaterThan(0);

    const firstProduct = body.data.products.data[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('price');
    expect(typeof firstProduct.price).toBe('number');
  });
});
