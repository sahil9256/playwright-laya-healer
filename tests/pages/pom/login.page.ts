import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export class LoginPage extends BasePage {
  readonly emailInput: Locator = this.page.getByTestId('email');
  readonly passwordInput: Locator = this.page.getByTestId('password');
  readonly loginSubmitButton: Locator = this.page.getByTestId('login-submit');
  readonly loginError: Locator = this.page
    .getByTestId('login-error')
    .or(this.page.locator('.alert-danger, [data-test="login-error"]'));
  readonly registerLink: Locator = this.page
    .getByTestId('register-link')
    .or(this.page.locator('a[href*="/auth/register"]'));

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigates to login page.
   */
  async open(): Promise<void> {
    await this.goto('/auth/login');
    await this.waitForLoaded();
  }

  /**
   * Fills credentials and clicks login submit button.
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginSubmitButton.click();
  }

  /**
   * Returns error message text if login failed.
   */
  async getErrorMessage(): Promise<string> {
    const isVisible = await this.loginError.first().isVisible().catch(() => false);
    if (!isVisible) {
      return '';
    }
    const text = await this.loginError.first().textContent();
    return text ? text.trim() : '';
  }

  /**
   * Clicks register link to navigate to registration page.
   */
  async goToRegister(): Promise<void> {
    await this.registerLink.first().click();
  }
}
