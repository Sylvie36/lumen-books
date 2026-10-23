const { chromium } = require('playwright');

(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(1200);

  const bookCount = await page.locator('.bw-book').count();
  const faceCheck = await page.evaluate(() => {
    const b = document.querySelector('.bw-book');
    return b ? { faces: b.querySelectorAll('.bw-face').length, hasTip: !!b.querySelector('.bw-tip') } : null;
  });
  console.log('books:', bookCount, 'faces:', JSON.stringify(faceCheck));

  // hover first book
  await page.locator('.bw-book').first().hover();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'shot-hover.png' });

  // filter: 文学小说
  await page.locator('.bw-filter', { hasText: '文学小说' }).click();
  await page.waitForTimeout(600);
  const visible = await page.locator('.bw-book:visible').count();
  console.log('after filter 文学小说 visible:', visible);
  await page.screenshot({ path: 'shot-filter.png' });

  // reset to all, click a book -> market.html
  await page.locator('.bw-filter', { hasText: '全部藏书' }).click();
  await page.waitForTimeout(400);
  await page.locator('.bw-book').nth(3).click();
  await page.waitForTimeout(1000);
  console.log('url after click:', page.url());
  await page.screenshot({ path: 'shot-market.png' });

  // mobile
  const page2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page2.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await page2.goto('http://localhost:8000/index.html');
  await page2.waitForTimeout(1200);
  const overflow = await page2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  console.log('mobile horizontal overflow:', overflow);
  await page2.screenshot({ path: 'shot-mobile.png' });

  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
