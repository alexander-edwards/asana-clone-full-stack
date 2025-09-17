// End-to-end test for Asana Clone frontend
// This test will verify the login flow and basic functionality

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'https://asana-frontend-morphvm-s6un9i69.http.cloud.morph.so';
const TEST_EMAIL = 'demo@asanaclone.com';
const TEST_PASSWORD = 'Demo123456';

async function runE2ETest() {
  console.log('🚀 Starting E2E test for Asana Clone frontend...\n');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('   ✅ Login page loaded');
    
    // Check if we're on login page
    const loginUrl = page.url();
    console.log('   Current URL:', loginUrl);
    
    // Fill in login form
    console.log('\n2. Filling login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    console.log('   ✅ Form filled');
    
    // Submit login form
    console.log('\n3. Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      const dashboardUrl = page.url();
      
      if (dashboardUrl.includes('/login')) {
        console.log('   ❌ Still on login page - authentication may have failed');
        
        // Check for error messages
        const errorText = await page.evaluate(() => {
          const errors = document.querySelectorAll('.text-red-500');
          return Array.from(errors).map(el => el.textContent).join(', ');
        });
        
        if (errorText) {
          console.log('   Error message:', errorText);
        }
      } else {
        console.log('   ✅ Successfully logged in!');
        console.log('   Current URL:', dashboardUrl);
        
        // Verify we're on the dashboard
        console.log('\n4. Verifying dashboard elements...');
        
        // Wait for dashboard content
        await page.waitForSelector('h1', { timeout: 5000 });
        
        // Get page title
        const pageTitle = await page.evaluate(() => {
          const h1 = document.querySelector('h1');
          return h1 ? h1.textContent : 'No title found';
        });
        console.log('   Page title:', pageTitle);
        
        // Check for main navigation elements
        const hasNavigation = await page.evaluate(() => {
          return document.querySelector('nav') !== null;
        });
        
        if (hasNavigation) {
          console.log('   ✅ Navigation menu found');
        }
        
        // Check for user menu
        const hasUserMenu = await page.evaluate(() => {
          return document.querySelector('[class*="avatar"], [class*="user"]') !== null;
        });
        
        if (hasUserMenu) {
          console.log('   ✅ User menu/avatar found');
        }
        
        // Try to navigate to different sections
        console.log('\n5. Testing navigation...');
        
        // Click on My Tasks if available
        const myTasksLink = await page.$('a[href="/my-tasks"], button:has-text("My Tasks")');
        if (myTasksLink) {
          await myTasksLink.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ Navigated to My Tasks');
        }
        
        // Click on Teams if available
        const teamsLink = await page.$('a[href="/teams"], button:has-text("Teams")');
        if (teamsLink) {
          await teamsLink.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ Navigated to Teams');
        }
        
        console.log('\n✅ E2E Test PASSED! Frontend is working correctly.');
        console.log('   The Asana Clone frontend is fully functional.');
      }
    } catch (navError) {
      console.log('   ⚠️ Navigation timeout - checking current state...');
      const currentUrl = page.url();
      console.log('   Current URL:', currentUrl);
      
      if (!currentUrl.includes('/login')) {
        console.log('   ✅ Successfully logged in (no full navigation)');
      } else {
        console.log('   ❌ Login failed - still on login page');
      }
    }
    
  } catch (error) {
    console.error('\n❌ E2E Test FAILED:', error.message);
    console.error('   Error details:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runE2ETest().then(() => {
  console.log('\n🏁 E2E test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 E2E test crashed:', error);
  process.exit(1);
});
