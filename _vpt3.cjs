const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(900);

  // 前进：点击 → leave
  await page.evaluate(() => {
    document.querySelector('a[href^="market.html"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  });
  await page.waitForTimeout(250);
  console.log('leave mid:', JSON.stringify(await page.evaluate(() => ({
    cls: document.documentElement.className,
    panel: getComputedStyle(document.getElementById('pt-panel')).transform,
    bodyT: getComputedStyle(document.body).transform
  })).catch(() => 'nav')));

  await page.waitForURL(/market\.html/, { timeout: 3000 });
  await page.waitForTimeout(80);
  console.log('enter t0:', JSON.stringify(await page.evaluate(() => ({
    cls: document.documentElement.className,
    panel: getComputedStyle(document.getElementById('pt-panel')).transform,
    bodyT: getComputedStyle(document.body).transform,
    bodyOp: getComputedStyle(document.body).opacity
  }))));

  // 0.2s 后：面板已明显升出，内容刚开始动
  await page.waitForTimeout(260);
  console.log('enter t+0.26s:', JSON.stringify(await page.evaluate(() => ({
    panel: getComputedStyle(document.getElementById('pt-panel')).transform,
    bodyT: getComputedStyle(document.body).transform,
    bodyOp: getComputedStyle(document.body).opacity
  }))));

  await page.waitForTimeout(900);
  console.log('settled:', JSON.stringify(await page.evaluate(() => ({
    html: document.documentElement.className,
    bodyOp: getComputedStyle(document.body).opacity,
    bodyT: document.body.style.transform
  }))));

  // 返回方向（真实点击链：先回 index，再点向 market，此时 referrer=index；再点 index → back）
  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    document.querySelector('a[href^="market.html"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  });
  await page.waitForURL(/market\.html/, { timeout: 3000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    document.querySelector('a[href="index.html"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  });
  await page.waitForTimeout(250);
  console.log('back leave:', JSON.stringify(await page.evaluate(() => ({
    cls: document.documentElement.className,
    panel: getComputedStyle(document.getElementById('pt-panel')).transform
  })).catch(() => 'nav')));
  await page.waitForURL(/index\.html/, { timeout: 3000 });
  await page.waitForTimeout(900);
  console.log('back settled html:', await page.evaluate(() => document.documentElement.className));

  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
