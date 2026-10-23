const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(800);
  await page.locator('a[href="market.html"]').first().click({ force: true });
  for (let t = 0; t <= 900; t += 150) {
    await page.waitForTimeout(150);
    try {
      const u = await page.evaluate(() => location.pathname + location.search + ' | ' + document.documentElement.className);
      console.log(t + 150 + 'ms:', u);
    } catch (e) { console.log(t + 150 + 'ms: [navigating]', page.url()); }
  }
  console.log('final:', page.url());
  await browser.close();
})();
