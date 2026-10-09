import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@pages/base';
import { generateContactMessage } from '@data/test-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixtureFile = path.resolve(__dirname, '../../../../data/fixtures/sample-attachment.txt');

test.describe('E2E — Contact', () => {
  test('submit contact form with file attachment', async ({ contactPage }) => {
    const contactMessage = generateContactMessage({
      subject: 'Customer service',
      message: 'This is an automated test message regarding toolshop order inquiry with attachment.',
    });

    await contactPage.open();
    await contactPage.fillForm(contactMessage);
    await contactPage.attachFile(fixtureFile);
    await contactPage.submit();

    await expect(contactPage.successAlert.first()).toBeVisible({ timeout: 15000 });
    const alertText = await contactPage.getSuccessAlert();
    expect(alertText.length).toBeGreaterThan(0);
  });
});
