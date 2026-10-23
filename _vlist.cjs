const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => errors.push('page: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('http://localhost:8000/lists.html');
  await page.waitForTimeout(1600);   // 等首次自动翻书 + 纸签入场

  const state = await page.evaluate(() => ({
    opened: document.getElementById('book3dContainer').classList.contains('is-open'),
    tags: document.querySelectorAll('.tag-float-item').length,
    visibleTags: Array.from(document.querySelectorAll('.tag-float-item')).filter(t => getComputedStyle(t).opacity === '1').length
  }));
  console.log('book opened:', state.opened, 'tags:', state.tags, 'visible:', state.visibleTags);
  await page.screenshot({ path: 'shot-lists-open.png', clip: { x: 0, y: 0, width: 1280, height: 860 } });

  // 点击第 2 个纸签 → 卡片
  await page.locator('.tag-float-item').nth(1).click({ force: true });
  await page.waitForTimeout(600);
  const pop = await page.evaluate(() => ({
    hidden: document.getElementById('previewCardPopover').hasAttribute('hidden'),
    title: document.getElementById('cardTitle').textContent,
    total: document.getElementById('statTotal').textContent,
    onSale: document.getElementById('statOnSale').textContent,
    minP: document.getElementById('statMinPrice').textContent,
    fav: document.getElementById('statFavs').textContent,
    books: document.querySelectorAll('.preview-book-item').length,
    href: document.getElementById('viewFullBtn').getAttribute('href')
  }));
  console.log('popover:', JSON.stringify(pop));
  await page.screenshot({ path: 'shot-lists-card.png', clip: { x: 0, y: 0, width: 1280, height: 860 } });

  // Esc 关闭
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  console.log('closed by Esc:', await page.evaluate(() => document.getElementById('previewCardPopover').hasAttribute('hidden')));

  // 查看完整书单 → 详情
  await page.locator('.tag-float-item').nth(0).click({ force: true });
  await page.waitForTimeout(400);
  await Promise.all([
    page.waitForNavigation({ timeout: 5000 }).catch(() => null),
    page.locator('#viewFullBtn').click()
  ]);
  await page.waitForTimeout(800);
  console.log('url after view-full:', page.url());
  const detailVisible = await page.evaluate(() =>
    document.getElementById('viewDetail').style.display !== 'none' &&
    document.querySelectorAll('#bookRows .book-row').length);
  console.log('detail rows:', detailVisible);

  // 移动端
  const mp = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  mp.on('pageerror', e => errors.push('mobile: ' + e.message));
  await mp.goto('http://localhost:8000/lists.html');
  await mp.waitForTimeout(1000);
  await mp.locator('#book3dContainer').tap();
  await mp.waitForTimeout(700);
  const mTags = await mp.evaluate(() => Array.from(document.querySelectorAll('.tag-float-item')).filter(t => getComputedStyle(t).opacity === '1').length);
  console.log('mobile tags visible after tap:', mTags);
  await mp.screenshot({ path: 'shot-lists-mobile.png' });

  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
