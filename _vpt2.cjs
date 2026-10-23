const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(900);

  // 跳转：在导航提交前记录 body 是否预先隐藏
  await page.evaluate(() => {
    const a = document.querySelector('a[href^="market.html"]');
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  });
  await page.waitForURL(/market\.html/, { timeout: 3000 });

  // 尽快采样（进入动画接管前的预隐藏状态）
  const early = await page.evaluate(() => ({
    pending: document.documentElement.classList.contains('pt-pending'),
    bodyOp: getComputedStyle(document.body).opacity
  })).catch(() => 'too-late');
  console.log('early state after nav:', JSON.stringify(early));

  await page.waitForTimeout(120);
  const mid = await page.evaluate(() => ({
    pending: document.documentElement.classList.contains('pt-pending'),
    cls: document.documentElement.className,
    bodyOp: getComputedStyle(document.body).opacity
  }));
  console.log('enter mid:', JSON.stringify(mid));

  await page.waitForTimeout(900);
  console.log('settled:', await page.evaluate(() => ({
    html: document.documentElement.className,
    bodyOp: getComputedStyle(document.body).opacity,
    panel: getComputedStyle(document.getElementById('pt-panel')).transform
  })).then(r => JSON.stringify(r)));

  // 容错：无转场标记时页面正常显示
  await page.goto('http://localhost:8000/index.html?direct=1');
  await page.waitForTimeout(400);
  console.log('direct visit visible:', await page.evaluate(() =>
    getComputedStyle(document.body).opacity === '1' && !document.documentElement.classList.contains('pt-pending')));

  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
