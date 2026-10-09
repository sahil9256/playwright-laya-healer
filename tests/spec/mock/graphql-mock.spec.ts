import { test, expect } from '../../fixtures/mock/mock-test.ts';

test.describe('Mock API — GraphQL Operation Mocking (POST /graphql)', () => {
  test('selectively mocks GraphQL query based on operationName', async ({
    page,
    mockHelper,
  }) => {
    const mockGraphQLData = {
      data: {
        products: {
          data: [
            {
              id: 'mock-gql-001',
              name: 'Mocked Precision Laser Level (GraphQL)',
              price: 149.99,
            },
            {
              id: 'mock-gql-002',
              name: 'Mocked Cordless Impact Driver (GraphQL)',
              price: 89.0,
            },
          ],
        },
      },
    };

    // 1. Setup selective GraphQL mock matching operationName "GetProducts"
    await mockHelper.mockGraphQL('GetProducts', mockGraphQLData);

    // 2. Execute GraphQL query from the browser context
    const response = await page.evaluate(async () => {
      const res = await fetch('https://api.practicesoftwaretesting.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operationName: 'GetProducts',
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
        }),
      });
      return await res.json();
    });

    // 3. Verify that the intercepted response matches our mock payload
    expect(response).toHaveProperty('data');
    expect(response.data.products.data).toHaveLength(2);
    expect(response.data.products.data[0].name).toBe('Mocked Precision Laser Level (GraphQL)');
    expect(response.data.products.data[0].price).toBe(149.99);
    expect(response.data.products.data[1].name).toBe('Mocked Cordless Impact Driver (GraphQL)');
  });
});
