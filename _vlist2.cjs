const { chromium } = require('playwright');
(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:8000/lists.html');
  await page.waitForTimeout(400);
  const early = await page.evaluate(() => document.getElementById('book3dContainer').classList.contains('is-open'));
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => {
    const wrap = document.getElementById('bookInteractiveWrapper').getBoundingClientRect();
    return {
      opened: document.getElementById('book3dContainer').classList.contains('is-open'),
      tags: Array.from(document.querySelectorAll('.tag-float-item')).map(t => {
        const r = t.getBoundingClientRect();
        return {
          op: getComputedStyle(t).opacity,
          breathe: t.classList.contains('breathe-active'),
          x: Math.round(((r.left - wrap.left) / wrap.width) * 100),
          y: Math.round(((r.top - wrap.top) / wrap.height) * 100)
        };
      })
    };
  });
  console.log('opened@400ms:', early, 'opened@1900ms:', state.opened);
  state.tags.forEach((t, i) => console.log(`tag${i}: op=${t.op} breathe=${t.breathe} pos=(${t.x}%,${t.y}%)`));
  await page.screenshot({ path: 'shot-lists-fill.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // 二次进入也应自动打开（无 sessionStorage）
  await page.goto('http://localhost:8000/lists.html');
  await page.waitForTimeout(1200);
  console.log('revisit opened:', await page.evaluate(() => document.getElementById('book3dContainer').classList.contains('is-open')));

  console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
