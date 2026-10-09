import { test, expect } from '@pages/base';
import { generateCheckoutAddress } from '@data/test-data';

test.describe('E2E — Cart and Checkout', () => {
  test.use({ userRole: 'customer' });

  test('full checkout flow from catalog to order confirmation and invoice', async ({
    homePage,
    productDetailsPage,
    header,
    cartPage,
    checkoutPage,
  }) => {
    // 1. Browse catalogue & open first product
    await homePage.open();
    const cards = await homePage.getProductCards();
    expect(cards.length).toBeGreaterThan(0);
    await cards[0].openDetails();

    // 2. Product details & add to cart
    await productDetailsPage.waitForLoaded();
    await productDetailsPage.addToCart();

    // 3. Open cart and review step 1
    await header.openCart();
    await cartPage.waitForLoaded();
    const itemCount = await cartPage.getItemCount();
    expect(itemCount).toBeGreaterThan(0);

    // Proceed to Step 2 (Sign in confirmation)
    await cartPage.proceedToStep2();

    // Proceed to Step 3 (Billing Address)
    await checkoutPage.proceedToStep3();

    // Fill billing address if required
    const billingAddress = generateCheckoutAddress({
      country: 'Poland',
      postcode: '00-001',
    });
    await checkoutPage.fillBillingAddress(billingAddress);

    // Proceed to Step 4 (Payment)
    await checkoutPage.proceedToPayment();

    // Select Cash on Delivery payment method
    await checkoutPage.selectPaymentMethod('cash-on-delivery');

    // Confirm order
    await checkoutPage.confirmOrder();

    // Verify order success and invoice number
    await expect(checkoutPage.orderConfirmation.first()).toBeVisible({ timeout: 15000 });
    const successMsg = await checkoutPage.getSuccessMessage();
    expect(successMsg.length).toBeGreaterThan(0);
    await expect(checkoutPage.invoiceNumberLocator.first()).toBeVisible();
  });
});
