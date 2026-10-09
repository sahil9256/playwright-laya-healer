import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page.ts';
import { type ContactMessage } from '../../../data/test-data.ts';

export interface ContactFormData {
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  subject: string;
  message: string;
}

export class ContactPage extends BasePage {
  readonly firstNameInput: Locator = this.page.getByTestId('first-name');
  readonly lastNameInput: Locator = this.page.getByTestId('last-name');
  readonly emailInput: Locator = this.page.getByTestId('email');
  readonly subjectSelect: Locator = this.page.getByTestId('subject');
  readonly messageInput: Locator = this.page.getByTestId('message');
  readonly attachmentInput: Locator = this.page
    .getByTestId('attachment')
    .or(this.page.locator('input[type="file"]'));
  readonly submitButton: Locator = this.page.getByTestId('contact-submit');
  readonly successAlert: Locator = this.page
    .locator('div.alert-success, [data-test="alert-success"], .alert-success');
  readonly errorAlert: Locator = this.page
    .locator('div.alert-danger, [data-test="alert-danger"], .alert-danger');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigates to the contact page.
   */
  async open(): Promise<void> {
    await this.goto('/contact');
    await this.waitForLoaded();
  }

  /**
   * Fills contact form inputs.
   */
  async fillForm(contactData: ContactFormData | ContactMessage): Promise<void> {
    const data = contactData as ContactFormData & { name?: string };

    let first = data.firstName || data.first_name || '';
    let last = data.lastName || data.last_name || '';

    if (!first && data.name) {
      const parts = data.name.trim().split(/\s+/);
      first = parts[0] || 'User';
      last = parts.slice(1).join(' ') || 'Customer';
    }

    if (first) {
      await this.firstNameInput.fill(first);
    }
    if (last) {
      await this.lastNameInput.fill(last);
    }
    if (data.email) {
      await this.emailInput.fill(data.email);
    }
    if (data.subject) {
      try {
        await this.subjectSelect.selectOption({ label: data.subject });
      } catch {
        await this.subjectSelect.selectOption({ value: data.subject });
      }
    }
    if (data.message) {
      await this.messageInput.fill(data.message);
    }
  }

  /**
   * Sets file payload into file attachment input.
   */
  async attachFile(filePath: string): Promise<void> {
    await this.attachmentInput.setInputFiles(filePath);
  }

  /**
   * Submits contact message form.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Returns text content of the success alert banner.
   */
  async getSuccessAlert(): Promise<string> {
    const isVisible = await this.successAlert.first().isVisible().catch(() => false);
    if (!isVisible) {
      return '';
    }
    const text = await this.successAlert.first().textContent();
    return text ? text.trim() : '';
  }
}
