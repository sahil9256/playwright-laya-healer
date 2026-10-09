import { APIRequestContext, APIResponse } from '@playwright/test';

export interface InvoiceItem {
  id: string;
  invoice_number?: string;
  invoice_date?: string;
  total?: number;
  status?: string;
  [key: string]: any;
}

export interface PaginatedInvoices {
  current_page: number;
  data: InvoiceItem[];
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export class InvoiceHelper {
  constructor(private defaultContext?: APIRequestContext) {}

  private resolveContext(requestContext?: APIRequestContext): APIRequestContext {
    const ctx = requestContext || this.defaultContext;
    if (!ctx) {
      throw new Error('APIRequestContext must be provided either in constructor or as a method argument.');
    }
    return ctx;
  }

  async getInvoicesResponse(requestContext?: APIRequestContext): Promise<APIResponse> {
    const ctx = this.resolveContext(requestContext);
    return await ctx.get('/invoices');
  }

  async getInvoices(requestContext?: APIRequestContext): Promise<PaginatedInvoices> {
    const res = await this.getInvoicesResponse(requestContext);
    if (!res.ok()) {
      throw new Error(`getInvoices failed with status ${res.status()}: ${await res.text()}`);
    }
    return (await res.json()) as PaginatedInvoices;
  }

  async checkPdfStatusResponse(requestContext: APIRequestContext, invoiceId: string): Promise<APIResponse> {
    return await requestContext.get(`/invoices/${invoiceId}/download-pdf-status`);
  }

  async checkPdfStatus(requestContext: APIRequestContext, invoiceId: string): Promise<any> {
    const res = await this.checkPdfStatusResponse(requestContext, invoiceId);
    return await res.json();
  }
}

export async function getInvoices(requestContext: APIRequestContext): Promise<PaginatedInvoices> {
  return new InvoiceHelper(requestContext).getInvoices();
}

export async function checkPdfStatus(requestContext: APIRequestContext, invoiceId: string): Promise<any> {
  return new InvoiceHelper(requestContext).checkPdfStatus(requestContext, invoiceId);
}
