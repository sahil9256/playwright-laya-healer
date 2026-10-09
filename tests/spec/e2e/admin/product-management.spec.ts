import { test, expect } from '@pages/base';

test.describe('E2E — Admin Panel', () => {
  test.use({ userRole: 'admin' });

  test('admin logs in and manages products in the admin panel', async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.open();

    // Navigate to Products management view
    await adminDashboardPage.openProducts();

    // Verify products table and admin product controls
    await expect(adminDashboardPage.addProductButton).toBeVisible();
    await expect(adminDashboardPage.productsTableRows.first()).toBeVisible({ timeout: 15000 });
    const count = await adminDashboardPage.getProductsCount();
    expect(count).toBeGreaterThan(0);
  });
});
