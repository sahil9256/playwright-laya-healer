import { type Locator, type Page } from '@playwright/test';

/**
 * Base abstract class for reusable UI Component Objects.
 */
export abstract class BaseComponent {
  constructor(
    protected readonly page: Page,
    public readonly root: Locator
  ) {}
}
