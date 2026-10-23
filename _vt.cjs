const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();

  /* ---------- reviews.html ---------- */
  const rp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  rp.on('pageerror', e => errors.push('reviews: ' + e.message));
  rp.on('console', m => { if (m.type() === 'error') errors.push('reviews console: ' + m.text()); });
  await rp.goto('http://localhost:8000/reviews.html');
  await rp.waitForTimeout(1000);

  const chipCount = await rp.locator('.topic-chip').count();
  console.log('chips:', chipCount);

  // 点话题 5（治愈精神内耗）→ 应只剩书评 1（被讨厌的勇气）和 4（思考快与慢）
  await rp.locator('.topic-chip[data-topic="5"]').click();
  await rp.waitForTimeout(300);
  const vis5 = await rp.evaluate(() =>
    Array.from(document.querySelectorAll('#reviewGrid .review-card'))
      .filter(c => c.style.display !== 'none').map(c => c.dataset.reviewId));
  console.log('topic 5 visible reviews:', vis5.join(','));

  // 话题 10 → 只有书评 2 和 6
  await rp.locator('.topic-chip[data-topic="10"]').click();
  await rp.waitForTimeout(300);
  const vis10 = await rp.evaluate(() =>
    Array.from(document.querySelectorAll('#reviewGrid .review-card'))
      .filter(c => c.style.display !== 'none').map(c => c.dataset.reviewId));
  console.log('topic 10 visible reviews:', vis10.join(','));

  // 全部恢复
  await rp.locator('.topic-chip[data-topic="all"]').click();
  await rp.waitForTimeout(300);
  console.log('all visible:', await rp.evaluate(() =>
    Array.from(document.querySelectorAll('#reviewGrid .review-card')).filter(c => c.style.display !== 'none').length));
  await rp.screenshot({ path: 'shot-topics-reviews.png', clip: { x: 0, y: 300, width: 1440, height: 500 } });
  await rp.close();

  /* ---------- lists.html ---------- */
  const lp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  lp.on('pageerror', e => errors.push('lists: ' + e.message));
  lp.on('console', m => { if (m.type() === 'error') errors.push('lists console: ' + m.text()); });
  await lp.goto('http://localhost:8000/lists.html');
  await lp.waitForTimeout(2200);
  const lstate = await lp.evaluate(() => {
    const tags = Array.from(document.querySelectorAll('.tag-float-item'));
    const rects = tags.map(t => t.getBoundingClientRect());
    let overlaps = 0;
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (a.left < b.right - 4 && a.right > b.left + 4 && a.top < b.bottom - 4 && a.bottom > b.top + 4) overlaps++;
    }
    return {
      total: tags.length,
      allVisible: tags.every(t => getComputedStyle(t).opacity === '1'),
      allBreathe: tags.every(t => t.classList.contains('breathe-active')),
      overlaps
    };
  });
  console.log('lists tags:', JSON.stringify(lstate));
  await lp.screenshot({ path: 'shot-topics-lists.png', clip: { x: 0, y: 300, width: 1440, height: 600 } });

  // 点话题签 → 卡片 → 查看完整书单
  await lp.locator('.tag-float-item').nth(0).click({ force: true });
  await lp.waitForTimeout(600);
  const card = await lp.evaluate(() => ({
    title: document.getElementById('cardTitle').textContent,
    href: document.getElementById('viewFullBtn').getAttribute('href'),
    booksSectionHidden: document.querySelector('.card-books-preview').style.display === 'none'
  }));
  console.log('topic card:', JSON.stringify(card));
  await lp.close();

  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
