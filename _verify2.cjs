const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(1500);

  // 对角递升：右侧书应更高（top 更小）
  const tops = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.bw-book')).map(b => Math.round(b.getBoundingClientRect().top)));
  console.log('tops first/mid/last:', tops[0], tops[7], tops[14]);

  await page.locator('.bw-book').nth(7).hover();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shot-foliom-hover.png' });

  await page.locator('.bw-filter', { hasText: '社科人文' }).click();
  await page.waitForTimeout(600);
  console.log('filter visible:', await page.locator('.bw-book:visible').count());

  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
