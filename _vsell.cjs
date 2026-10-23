const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:8000/sell.html');
  await page.waitForTimeout(800);

  // 聚焦态截图（浮动标签 + 顶线 35% + 底线 100%）
  await page.locator('#isbnInput').focus();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'shot-sell-focus.png', clip: { x: 0, y: 300, width: 1280, height: 420 } });

  // 输入 ISBN 并回车，验证估价功能仍可用
  await page.fill('#isbnInput', '9787508684031');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  const preview = await page.locator('#bookPreview').innerText().catch(() => '');
  console.log('preview has text:', preview.trim().length > 0);
  await page.screenshot({ path: 'shot-sell-est.png', clip: { x: 0, y: 300, width: 1280, height: 420 } });
  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
