import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of home page
    await page.screenshot({ path: 'verification-home.png' });
    console.log('Home page screenshot captured');

    // Wait for a moment
    await page.waitForTimeout(1000);

    // Try to register a new user
    // Look for the "Regístrate" link/button. It might be inside the login form or header.
    // Based on typical auth flows, let's try to find it.
    try {
        await page.click('text=Regístrate');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'verification-register.png' });
        console.log('Register page screenshot captured');
    } catch (e) {
        console.log('Could not click Regístrate, maybe already on register or not found:', e.message);
    }

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await browser.close();
  }
}

verify();
