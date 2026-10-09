import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

export class ProductCardComponent extends BaseComponent {
  readonly title: Locator = this.root.getByTestId('product-name');
  readonly price: Locator = this.root.getByTestId('product-price');
  readonly outOfStockBadge: Locator = this.root.getByTestId('out-of-stock');

  constructor(page: Page, root: Locator) {
    super(page, root);
  }

  /**
   * Returns the product name / title text.
   */
  async getName(): Promise<string> {
    const text = await this.title.textContent();
    return text ? text.trim() : '';
  }

  /**
   * Returns the numerical price value (parsed from text like "$14.15").
   */
  async getPrice(): Promise<number> {
    const text = await this.price.textContent();
    if (!text) {
      return 0;
    }
    const numeric = text.replace(/[^0-9.]/g, '');
    return parseFloat(numeric) || 0;
  }

  /**
   * Clicks on the card to navigate to the product details page.
   */
  async openDetails(): Promise<void> {
    await this.root.click();
  }

  /**
   * Returns true if the product has an out-of-stock badge displayed.
   */
  async isOutOfStock(): Promise<boolean> {
    return await this.outOfStockBadge.isVisible().catch(() => false);
  }
}
