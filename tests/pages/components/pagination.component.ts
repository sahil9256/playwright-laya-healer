import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

export class PaginationComponent extends BaseComponent {
  readonly prevButton: Locator = this.root
    .getByTestId('pagination-prev')
    .or(this.root.locator('button[aria-label="Previous"], a[aria-label="Previous"]'))
    .first();

  readonly nextButton: Locator = this.root
    .getByTestId('pagination-next')
    .or(this.root.locator('button[aria-label="Next"], a[aria-label="Next"]'))
    .first();

  readonly pageButtons: Locator = this.root.locator('button.page-link, a.page-link');

  constructor(page: Page, root: Locator = page.locator('ul.pagination').first()) {
    super(page, root);
  }

  /**
   * Navigates to a specific pagination page number by clicking its button.
   */
  async goToPage(pageNum: number): Promise<void> {
    const pageBtn = this.root
      .locator(`button[aria-label="Page-${pageNum}"], a[aria-label="Page-${pageNum}"]`)
      .or(this.root.getByRole('button', { name: String(pageNum), exact: true }))
      .or(this.root.locator('button, a', { hasText: new RegExp(`^\\s*${pageNum}\\s*$`) }))
      .first();
    await pageBtn.click();
  }

  /**
   * Clicks the Next page button.
   */
  async next(): Promise<void> {
    await this.nextButton.click();
  }

  /**
   * Clicks the Previous page button.
   */
  async previous(): Promise<void> {
    await this.prevButton.click();
  }

  /**
   * Returns the currently active page number.
   */
  async getCurrentPage(): Promise<number> {
    const activeItem = this.root.locator('li.active button, li.active a, .active').first();
    const text = await activeItem.textContent();
    return text ? parseInt(text.trim(), 10) || 1 : 1;
  }
}
