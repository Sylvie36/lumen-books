const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  // 1) 直接访问（无转场标记）：静态面板应在 DOM 且位于屏幕外，不影响显示
  await page.goto('http://localhost:8000/index.html?nopt=1');
  await page.waitForTimeout(400);
  const direct = await page.evaluate(() => {
    const p = document.getElementById('pt-panel');
    const r = p.getBoundingClientRect();
    return {
      staticPanelExists: !!p,
      bodyOp: getComputedStyle(document.body).opacity,
      panelTop: r.top        // 屏幕外 > viewport height
    };
  });
  console.log('direct visit:', JSON.stringify(direct));

  // 2) 模拟转场进入：预置 sessionStorage 标记 → 页面首帧应立即被绿色面板覆盖（无白屏）
  await page.evaluate(() => sessionStorage.setItem('lumen_pt', JSON.stringify({ t: Date.now(), dir: 'fwd' })));
  await page.goto('http://localhost:8000/market.html');
  // 在 enter 动画接管前，尽早采样：面板应覆盖全屏、body 透明
  const pendingState = await page.evaluate(() => {
    const p = document.getElementById('pt-panel');
    const r = p.getBoundingClientRect();
    const cs = getComputedStyle(p);
    return {
      panelTop: r.top, panelHeight: r.height,
      bodyOp: getComputedStyle(document.body).opacity,
      transform: cs.transform,
      bgColor: cs.backgroundColor || cs.backgroundImage
    };
  });
  console.log('pending covering state:', JSON.stringify(pendingState));
  await page.screenshot({ path: 'shot-fix-pending.png' });

  // 等进入动画结束
  await page.waitForTimeout(1100);
  console.log('settled:', await page.evaluate(() => ({
    html: document.documentElement.className,
    bodyOp: getComputedStyle(document.body).opacity,
    panel: getComputedStyle(document.getElementById('pt-panel')).transform
  })).then(r => JSON.stringify(r)));

  // 3) 真实点击链：index → market
  await page.goto('http://localhost:8000/index.html?nopt=1');
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    document.querySelector('a[href^="market.html"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  });
  await page.waitForURL(/market\.html/, { timeout: 3000 });
  await page.waitForTimeout(1000);
  console.log('click-nav settled:', page.url());

  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
