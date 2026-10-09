import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page.ts';
import {
  HeaderComponent,
  FilterSidebarComponent,
  PaginationComponent,
  ProductCardComponent,
} from '../components/index.ts';

export class HomePage extends BasePage {
  readonly header: HeaderComponent;
  readonly filterSidebar: FilterSidebarComponent;
  readonly pagination: PaginationComponent;
  readonly cardItems: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.filterSidebar = new FilterSidebarComponent(page);
    this.pagination = new PaginationComponent(page);
    this.cardItems = this.page
      .locator('a.card, [data-test^="product-"]')
      .filter({ has: this.page.getByTestId('product-name') });
  }

  /**
   * Navigates to the Home page ('/').
   */
  async open(): Promise<void> {
    await this.goto('/');
    await this.waitForLoaded();
  }

  /**
   * Overridden waitForLoaded waiting for DOM and product cards visibility.
   */
  override async waitForLoaded(): Promise<void> {
    await super.waitForLoaded();
    await this.cardItems.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  /**
   * Returns an array of instantiated ProductCardComponent instances currently rendered on the page.
   */
  async getProductCards(): Promise<ProductCardComponent[]> {
    const count = await this.cardItems.count();
    const cards: ProductCardComponent[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(new ProductCardComponent(this.page, this.cardItems.nth(i)));
    }
    return cards;
  }

  /**
   * Finds a product card by name and clicks it to open the details view.
   */
  async openProductByName(name: string): Promise<void> {
    const cardByName = this.cardItems
      .filter({
        has: this.page.getByTestId('product-name').filter({ hasText: new RegExp(`^\\s*${name}\\s*$`, 'i') }),
      })
      .first();

    if (await cardByName.isVisible().catch(() => false)) {
      await cardByName.click();
      return;
    }

    // Fallback: search by partial text
    const fallbackCard = this.cardItems.filter({ hasText: name }).first();
    await fallbackCard.click();
  }

  /**
   * Returns the count of product cards displayed on the home page.
   */
  async getProductCount(): Promise<number> {
    return await this.cardItems.count();
  }
}
