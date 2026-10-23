const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:8000/lists.html');
  await page.waitForTimeout(2600);   // 自动翻书 + 20 签错峰入场(19*0.08+0.4≈1.9s)

  const res = await page.evaluate(() => {
    const tags = Array.from(document.querySelectorAll('.tag-float-item'));
    const rects = tags.map(t => t.getBoundingClientRect());
    let overlaps = 0;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        // 呼吸动画 ±3px 容差
        if (a.left < b.right - 4 && a.right > b.left + 4 && a.top < b.bottom - 4 && a.bottom > b.top + 4) overlaps++;
      }
    }
    return {
      total: tags.length,
      listTags: tags.filter(t => !t.classList.contains('tag-book')).length,
      bookTags: tags.filter(t => t.classList.contains('tag-book')).length,
      allVisible: tags.every(t => getComputedStyle(t).opacity === '1'),
      allBreathe: tags.every(t => t.classList.contains('breathe-active')),
      overlaps
    };
  });
  console.log(JSON.stringify(res));
  await page.screenshot({ path: 'shot-lists-20.png', clip: { x: 0, y: 300, width: 1440, height: 600 } });

  // 点一个书目签 → 打开所属书单卡片
  await page.locator('.tag-book').first().click({ force: true });
  await page.waitForTimeout(500);
  console.log('book tag → card:', await page.evaluate(() => ({
    hidden: document.getElementById('previewCardPopover').hasAttribute('hidden'),
    title: document.getElementById('cardTitle').textContent
  })).then(r => JSON.stringify(r)));

  // 缩放重排：改窄窗口，检查无重叠
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.waitForTimeout(600);
  const res2 = await page.evaluate(() => {
    const tags = Array.from(document.querySelectorAll('.tag-float-item'));
    const rects = tags.map(t => t.getBoundingClientRect());
    let overlaps = 0;
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (a.left < b.right - 4 && a.right > b.left + 4 && a.top < b.bottom - 4 && a.bottom > b.top + 4) overlaps++;
    }
    return overlaps;
  });
  console.log('overlaps after resize to 1100:', res2);

  // 移动端
  const mp = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  mp.on('pageerror', e => errors.push('mobile: ' + e.message));
  await mp.goto('http://localhost:8000/lists.html');
  await mp.waitForTimeout(600);
  await mp.locator('#book3dContainer').tap();
  await mp.waitForTimeout(2400);
  const mRes = await mp.evaluate(() => ({
    total: document.querySelectorAll('.tag-float-item').length,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1
  }));
  console.log('mobile:', JSON.stringify(mRes));
  await mp.screenshot({ path: 'shot-lists-20-mobile.png' });

  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
