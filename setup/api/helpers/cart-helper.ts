import { APIRequestContext, APIResponse } from '@playwright/test';

export interface CartCreatedResponse {
  id: string;
  [key: string]: any;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  discount_percentage?: number | null;
  product?: any;
  [key: string]: any;
}

export interface CartDetails {
  id: string;
  additional_discount_percentage?: number | null;
  lat?: number | null;
  lng?: number | null;
  cart_items?: CartItem[];
  [key: string]: any;
}

export class CartHelper {
  constructor(private request: APIRequestContext) {}

  async createCartResponse(): Promise<APIResponse> {
    return await this.request.post('/carts');
  }

  async createCart(): Promise<CartCreatedResponse> {
    const res = await this.createCartResponse();
    if (!res.ok()) {
      throw new Error(`createCart failed with status ${res.status()}: ${await res.text()}`);
    }
    return (await res.json()) as CartCreatedResponse;
  }

  async addItemToCartResponse(cartId: string, productId: string, quantity = 1): Promise<APIResponse> {
    return await this.request.post(`/carts/${cartId}`, {
      data: {
        product_id: productId,
        quantity,
      },
    });
  }

  async addItemToCart(cartId: string, productId: string, quantity = 1): Promise<any> {
    const res = await this.addItemToCartResponse(cartId, productId, quantity);
    if (!res.ok()) {
      throw new Error(`addItemToCart failed with status ${res.status()}: ${await res.text()}`);
    }
    return await res.json();
  }

  async getCartResponse(cartId: string): Promise<APIResponse> {
    return await this.request.get(`/carts/${cartId}`);
  }

  async getCart(cartId: string): Promise<CartDetails> {
    const res = await this.getCartResponse(cartId);
    if (!res.ok()) {
      throw new Error(`getCart failed with status ${res.status()}: ${await res.text()}`);
    }
    return (await res.json()) as CartDetails;
  }
}

export async function createCart(request: APIRequestContext): Promise<CartCreatedResponse> {
  return new CartHelper(request).createCart();
}

export async function addItemToCart(
  request: APIRequestContext,
  cartId: string,
  productId: string,
  quantity = 1
): Promise<any> {
  return new CartHelper(request).addItemToCart(cartId, productId, quantity);
}

export async function getCart(request: APIRequestContext, cartId: string): Promise<CartDetails> {
  return new CartHelper(request).getCart(cartId);
}
