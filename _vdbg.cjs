const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8000/lists.html');
  await page.waitForTimeout(2600);
  const pairs = await page.evaluate(() => {
    const tags = Array.from(document.querySelectorAll('.tag-float-item'));
    const rects = tags.map(t => t.getBoundingClientRect());
    const out = [];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (a.left < b.right - 4 && a.right > b.left + 4 && a.top < b.bottom - 4 && a.bottom > b.top + 4) {
        out.push({
          a: tags[i].textContent.trim().slice(0, 14),
          b: tags[j].textContent.trim().slice(0, 14),
          aRect: [a.left | 0, a.top | 0, a.width | 0, a.height | 0],
          bRect: [b.left | 0, b.top | 0, b.width | 0, b.height | 0]
        });
      }
    }
    return out;
  });
  console.log(JSON.stringify(pairs, null, 1));
  await browser.close();
})();
