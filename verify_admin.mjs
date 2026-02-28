import { chromium } from 'playwright';
import path from 'path';

async function verify() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to local file
    const fileUrl = 'file://' + path.resolve('admin.html');
    await page.goto(fileUrl);

    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait a bit for the script to execute and fetch (if configured) or show error

    // Take screenshot of admin page
    await page.screenshot({ path: 'verification-admin.png' });
    console.log('Admin page screenshot captured');

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await browser.close();
  }
}

verify();
