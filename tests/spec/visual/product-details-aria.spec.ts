import { test, expect } from '@pages/base';

test.describe('Product Details — ARIA Visual Regression', { tag: ['@visual'] }, () => {
  test('verify ARIA snapshot of product details view', async ({
    homePage,
    productDetailsPage,
  }) => {
    await homePage.open();
    const cards = await homePage.getProductCards();
    expect(cards.length).toBeGreaterThan(0);

    await cards[0].openDetails();
    await productDetailsPage.waitForLoaded();

    await expect(productDetailsPage.productContainer).toMatchAriaSnapshot();
  });
});
