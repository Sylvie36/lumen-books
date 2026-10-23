const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('console', m => console.log('console[' + m.type() + ']:', m.text()));
  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(800);
  console.log('panel exists:', await page.evaluate(() => !!document.getElementById('pt-panel')));
  console.log('pt.js loaded check:', await page.evaluate(() => document.documentElement.className));
  // 用 JS 直接派发点击监听测试
  const r = await page.evaluate(() => {
    const a = document.querySelector('a[href="market.html"]');
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    const notPrevented = a.dispatchEvent(ev);
    return { defaultAllowed: notPrevented, htmlClass: document.documentElement.className };
  });
  console.log('dispatch result:', JSON.stringify(r));
  await page.waitForTimeout(700);
  console.log('url now:', page.url());
  await browser.close();
})();
