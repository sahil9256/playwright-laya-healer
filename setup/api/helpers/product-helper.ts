import { APIRequestContext, APIResponse } from '@playwright/test';

export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id?: string;
  brand_id?: string;
  is_location_offer?: boolean;
  is_rental?: boolean;
  product_image_id?: string;
  [key: string]: any;
}

export interface PaginatedProducts {
  current_page: number;
  data: ProductItem[];
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export class ProductHelper {
  constructor(private request: APIRequestContext) {}

  async getProductsResponse(params?: Record<string, string | number>): Promise<APIResponse> {
    const stringParams: Record<string, string> = {};
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        stringParams[key] = String(val);
      }
    }
    return await this.request.get('/products', {
      params: stringParams,
    });
  }

  async getProducts(params?: Record<string, string | number>): Promise<PaginatedProducts> {
    const res = await this.getProductsResponse(params);
    if (!res.ok()) {
      throw new Error(`getProducts failed with status ${res.status()}: ${await res.text()}`);
    }
    return (await res.json()) as PaginatedProducts;
  }

  async getProductByIdResponse(id: string): Promise<APIResponse> {
    return await this.request.get(`/products/${id}`);
  }

  async getProductById(id: string): Promise<ProductItem> {
    const res = await this.getProductByIdResponse(id);
    if (!res.ok()) {
      throw new Error(`getProductById failed with status ${res.status()}: ${await res.text()}`);
    }
    return (await res.json()) as ProductItem;
  }

  async searchProductsResponse(query: string): Promise<APIResponse> {
    return await this.request.get('/products/search', {
      params: { q: query },
    });
  }

  async searchProducts(query: string): Promise<PaginatedProducts> {
    const res = await this.searchProductsResponse(query);
    if (!res.ok()) {
      throw new Error(`searchProducts failed with status ${res.status()}: ${await res.text()}`);
    }
    return (await res.json()) as PaginatedProducts;
  }
}

export async function getProducts(
  request: APIRequestContext,
  params?: Record<string, string | number>
): Promise<PaginatedProducts> {
  return new ProductHelper(request).getProducts(params);
}

export async function getProductById(request: APIRequestContext, id: string): Promise<ProductItem> {
  return new ProductHelper(request).getProductById(id);
}

export async function searchProducts(request: APIRequestContext, query: string): Promise<PaginatedProducts> {
  return new ProductHelper(request).searchProducts(query);
}
