import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page.ts';
import { type CheckoutAddress, type PaymentDetails } from '../../../data/test-data.ts';

export type PaymentMethod =
  | 'cash-on-delivery'
  | 'bank-transfer'
  | 'credit-card'
  | 'gift-card'
  | (string & {});

export class CheckoutPage extends BasePage {
  // Step 1 proceed
  /** @intent button "Proceed to checkout" — cart (step 1) to sign-in (step 2) */
  readonly proceed1Button: Locator = this.page.getByTestId('proceed-1');

  // Step 2 proceed (Sign-in confirmation)
  /** @intent button "Proceed to checkout" — sign-in (step 2) to billing address (step 3) */
  readonly proceed2Button: Locator = this.page.getByTestId('proceed-2');

  readonly addressInput: Locator = this.page
    .getByTestId('street')
    .or(this.page.getByTestId('address'));
  readonly houseNumberInput: Locator = this.page
    .getByTestId('house_number')
    .or(this.page.getByTestId('house-number'));
  readonly cityInput: Locator = this.page.getByTestId('city');
  readonly stateInput: Locator = this.page.getByTestId('state');
  readonly countryInput: Locator = this.page.getByTestId('country');
  readonly postcodeInput: Locator = this.page
    .getByTestId('postal_code')
    .or(this.page.getByTestId('postcode'));
  /** @intent button "Proceed to checkout" — billing address (step 3) to payment (step 4) */
  readonly proceed3Button: Locator = this.page
    .getByTestId('proceed-3')
    .or(this.page.getByRole('button', { name: /proceed to checkout/i }));

  // Step 4 Payment inputs
  readonly paymentMethodSelect: Locator = this.page.getByTestId('payment-method');
  readonly accountNameInput: Locator = this.page.getByTestId('account-name');
  readonly accountNumberInput: Locator = this.page.getByTestId('account-number');
  readonly creditCardNumberInput: Locator = this.page
    .getByTestId('credit-card-number')
    .or(this.page.getByTestId('card-number'));
  readonly expirationDateInput: Locator = this.page.getByTestId('expiration-date');
  readonly cvvInput: Locator = this.page.getByTestId('cvv');
  readonly cardHolderNameInput: Locator = this.page.getByTestId('card-holder-name');
  /** @intent button "Check payment" — submits the payment step and places the order */
  readonly finishButton: Locator = this.page.getByTestId('finish');

  // Order confirmation
  readonly orderConfirmation: Locator = this.page.locator(
    '#order-confirmation, [data-test="order-confirmation"], .alert-success, div.help-block'
  );
  readonly invoiceNumberLocator: Locator = this.page.locator(
    '[data-test="invoice-number"], #order-confirmation, .alert-success'
  );

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigates to the checkout page.
   */
  async open(): Promise<void> {
    await this.goto('/checkout');
    await this.waitForLoaded();
  }

  /**
   * Step 1 -> Step 2
   */
  async proceedToStep2(): Promise<void> {
    await this.proceed1Button.click();
  }

  /**
   * Step 2 -> Step 3 (proceed from sign-in step)
   */
  async proceedToStep3(): Promise<void> {
    await this.proceed2Button.click();
  }

  /**
   * Fills billing address form in Step 3.
   */
  async fillBillingAddress(addressData: CheckoutAddress): Promise<void> {
    if (addressData.country) {
      const tagName = await this.countryInput.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'input');
      if (tagName === 'select') {
        try {
          await this.countryInput.selectOption({ label: addressData.country });
        } catch {
          await this.countryInput.selectOption({ value: addressData.country });
        }
      } else {
        await this.countryInput.fill(addressData.country);
      }
    }
    if (addressData.postcode) {
      await this.postcodeInput.fill(addressData.postcode);
    }
    if (await this.houseNumberInput.isVisible().catch(() => false)) {
      const houseNum = (addressData as any).house_number || (addressData as any).houseNumber || '42';
      await this.houseNumberInput.fill(houseNum);
    }
    if (addressData.address) {
      await this.addressInput.fill(addressData.address);
    }
    if (addressData.city) {
      await this.cityInput.fill(addressData.city);
    }
    if (addressData.state) {
      await this.stateInput.fill(addressData.state);
    }
  }

  /**
   * Step 3 -> Step 4 (proceed to payment)
   */
  async proceedToPayment(): Promise<void> {
    await this.proceed3Button.click();
  }

  /**
   * Selects payment method from dropdown in Step 4.
   */
  async selectPaymentMethod(method: PaymentMethod): Promise<void> {
    // Attempt select by value first, then fallback to label
    try {
      await this.paymentMethodSelect.selectOption({ value: method });
    } catch {
      // Map known slugs to readable labels if value select failed
      const labels: Record<string, string> = {
        'cash-on-delivery': 'Cash on Delivery',
        'bank-transfer': 'Bank Transfer',
        'credit-card': 'Credit Card',
        'gift-card': 'Gift Card',
      };
      const label = labels[method] || method;
      await this.paymentMethodSelect.selectOption({ label });
    }
  }

  /**
   * Fills payment details depending on selected payment method.
   */
  async fillPaymentDetails(
    details: Partial<PaymentDetails> & { accountName?: string; accountNumber?: string }
  ): Promise<void> {
    if (details.accountName && (await this.accountNameInput.isVisible())) {
      await this.accountNameInput.fill(details.accountName);
    }
    if (details.accountNumber && (await this.accountNumberInput.isVisible())) {
      await this.accountNumberInput.fill(details.accountNumber);
    }
    if (details.cardNumber && (await this.creditCardNumberInput.isVisible())) {
      await this.creditCardNumberInput.fill(details.cardNumber);
    }
    if (details.expirationDate && (await this.expirationDateInput.isVisible())) {
      await this.expirationDateInput.fill(details.expirationDate);
    }
    if (details.cvv && (await this.cvvInput.isVisible())) {
      await this.cvvInput.fill(details.cvv);
    }
    if (details.cardHolderName && (await this.cardHolderNameInput.isVisible())) {
      await this.cardHolderNameInput.fill(details.cardHolderName);
    }
  }

  /**
   * Submits the order by clicking the finish button.
   */
  async confirmOrder(): Promise<void> {
    await this.finishButton.click();
  }

  /**
   * Returns order success / confirmation message text.
   */
  async getSuccessMessage(): Promise<string> {
    const isVisible = await this.orderConfirmation.first().isVisible().catch(() => false);
    if (!isVisible) {
      return '';
    }
    const text = await this.orderConfirmation.first().textContent();
    return text ? text.trim() : '';
  }

  /**
   * Extracts invoice / order number from confirmation text if available.
   */
  async getInvoiceNumber(): Promise<string> {
    const text = await this.getSuccessMessage();
    if (!text) {
      return '';
    }
    // Pattern: INVOICE-XXX or #1234 or alphanumeric code
    const match = text.match(/(?:INV-|invoice\s*#?|order\s*#?)([A-Za-z0-9_-]+)/i);
    return match ? match[1] : '';
  }
}
