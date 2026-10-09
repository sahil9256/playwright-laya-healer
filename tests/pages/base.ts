import { test as base, expect } from '@playwright/test';
import { type UserRole } from '../../data/users.ts';
import { ensureAuthenticatedSession } from '../../setup/utils/auth-manager.ts';
import { collectCandidates } from '../../agent/perception.ts';
import { HeaderComponent } from './components/header.component.ts';
import { FilterSidebarComponent } from './components/filter-sidebar.component.ts';
import { PaginationComponent } from './components/pagination.component.ts';
import {
  HomePage,
  ProductDetailsPage,
  CartPage,
  CheckoutPage,
  LoginPage,
  RegisterPage,
  AccountPage,
  ContactPage,
  AdminDashboardPage,
} from './pom/index.ts';

export type UiFixtures = {
  userRole: UserRole;
  header: HeaderComponent;
  filterSidebar: FilterSidebarComponent;
  pagination: PaginationComponent;
  homePage: HomePage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  accountPage: AccountPage;
  contactPage: ContactPage;
  adminDashboardPage: AdminDashboardPage;
  healSnapshot: void;
  simulateUiChange: void;
};

export const test = base.extend<UiFixtures>({
  userRole: ['guest', { option: true }],

  storageState: async ({ userRole, baseURL }, use) => {
    if (userRole === 'guest') {
      await use(undefined);
      return;
    }

    const sessionPath = await ensureAuthenticatedSession(userRole, baseURL);
    await use(sessionPath || undefined);
  },

  header: async ({ page }, use) => {
    await use(new HeaderComponent(page));
  },

  filterSidebar: async ({ page }, use) => {
    await use(new FilterSidebarComponent(page));
  },

  pagination: async ({ page }, use) => {
    await use(new PaginationComponent(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },

  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },

  adminDashboardPage: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },

  // Laya healer: when a test fails, save the clickable elements on the page at that moment.
  healSnapshot: [
    async ({ page }, use, testInfo) => {
      await use(); // the test runs here
      if (testInfo.status !== testInfo.expectedStatus) {
        const candidates = await collectCandidates(page).catch(() => []);
        await testInfo.attach('heal-snapshot', {
          body: JSON.stringify({ url: page.url(), candidates }, null, 2),
          contentType: 'application/json',
        });
      }
    },
    { auto: true },
  ],

  // Demo only: pretend the developers changed the cart's checkout button, without touching the
  // real website. Set SIMULATE_UI_CHANGE in env/.env.simulate.local (or the shell):
  //   1 = renamed: data-test "checkout-continue", text "Continue to checkout" (Laya can fix this)
  //   2 = icon only: data-test "btn-next", text "→" (too little meaning for Laya: Claude's job)
  simulateUiChange: [
    async ({ page }, use) => {
      const changes: Record<string, { testId: string; text: string }> = {
        '1': { testId: 'checkout-continue', text: 'Continue to checkout' },
        '2': { testId: 'btn-next', text: '→' },
      };
      const change = changes[process.env.SIMULATE_UI_CHANGE ?? ''];
      if (change) {
        await page.addInitScript(({ testId, text }) => {
          const rename = () => {
            const button = document.querySelector('[data-test="proceed-1"]');
            if (button) {
              button.setAttribute('data-test', testId);
              button.textContent = text;
            }
          };
          // The app draws the button later, so watch the page and rename it when it appears.
          new MutationObserver(rename).observe(document, { childList: true, subtree: true });
        }, change);
      }
      await use();
    },
    { auto: true },
  ],
});

export { expect };
export { BasePage } from './base-page.ts';
export { BaseComponent } from './base-component.ts';
export {
  HeaderComponent,
  FilterSidebarComponent,
  ProductCardComponent,
  PaginationComponent,
} from './components/index.ts';
export {
  HomePage,
  ProductDetailsPage,
  CartPage,
  CheckoutPage,
  LoginPage,
  RegisterPage,
  AccountPage,
  ContactPage,
  AdminDashboardPage,
  type PaymentMethod,
  type ContactFormData,
  type AdminNewProduct,
} from './pom/index.ts';
