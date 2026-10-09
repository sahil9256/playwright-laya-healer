import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

export class HeaderComponent extends BaseComponent {
  readonly searchInput: Locator = this.page.getByTestId('search-query');
  readonly searchButton: Locator = this.page.getByTestId('search-submit');
  readonly searchReset: Locator = this.page.getByTestId('search-reset');
  /** @intent link "cart" — opens the shopping cart */
  readonly cartLink: Locator = this.page.getByTestId('nav-cart');
  readonly cartQuantity: Locator = this.page.getByTestId('cart-quantity');
  readonly signInLink: Locator = this.page.getByTestId('nav-sign-in');
  readonly userMenu: Locator = this.page.getByTestId('nav-menu');
  readonly navCategories: Locator = this.page.getByTestId('nav-categories');
  readonly navHome: Locator = this.page.getByTestId('nav-home');
  readonly navContact: Locator = this.page.getByTestId('nav-contact');
  readonly appHeader: Locator = this.page.locator('app-header');

  constructor(page: Page, root: Locator = page.locator('nav.navbar').first()) {
    super(page, root);
  }

  /**
   * Enters search query into search input and clicks search submit button.
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  /**
   * Clicks on the navigation cart link.
   */
  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /**
   * Clicks on the Sign In link.
   */
  async goToSignIn(): Promise<void> {
    await this.signInLink.click();
  }

  /**
   * Opens category dropdown and selects the specified category by name.
   */
  async selectCategory(categoryName: string): Promise<void> {
    await this.navCategories.click();
    const categoryLink = this.page
      .locator('.dropdown-menu a.dropdown-item, ul[aria-label="nav-categories"] a')
      .filter({ hasText: new RegExp(`^\\s*${categoryName}\\s*$`, 'i') })
      .or(this.page.locator('.dropdown-menu a.dropdown-item', { hasText: categoryName }))
      .first();
    await categoryLink.click();
  }

  /**
   * Returns the count of items in the cart badge.
   * Returns 0 if badge is not visible or empty.
   */
  async getCartItemCount(): Promise<number> {
    const isVisible = await this.cartQuantity.isVisible().catch(() => false);
    if (!isVisible) {
      return 0;
    }
    const text = await this.cartQuantity.textContent();
    if (!text) {
      return 0;
    }
    return parseInt(text.trim(), 10) || 0;
  }
}
