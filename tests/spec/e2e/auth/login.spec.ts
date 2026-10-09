import { test, expect } from '@pages/base';
import { getUserByRole } from '@data/users';

test.describe('E2E — Authentication: Login', () => {
  test('customer logs in successfully with test credentials', async ({ page, loginPage, header, accountPage }) => {
    const customer = getUserByRole('customer');

    await loginPage.open();
    await loginPage.login(customer.email, customer.password);

    await page.waitForURL(/.*\/account/, { timeout: 5_000 });
    if (await page.getByTestId('nav-menu').count() > 0) {
      console.log('NAV MENU HTML:', await page.getByTestId('nav-menu').evaluate(el => el.outerHTML));
    }

    await expect(header.userMenu).toBeVisible({ timeout: 5_000 });
    await expect(accountPage.pageTitle).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/.*\/account/, { timeout: 5_000 });
  });

  test('login with invalid password displays error message', async ({ loginPage }) => {
    const customer = getUserByRole('customer');

    await loginPage.open();
    await loginPage.login(customer.email, 'wrong_password_999!');

    await expect(loginPage.loginError).toBeVisible();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage.length).toBeGreaterThan(0);
  });
});
