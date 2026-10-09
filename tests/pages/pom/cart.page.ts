import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export class CartPage extends BasePage {
  /** @intent button "Proceed to checkout" — cart (step 1) to sign-in (step 2) */
  readonly proceed1Button: Locator = this.page.getByTestId('proceed-1');
  readonly itemRows: Locator = this.page.locator('table tbody tr');
  readonly quantityInput: Locator = this.page.getByTestId('product-quantity');
  readonly deleteButton: Locator = this.page
    .locator('a.btn-danger, button.btn-danger, [data-test="delete"], .fa-trash, .fa-remove');
  readonly cartTotal: Locator = this.page.locator('tfoot tr, [data-test="cart-total"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigates to the cart/checkout page.
   */
  async open(): Promise<void> {
    await this.goto('/checkout');
    await this.waitForLoaded();
  }

  /**
   * Returns the count of items currently in the cart table.
   */
  async getItemCount(): Promise<number> {
    return await this.itemRows.count();
  }

  /**
   * Updates the quantity input for the item row at the specified zero-based index.
   */
  async updateItemQuantity(index: number, quantity: number): Promise<void> {
    const row = this.itemRows.nth(index);
    const input = row
      .getByTestId('product-quantity')
      .or(row.locator('input[type="number"], input.form-control'))
      .first();

    await input.fill(String(quantity));
    await input.press('Enter');
  }

  /**
   * Clicks the remove / delete button for the cart item at the specified index.
   */
  async removeItem(index: number): Promise<void> {
    const row = this.itemRows.nth(index);
    const deleteBtn = row
      .locator('a.btn-danger, button.btn-danger, [data-test="delete"], .fa-trash, .fa-remove')
      .first();

    await deleteBtn.click();
  }

  /**
   * Advances from step 1 (Cart overview) to step 2 (Sign in or proceed).
   */
  async proceedToStep2(): Promise<void> {
    await this.proceed1Button.click();
  }

  /**
   * Returns item title text for a given item row index.
   */
  async getItemTitle(index: number): Promise<string> {
    const row = this.itemRows.nth(index);
    const titleEl = row.getByTestId('product-title').or(row.locator('.product-title, td:nth-child(1)')).first();
    const text = await titleEl.textContent();
    return text ? text.trim() : '';
  }
}
