import { test, expect } from '../../../setup/api/fixtures.ts';

test.describe('API Invoices', () => {
  test('retrieve invoice list for logged-in user', async ({ apiAs, invoiceHelper }) => {
    const adminApi = await apiAs('admin');
    const response = await invoiceHelper.getInvoicesResponse(adminApi);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);

    if (body.data.length > 0) {
      const firstInvoice = body.data[0];
      expect(firstInvoice).toHaveProperty('id');
      expect(firstInvoice).toHaveProperty('invoice_number');

      // Verify PDF status endpoint for existing invoice
      const pdfStatusRes = await invoiceHelper.checkPdfStatusResponse(adminApi, firstInvoice.id);
      expect([200, 400]).toContain(pdfStatusRes.status());
    }
  });
});
