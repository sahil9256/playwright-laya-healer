import { test, expect } from '../../fixtures/mock/mock-test.ts';

test.describe('Mock API — Intercept and Modify Responses (route.fetch)', () => {
  test('intercepts live products response and prepends an exclusive promo product', async ({
    homePage,
    mockHelper,
  }) => {
    const promoProduct = {
      id: 'promo-playwright-999',
      name: 'Playwright Special Promo Hammer 5000',
      description: 'Exclusive discounted tool generated dynamically via Playwright route.fetch() interception.',
      price: 1.99,
      is_location_offer: false,
      is_rental: false,
      co2_rating: 'A',
      in_stock: true,
      is_eco_friendly: true,
      product_image: {
        id: 'promo-img-01',
        by_name: 'Testsmith',
        file_name: 'hammer01.avif',
        title: 'Hammer',
      },
    };

    // 1. Intercept real response, call route.fetch(), modify JSON, and fulfill
    await mockHelper.interceptAndPrependProduct(promoProduct);

    // 2. Open homepage
    await homePage.open();

    // 3. Verify total rendered products is greater than 1 (real products + injected)
    const count = await homePage.getProductCount();
    expect(count).toBeGreaterThan(1);

    // 4. Verify that the first card rendered on the page is our injected promo item
    const cards = await homePage.getProductCards();
    await expect(cards[0].title).toHaveText(promoProduct.name);
    await expect(cards[0].price).toContainText(promoProduct.price.toString());
  });
});
