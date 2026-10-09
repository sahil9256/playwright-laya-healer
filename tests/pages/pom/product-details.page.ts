import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export class ProductDetailsPage extends BasePage {
  readonly productName: Locator = this.page.getByTestId('product-name');
  readonly unitPrice: Locator = this.page.getByTestId('unit-price');
  readonly quantityInput: Locator = this.page.getByTestId('quantity');
  readonly decreaseQuantityButton: Locator = this.page.getByTestId('decrease-quantity');
  readonly increaseQuantityButton: Locator = this.page.getByTestId('increase-quantity');
  /** @intent button "Add to cart" — adds this product to the shopping cart */
  readonly addToCartButton: Locator = this.page.getByTestId('add-to-cart');
  readonly addToFavoritesButton: Locator = this.page.getByTestId('add-to-favorites');
  readonly alertMessage: Locator = this.page.locator('div.alert, [role="alert"], [data-test="alert"]');
  readonly productContainer: Locator = this.page.locator('app-detail');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigates to a specific product details page by its ID, or waits for page load if already navigated.
   */
  async open(productId?: string | number): Promise<void> {
    if (productId !== undefined) {
      await this.goto(`/product/${productId}`);
    }
    await this.waitForLoaded();
  }

  /**
   * Overridden waitForLoaded waiting for product name to be visible.
   */
  override async waitForLoaded(): Promise<void> {
    await super.waitForLoaded();
    await this.productName.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  /**
   * Returns the product name as displayed on the details page.
   */
  async getProductName(): Promise<string> {
    const text = await this.productName.textContent();
    return text ? text.trim() : '';
  }

  /**
   * Returns the numerical unit price parsed from the unit-price element.
   */
  async getPrice(): Promise<number> {
    const text = await this.unitPrice.textContent();
    if (!text) {
      return 0;
    }
    const numeric = text.replace(/[^0-9.]/g, '');
    return parseFloat(numeric) || 0;
  }

  /**
   * Sets the product quantity input value.
   */
  async setQuantity(qty: number): Promise<void> {
    await this.quantityInput.fill(String(qty));
  }

  /**
   * Clicks the increase quantity button the specified number of times.
   */
  async increaseQuantity(times: number = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.increaseQuantityButton.click();
    }
  }

  /**
   * Clicks the decrease quantity button the specified number of times.
   */
  async decreaseQuantity(times: number = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.decreaseQuantityButton.click();
    }
  }

  /**
   * Clicks the 'Add to cart' button.
   */
  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  /**
   * Clicks the 'Add to favorites' button.
   */
  async addToFavorites(): Promise<void> {
    await this.addToFavoritesButton.click();
  }

  /**
   * Returns any alert or notification text displayed on the page.
   */
  async getAlertMessage(): Promise<string> {
    const isVisible = await this.alertMessage.first().isVisible().catch(() => false);
    if (!isVisible) {
      return '';
    }
    const text = await this.alertMessage.first().textContent();
    return text ? text.trim() : '';
  }
}
