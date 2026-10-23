const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.bw-book').forEach((b, i) => {
      const r = b.getBoundingClientRect();
      const inner = b.querySelector('.bw-inner');
      const cs = getComputedStyle(inner);
      const front = b.querySelector('.bw-front').getBoundingClientRect();
      const spine = b.querySelector('.bw-spine').getBoundingClientRect();
      out.push({
        i, title: b.getAttribute('aria-label').slice(0, 6),
        ry: b.style.getPropertyValue('--ry'),
        bookW: Math.round(r.width), frontW: Math.round(front.width),
        spineW: Math.round(spine.width),
        preserve3d: cs.transformStyle,
        ts: getComputedStyle(b).transformStyle
      });
    });
    return out;
  });
  data.forEach(d => console.log(JSON.stringify(d)));
  await browser.close();
})();
