import { test, expect } from '../../fixtures/mock/mock-test.ts';

test.describe('Mock API — Network Resilience and Error Handling (route.abort & status codes)', () => {
  test('handles HTTP 500 Internal Server Error during login gracefully', async ({
    loginPage,
    mockHelper,
  }) => {
    // 1. Mock 500 Internal Server Error on login endpoint
    await mockHelper.mockLoginResponse(500, {
      message: 'Internal server error occurred. Database unavailable.',
    });

    // 2. Open login page and attempt login
    await loginPage.open();
    await loginPage.login('user@test.com', 'Secret123!');

    // 3. Verify error container is displayed in the UI
    await expect(loginPage.loginError.first()).toBeVisible();
    const errorText = await loginPage.getErrorMessage();
    expect(errorText.length).toBeGreaterThan(0);
  });

  test('handles HTTP 401 Unauthorized with custom error payload', async ({
    loginPage,
    mockHelper,
  }) => {
    const customMessage = 'Invalid credentials or account locked.';

    // 1. Mock 401 Unauthorized with specific backend response
    await mockHelper.mockLoginResponse(401, {
      message: customMessage,
    });

    // 2. Open login page and submit credentials
    await loginPage.open();
    await loginPage.login('wrong@test.com', 'wrongpassword');

    // 3. Verify that the UI reflects the authentication failure
    await expect(loginPage.loginError.first()).toBeVisible();
    const errorText = await loginPage.getErrorMessage();
    expect(errorText.length).toBeGreaterThan(0);
  });

  test('handles dropped network connection via route.abort(failed)', async ({
    page,
    loginPage,
    mockHelper,
  }) => {
    // 1. Simulate hard network failure for login requests
    await mockHelper.abortRequests('**/users/login', 'failed');

    // 2. Open login page
    await loginPage.open();

    // 3. Track page errors to ensure the frontend doesn't suffer unhandled crashes
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    // 4. Attempt login under simulated offline / network failure condition
    await loginPage.login('offline@test.com', 'Password123!');

    // 5. Verify submit button still exists and page remains responsive
    await expect(loginPage.loginSubmitButton).toBeVisible();
    expect(pageErrors.length).toBe(0);
  });
});

