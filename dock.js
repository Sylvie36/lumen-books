/* 导航栏 macOS 风格放大（dock magnify）—— 共享脚本
   在原导航基础上叠加，不改变导航的结构、配色与布局。 */
(function () {
  const nav = document.querySelector('.site-header .nav');
  if (!nav) return;

  // 尊重"减少动态效果"
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const items = Array.from(nav.querySelectorAll('a'));
  const MAG = 1.3;   // 光标正下方项的最大放大倍数
  const DIST = 140;  // 影响半径(px)
  const EASE = 0.2;  // 弹簧跟随系数（越小越"黏"）

  let mouseX = Infinity;
  const cur = items.map(() => 1);

  nav.addEventListener('mousemove', e => { mouseX = e.clientX; });
  nav.addEventListener('mouseleave', () => { mouseX = Infinity; });

  function frame() {
    items.forEach((el, i) => {
      let target = 1;
      if (mouseX !== Infinity) {
        const r = el.getBoundingClientRect();
        const center = r.left + r.width / 2;
        const d = Math.abs(mouseX - center);
        if (d < DIST) target = 1 + (MAG - 1) * (1 - d / DIST);
      }
      // 向目标值弹簧式逼近
      cur[i] += (target - cur[i]) * EASE;
      if (Math.abs(cur[i] - 1) < 0.001 && target === 1) cur[i] = 1;
      el.style.transform = 'scale(' + cur[i].toFixed(3) + ')';
    });
    requestAnimationFrame(frame);
  }
  frame();
})();
