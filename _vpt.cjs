const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(900);

  // 前进转场（点击被书墙遮挡的导航 → force；实际生效的是书墙里的 market 链接，同站内跳转）
  await page.locator('a[href^="market.html"]').first().click({ force: true });
  await page.waitForTimeout(250);
  console.log('leave mid:', await page.evaluate(() => ({
    cls: document.documentElement.className,
    bodyT: getComputedStyle(document.body).transform
  })).then(r => JSON.stringify(r)).catch(() => '[navigating]'));
  await page.waitForURL(/market\.html/, { timeout: 3000 });
  await page.waitForTimeout(80);
  console.log('enter mid:', await page.evaluate(() => ({
    cls: document.documentElement.className,
    panel: getComputedStyle(document.getElementById('pt-panel')).transform
  })).then(r => JSON.stringify(r)));
  await page.waitForTimeout(900);
  console.log('settled:', await page.evaluate(() => ({
    html: document.documentElement.className,
    bodyT: document.body.style.transform,
    bodyOp: document.body.style.opacity
  })).then(r => JSON.stringify(r)));

  // 返回方向：从 market 真实点击回 index（referrer = market，但目标 index 是 referrer 的上一页？
  // isBackNav 判据：目标 URL 与 document.referrer 相同 → 需先 index→market 点击链，再点回 index 时 referrer=market ≠ index
  // 真实场景「返回」指目标=referrer：模拟 A→B 后从 B 点回 A 时 referrer 是 A → 匹配。
  // 但当前页 B 的 referrer 恰是 A，所以从 B 点「A 的链接」即命中 back。
  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const a = document.querySelector('a[href^="market.html"]');
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  });
  await page.waitForURL(/market\.html/, { timeout: 3000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const a = document.querySelector('a[href="index.html"]');
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  });
  await page.waitForTimeout(250);
  console.log('back leave mid:', await page.evaluate(() => ({
    cls: document.documentElement.className,
    origin: document.getElementById('pt-panel').style.transformOrigin
  })).then(r => JSON.stringify(r)).catch(() => '[navigating]'));
  await page.waitForURL(/index\.html/, { timeout: 3000 });
  await page.waitForTimeout(80);
  console.log('back enter mid:', await page.evaluate(() => ({
    cls: document.documentElement.className,
    origin: document.getElementById('pt-panel').style.transformOrigin
  })).then(r => JSON.stringify(r)));
  await page.waitForTimeout(900);

  // 锚点不触发
  await page.evaluate(() => window.scrollTo(0, 400));
  const hashOk = await page.evaluate(() => {
    const a = document.querySelector('a[href^="#"]');
    if (!a) return 'no-hash-link';
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    return !document.documentElement.className.includes('pt-leave');
  });
  console.log('hash click inert:', hashOk);

  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
