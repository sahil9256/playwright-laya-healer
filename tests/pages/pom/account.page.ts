import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export class AccountPage extends BasePage {
  readonly navProfile: Locator = this.page.getByTestId('nav-profile');
  readonly navInvoices: Locator = this.page.getByTestId('nav-invoices');
  readonly navFavorites: Locator = this.page.getByTestId('nav-favorites');
  readonly navMessages: Locator = this.page.getByTestId('nav-messages');
  readonly pageTitle: Locator = this.page.getByTestId('page-title');
  readonly invoicesTable: Locator = this.page.locator('table');
  readonly invoicesRows: Locator = this.page.locator('table tbody tr');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigates to account dashboard.
   */
  async open(): Promise<void> {
    await this.goto('/account');
    await this.waitForLoaded();
  }

  /**
   * Navigates to Invoices section within account dashboard.
   */
  async goToInvoices(): Promise<void> {
    await this.navInvoices.click();
    await this.invoicesTable.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }

  /**
   * Navigates to Profile section within account dashboard.
   */
  async goToProfile(): Promise<void> {
    await this.navProfile.click();
  }

  /**
   * Navigates to Favorites section within account dashboard.
   */
  async goToFavorites(): Promise<void> {
    await this.navFavorites.click();
  }

  /**
   * Navigates to Messages section within account dashboard.
   */
  async goToMessages(): Promise<void> {
    await this.navMessages.click();
  }

  /**
   * Returns count of rows displayed in the invoices table.
   */
  async getInvoicesCount(): Promise<number> {
    return await this.invoicesRows.count();
  }

  /**
   * Returns current account subpage / section title text.
   */
  async getTitleText(): Promise<string> {
    const text = await this.pageTitle.textContent();
    return text ? text.trim() : '';
  }
}
