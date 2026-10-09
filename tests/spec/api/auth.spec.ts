import { test, expect } from '../../../setup/api/fixtures.ts';
import { getUserByRole } from '../../../data/users.ts';
import { faker } from '@faker-js/faker';

test.describe('API Authentication', () => {
  test('user logs in via API with valid credentials', async ({ authHelper }) => {
    const customer = getUserByRole('customer');
    const response = await authHelper.loginResponse({
      email: customer.email,
      password: customer.password,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(typeof body.access_token).toBe('string');
    expect(body.access_token.length).toBeGreaterThan(0);
    expect(body.token_type?.toLowerCase()).toBe('bearer');
  });

  test('login with invalid password returns 401 Unauthorized', async ({ authHelper }) => {
    const customer = getUserByRole('customer');
    const response = await authHelper.loginResponse({
      email: customer.email,
      password: 'InvalidPassword_999!',
    });

    expect(response.status()).toBe(401);
  });

  test('register new customer with unique Faker email', async ({ authHelper }) => {
    const uniqueEmail = `test_customer_${Date.now()}_${faker.string.alphanumeric(6).toLowerCase()}@example.com`;
    const newCustomer = {
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      dob: '1992-05-15',
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: 'Poland',
        postal_code: '00-001',
      },
      phone: faker.string.numeric(10),
      email: uniqueEmail,
      password: `P@ssword_${Date.now()}_!Aa`,
    };

    const response = await authHelper.registerCustomerResponse(newCustomer);
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.email).toBe(uniqueEmail.toLowerCase());
    expect(body.first_name).toBe(newCustomer.first_name);
  });
});
