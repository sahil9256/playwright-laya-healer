import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export interface AdminNewProduct {
  name: string;
  price: number;
  description: string;
  stock: number;
  category: string;
  brand: string;
}

export class AdminDashboardPage extends BasePage {
  readonly navProducts: Locator = this.page.getByTestId('nav-admin-products');
  readonly navOrders: Locator = this.page.getByTestId('nav-admin-orders');
  readonly navUsers: Locator = this.page.getByTestId('nav-admin-users');

  // Product addition form locators
  readonly addProductButton: Locator = this.page
    .getByTestId('product-add')
    .or(this.page.locator('a[href*="/admin/products/add"], [data-test="page-title"] + a'));
  readonly productNameInput: Locator = this.page.getByTestId('product-name');
  readonly productDescriptionInput: Locator = this.page
    .getByTestId('product-description')
    .or(this.page.locator('textarea[data-test="description"], [data-test="description"]'));
  readonly productPriceInput: Locator = this.page.getByTestId('product-price').or(this.page.getByTestId('price'));
  readonly productStockInput: Locator = this.page.getByTestId('product-stock').or(this.page.getByTestId('stock'));
  readonly productCategorySelect: Locator = this.page
    .getByTestId('product-category')
    .or(this.page.getByTestId('category-id'))
    .or(this.page.getByTestId('category'));
  readonly productBrandSelect: Locator = this.page
    .getByTestId('product-brand')
    .or(this.page.getByTestId('brand-id'))
    .or(this.page.getByTestId('brand'));
  readonly productSubmitButton: Locator = this.page
    .getByTestId('product-submit')
    .or(this.page.getByTestId('btn-submit'));

  // Tables
  readonly productsTableRows: Locator = this.page.locator('table tbody tr');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigates to admin dashboard.
   */
  async open(): Promise<void> {
    await this.goto('/admin/dashboard');
    await this.waitForLoaded();
  }

  /**
   * Navigates to Products management view.
   */
  async openProducts(): Promise<void> {
    const isVisible = await this.navProducts.isVisible().catch(() => false);
    if (!isVisible) {
      await this.page.getByTestId('nav-menu').click();
      await this.navProducts.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    }
    if (await this.navProducts.isVisible().catch(() => false)) {
      await this.navProducts.click();
    } else {
      await this.goto('/admin/products');
    }
    await this.productsTableRows.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }

  /**
   * Fills and submits new product form.
   */
  async addNewProduct(productData: AdminNewProduct): Promise<void> {
    // If add product button is visible, click it first
    if (await this.addProductButton.isVisible().catch(() => false)) {
      await this.addProductButton.click();
    }

    await this.productNameInput.fill(productData.name);

    if (await this.productDescriptionInput.isVisible().catch(() => false)) {
      await this.productDescriptionInput.fill(productData.description);
    }

    if (await this.productPriceInput.isVisible().catch(() => false)) {
      await this.productPriceInput.fill(String(productData.price));
    }

    if (await this.productStockInput.isVisible().catch(() => false)) {
      await this.productStockInput.fill(String(productData.stock));
    }

    if (await this.productCategorySelect.isVisible().catch(() => false)) {
      try {
        await this.productCategorySelect.selectOption({ label: productData.category });
      } catch {
        await this.productCategorySelect.selectOption({ value: productData.category });
      }
    }

    if (await this.productBrandSelect.isVisible().catch(() => false)) {
      try {
        await this.productBrandSelect.selectOption({ label: productData.brand });
      } catch {
        await this.productBrandSelect.selectOption({ value: productData.brand });
      }
    }

    await this.productSubmitButton.click();
  }

  /**
   * Returns count of product rows in the products table.
   */
  async getProductsCount(): Promise<number> {
    return await this.productsTableRows.count();
  }
}
