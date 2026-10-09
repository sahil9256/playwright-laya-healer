import { type Page, type Route } from '@playwright/test';
import emptyProductsData from './data/empty-products.json' with { type: 'json' };
import customProductsData from './data/custom-products.json' with { type: 'json' };

export class ApiMockHelper {
  constructor(private readonly page: Page) {}

  /**
   * Mocks the product list API response with custom data or provided JSON.
   */
  async mockProducts(data: any = customProductsData, status = 200): Promise<void> {
    await this.page.route(/\/products(\?.*)?$/, async (route: Route) => {
      // Allow specific subpaths like /products/search or /products/:id to pass if not matching the list
      const url = new URL(route.request().url());
      if (url.pathname === '/products') {
        await route.fulfill({
          status,
          contentType: 'application/json',
          json: data,
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Mocks empty product catalog response (0 products found).
   */
  async mockEmptyProducts(): Promise<void> {
    await this.mockProducts(emptyProductsData, 200);
  }

  /**
   * Demonstrates Playwright `route.fetch()`: fetches the real API response from backend,
   * injects a promotional or custom product at the beginning of the list,
   * and fulfills the browser request with the enriched JSON.
   */
  async interceptAndPrependProduct(fakeProduct: any): Promise<void> {
    await this.page.route(/\/products(\?.*)?$/, async (route: Route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/products') {
        const response = await route.fetch({ method: 'GET' });
        const json = await response.json();

        if (Array.isArray(json.data)) {
          json.data.unshift(fakeProduct);
          json.total = (json.total || 0) + 1;
        }

        await route.fulfill({
          response,
          json,
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Mocks the login endpoint response with a specific HTTP status and error payload.
   */
  async mockLoginResponse(status: number, body: any): Promise<void> {
    await this.page.route('**/users/login', async (route: Route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        json: body,
      });
    });
  }

  /**
   * Simulates network failure (e.g. offline, connection abort or timeout) using `route.abort()`.
   */
  async abortRequests(
    urlPattern: string | RegExp,
    errorReason: 'failed' | 'aborted' | 'timedout' | 'connectionreset' = 'failed'
  ): Promise<void> {
    await this.page.route(urlPattern, async (route: Route) => {
      await route.abort(errorReason);
    });
  }

  /**
   * Introduces artificial latency / network delay before fulfilling or continuing the request.
   */
  async delayResponse(urlPattern: string | RegExp, delayMs = 1500): Promise<void> {
    await this.page.route(urlPattern, async (route: Route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  /**
   * Selectively mocks GraphQL queries / mutations matching a specific operationName,
   * while letting other GraphQL operations pass through to the backend.
   */
  async mockGraphQL(operationName: string, mockData: any): Promise<void> {
    await this.page.route('**/graphql', async (route: Route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();
        if (
          postData?.operationName === operationName ||
          (typeof postData?.query === 'string' && postData.query.includes(operationName))
        ) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: mockData,
          });
          return;
        }
      }
      await route.continue();
    });
  }
}
