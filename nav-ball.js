/* ==========================================================================
   NAV BALL · 共享小球导航组件（IIFE）
   --------------------------------------------------------------------------
   自动注入 DOM，自动识别当前页，处理展开 / 收起 / 圆形扩散转场。
   仅在当前文件内新增逻辑；不改动 auth.js / dock.js。
   ========================================================================== */
(function () {
  'use strict';

  return; // 已按需求停用：全站移除左侧圆形导航栏

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = function () { return window.matchMedia('(max-width:768px)').matches; };

  /* 四个小球：顺序即展开角度顺序（右→下 90° 弧） */
  var ITEMS = [
    { label: '书单', target: 'lists.html',  icon: 'list' },
    { label: '淘书', target: 'market.html', icon: 'recycle' },
    { label: '卖书', target: 'sell.html',   icon: 'camera' },
    { label: '书话', target: 'reviews.html',icon: 'speech' }
  ];

  /* 当前页判定（index.html 不在小球中） */
  var curPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var activeTarget = null;
  ITEMS.forEach(function (it) { if (it.target === curPage) activeTarget = it.target; });

  /* 线性图标（16px，描边白色） */
  var ICONS = {
    list:   '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    recycle: '<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 0 1 11.9-5M19 12a7 7 0 0 1-11.9 5"/><path d="M17 3v4h-4M7 21v-4h4"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><rect x="3" y="7.5" width="18" height="12.5" rx="2.5"/><path d="M8.5 7.5l1.8-3h3.4l1.8 3"/><circle cx="12" cy="13.5" r="3.2"/></svg>',
    speech: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9.5L5.5 20v-4H4z"/></svg>'
  };

  /* ---------- 注入 DOM ---------- */
  var root = document.createElement('div');
  root.className = 'nb-root';
  root.innerHTML =
    '<button class="nb-trigger" type="button" aria-label="菜单导航">' +
      '<span class="nb-line"></span>' +
      '<span class="nb-line"></span>' +
      '<span class="nb-line"></span>' +
      '<span class="nb-hint">菜单</span>' +
    '</button>' +
    '<div class="nb-balls">' +
      ITEMS.map(function (it) {
        return '<a class="nb-ball" href="' + it.target + '" data-target="' + it.target + '">' +
                 ICONS[it.icon] +
                 '<span class="nb-ball-label">' + it.label + '</span>' +
               '</a>';
      }).join('') +
    '</div>';
  document.body.appendChild(root);

  var trigger   = root.querySelector('.nb-trigger');
  var hint      = root.querySelector('.nb-hint');
  var ballsWrap = root.querySelector('.nb-balls');
  var balls     = Array.prototype.slice.call(root.querySelectorAll('.nb-ball'));

  /* 标记当前页小球：弱化且不可点击 */
  balls.forEach(function (b) {
    if (b.dataset.target === activeTarget) b.classList.add('active');
  });

  /* ---------- 状态 ---------- */
  var open = false;
  var transitioning = false;
  var clickTimer = null;

  /* 计算每个小球的弧线坐标（相对触发球圆心） */
  function layout() {
    var R = 128;                 // 展开半径
    var span = isMobile() ? 75 : 90;   // 总弧角：桌面 90°，移动 75°
    var step = span / (ITEMS.length - 1);
    balls.forEach(function (b, i) {
      var ang = (i * step) * Math.PI / 180;   // 0° 朝右，90° 朝下
      b.dataset.x = Math.cos(ang) * R;
      b.dataset.y = Math.sin(ang) * R;
    });
  }

  function show() {
    if (open) return;
    open = true;
    root.classList.add('open');
    trigger.classList.add('open');
    layout();
    balls.forEach(function (b, i) {
      var d = reduce ? 0 : i * 60;                       // 60ms 错峰
      var ease = reduce ? 'ease' : 'cubic-bezier(.34,1.56,.64,1)';
      var trans = reduce ? 'none' : 'transform .32s ' + ease + ' ' + d + 'ms, opacity .28s ease ' + d + 'ms';
      b.style.transition = trans;
      b.style.transform = 'translate(' + b.dataset.x + 'px,' + b.dataset.y + 'px) scale(1)';
      b.style.opacity = b.classList.contains('active') ? '.35' : '1';
    });
  }

  function hide() {
    if (!open) return;
    open = false;
    root.classList.remove('open');
    trigger.classList.remove('open');
    var n = balls.length;
    balls.forEach(function (b, i) {
      var d = reduce ? 0 : (n - 1 - i) * 60;             // 反向错峰
      var ease = reduce ? 'ease' : 'cubic-bezier(.34,1.56,.64,1)';
      var trans = reduce ? 'none' : 'transform .32s ' + ease + ' ' + d + 'ms, opacity .22s ease ' + d + 'ms';
      b.style.transition = trans;
      b.style.transform = 'translate(0px,0px) scale(0)';
      b.style.opacity = '0';
    });
  }

  function toggle() { open ? hide() : show(); }

  /* 点击空白处 / 再次点击触发球 → 收起 */
  document.addEventListener('click', function (e) {
    if (transitioning) return;
    if (!open) return;
    if (root.contains(e.target)) return;
    hide();
  });

  /* 单/双击区分：单击展开，双击回首页 */
  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    if (clickTimer) return;                  // 双击的第二次单击，忽略
    clickTimer = setTimeout(function () { clickTimer = null; toggle(); }, 200);
  });
  trigger.addEventListener('dblclick', function (e) {
    e.preventDefault();
    clearTimeout(clickTimer); clickTimer = null;
    if (curPage !== 'index.html') go('index.html');
  });

  /* 小球点击 → 转场 */
  balls.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var target = b.dataset.target;
      if (transitioning) return;
      if (b.classList.contains('active') || target === curPage) { hide(); return; }
      if (reduce) { window.location.href = target; return; }
      diffuse(b, target);
    });
  });

  function go(target) {
    if (transitioning) return;
    if (reduce) { window.location.href = target; return; }
    diffuse(trigger, target);
  }

  /* ---------- 圆形扩散转场 ---------- */
  function diffuse(el, target) {
    transitioning = true;
    var rect = el.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var r  = rect.width / 2;

    var bg = (getComputedStyle(document.documentElement).getPropertyValue('--bg') || '').trim();
    if (!bg) bg = '#f4f2ee';

    var circle = document.createElement('div');
    circle.className = 'nb-transition';
    circle.style.left   = (cx - r) + 'px';
    circle.style.top    = (cy - r) + 'px';
    circle.style.width  = (2 * r) + 'px';
    circle.style.height = (2 * r) + 'px';
    circle.style.background = bg;
    document.body.appendChild(circle);

    void circle.offsetWidth;                 // 强制重排

    var vw = window.innerWidth, vh = window.innerHeight;
    var corners = [[0, 0], [vw, 0], [0, vh], [vw, vh]];
    var maxd = 0;
    corners.forEach(function (c) {
      var d = Math.hypot(c[0] - cx, c[1] - cy);
      if (d > maxd) maxd = d;
    });
    var k = (maxd + r) / r;                  // 放大到覆盖整个视口

    circle.style.visibility = 'visible';
    circle.style.transition = 'transform .6s cubic-bezier(.65,0,.35,1)';
    circle.style.transform = 'scale(' + k + ')';

    /* 页面内容淡出（保留转场圆与导航根） */
    Array.prototype.slice.call(document.body.children).forEach(function (child) {
      if (child === circle || child === root) return;
      child.style.transition = 'opacity .2s ease';
      child.style.opacity = '0';
    });

    try {
      sessionStorage.setItem('nb-transition', '1');
      sessionStorage.setItem('nb-bg', bg);
    } catch (_) {}

    setTimeout(function () { window.location.href = target; }, 600);
  }

  /* ---------- 目标页反向收缩 ---------- */
  try {
    if (!reduce && sessionStorage.getItem('nb-transition')) {
      sessionStorage.removeItem('nb-transition');
      var bg = sessionStorage.getItem('nb-bg') || '#f4f2ee';
      var cover = document.createElement('div');
      var ox = isMobile() ? 23 : 26;
      cover.style.cssText =
        'position:fixed;left:0;top:0;width:100vw;height:100vh;background:' + bg +
        ';z-index:9998;transform-origin:' + ox + 'px ' + ox + 'px;transform:scale(1);';
      document.body.appendChild(cover);
      void cover.offsetWidth;
      cover.style.transition = 'transform .45s cubic-bezier(.65,0,.35,1)';
      cover.style.transform = 'scale(0)';
      setTimeout(function () { if (cover.parentNode) cover.parentNode.removeChild(cover); }, 500);
    }
  } catch (_) {}

  /* ---------- 首次访问：脉冲 + 提示 ---------- */
  try {
    var shown = localStorage.getItem('nb-shown');
    if (!shown && !reduce) {
      hint.classList.add('show');
      var p = 0;
      (function pulse() {
        trigger.classList.add('nb-pulse');
        setTimeout(function () {
          trigger.classList.remove('nb-pulse');
          p++;
          if (p < 2) { setTimeout(pulse, 260); }
          else {
            try { localStorage.setItem('nb-shown', '1'); } catch (_) {}
            hint.classList.remove('show');
          }
        }, 520);
      })();
    }
  } catch (_) {}

  /* Esc 收起 */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) hide();
  });

  /* 旋转 / 缩放视口时收起，避免错位 */
  var rt;
  window.addEventListener('resize', function () {
    if (open) { clearTimeout(rt); rt = setTimeout(hide, 60); }
  });

  /* 暴露 API */
  window.NavBall = { open: show, close: hide, toggle: toggle };
})();
