import { APIRequestContext, APIResponse } from '@playwright/test';

export interface CustomerAddress {
  street?: string;
  house_number?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface RegisterCustomerPayload {
  first_name: string;
  last_name: string;
  dob?: string;
  address?: string | CustomerAddress;
  postcode?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email: string;
  password?: string;
  [key: string]: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export function formatCustomerPayload(data: RegisterCustomerPayload) {
  let addressObj: CustomerAddress;
  if (typeof data.address === 'object' && data.address !== null) {
    addressObj = data.address;
  } else {
    addressObj = {
      street: typeof data.address === 'string' ? data.address : 'Street 1',
      city: data.city || 'City',
      state: data.state || 'State',
      country: data.country || 'Country',
      postal_code: data.postcode || (data as any).postal_code || '12345',
    };
  }

  return {
    first_name: data.first_name,
    last_name: data.last_name,
    dob: data.dob || '1990-01-01',
    address: addressObj,
    phone: data.phone || '1234567890',
    email: data.email,
    password: data.password || 'T00lsh@pSecure2026!',
  };
}

export class AuthHelper {
  constructor(private request: APIRequestContext) {}

  async loginResponse(credentials: LoginCredentials): Promise<APIResponse> {
    return await this.request.post('/users/login', {
      data: credentials,
    });
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await this.loginResponse(credentials);
    if (!res.ok()) {
      throw new Error(`Login failed with status ${res.status()}: ${await res.text()}`);
    }
    return (await res.json()) as LoginResponse;
  }

  async registerCustomerResponse(customerData: RegisterCustomerPayload): Promise<APIResponse> {
    const formatted = formatCustomerPayload(customerData);
    return await this.request.post('/users/register', {
      data: formatted,
    });
  }

  async registerCustomer(customerData: RegisterCustomerPayload): Promise<any> {
    const res = await this.registerCustomerResponse(customerData);
    if (!res.ok()) {
      throw new Error(`Register customer failed with status ${res.status()}: ${await res.text()}`);
    }
    return await res.json();
  }
}

export async function login(request: APIRequestContext, credentials: LoginCredentials): Promise<LoginResponse> {
  return new AuthHelper(request).login(credentials);
}

export async function registerCustomer(request: APIRequestContext, customerData: RegisterCustomerPayload): Promise<any> {
  return new AuthHelper(request).registerCustomer(customerData);
}
