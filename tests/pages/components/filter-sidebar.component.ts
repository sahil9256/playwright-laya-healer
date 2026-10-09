import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

export class FilterSidebarComponent extends BaseComponent {
  readonly searchInput: Locator = this.root.getByTestId('search-query');
  readonly searchButton: Locator = this.root.getByTestId('search-submit');
  readonly searchResetButton: Locator = this.root.getByTestId('search-reset');
  readonly priceSlider: Locator = this.root.locator('[data-test="price-slider"]').or(this.root.locator('.ngx-slider'));
  readonly sortSelect: Locator = this.root.getByTestId('sort');

  constructor(
    page: Page,
    root: Locator = page.locator('div[data-test="filters"]').or(page.locator('#filters')).first()
  ) {
    super(page, root);
  }

  /**
   * Returns locator for a brand checkbox by label/name.
   */
  getBrandCheckbox(brand: string): Locator {
    return this.root
      .getByRole('checkbox', { name: brand })
      .or(this.page.getByRole('checkbox', { name: brand }))
      .or(this.root.getByLabel(brand))
      .first();
  }

  /**
   * Returns locator for a category checkbox by label/name.
   */
  getCategoryCheckbox(category: string): Locator {
    return this.root
      .getByRole('checkbox', { name: category })
      .or(this.page.getByRole('checkbox', { name: category }))
      .or(this.root.getByLabel(category))
      .first();
  }

  /**
   * Checks the checkbox for the given brand.
   */
  async filterByBrand(brand: string): Promise<void> {
    const checkbox = this.getBrandCheckbox(brand);
    await checkbox.check();
  }

  /**
   * Checks the checkbox for the given category.
   */
  async filterByCategory(category: string): Promise<void> {
    const checkbox = this.getCategoryCheckbox(category);
    await checkbox.check();
  }

  /**
   * Clears active filters (resets search query and unchecks selected checkboxes).
   */
  async clearFilters(): Promise<void> {
    if (await this.searchResetButton.isVisible()) {
      await this.searchResetButton.click();
    } else if (await this.searchInput.isVisible()) {
      await this.searchInput.clear();
    }

    const checkedBoxes = this.root.locator('input[type="checkbox"]:checked');
    const count = await checkedBoxes.count();
    for (let i = 0; i < count; i++) {
      const box = this.root.locator('input[type="checkbox"]:checked').first();
      if (await box.isVisible()) {
        await box.uncheck();
      }
    }
  }
}
