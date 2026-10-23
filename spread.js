/* ==========================================================================
   spread.js — THE SPREAD · 一页之间
   --------------------------------------------------------------------------
   方案 B 的公共组件层，由本文件把全站变成「一本翻开的独立出版物」：
     1) 跨页刊头注入：运行头（刊名 / 页码 / 期号）、章号、封面左右页码、版权页小字；
     2) 书签绸带：贴在右书口的朱砂绸带 —— 长度 = 你读到哪（你在哪），
        旁边的目录尺标出全站 6 章，点开抽屉是「你收藏了什么」（读 Store 的收藏）。
   依赖：可选依赖 store.js（window.Store）。没有 store.js 的页面（如 login.html）
        也能正常工作，只是收藏区显示空态。
   放置：每个页面 </body> 前、store.js 之后引入即可，样式在 spread.css。
   ========================================================================== */
(function () {
  'use strict';

  if (window.__spreadInit) return;
  window.__spreadInit = true;

  /* ---------------- 一、全站章节表（目录尺与抽屉共用，唯一来源） ---------------- */
  var CHAPTERS = [
    { file: 'index.html',   no: '00', name: '封面',     meta: 'Cover'   },
    { file: 'lists.html',   no: '01', name: '书单',     meta: 'Lists'   },
    { file: 'market.html',  no: '02', name: '淘书',     meta: 'Market'  },
    { file: 'sell.html',    no: '03', name: '卖书',     meta: 'Sell'    },
    { file: 'reviews.html', no: '04', name: '书话',     meta: 'Reviews' },
    { file: 'profile.html', no: '05', name: '我的书桌', meta: 'Desk'    }
  ];

  /* 页面 → 页码 / 页名 / 所属章（子页归到所属章节，保证「你在哪」永远说得清） */
  var PAGES = {
    'index.html':    { no: '00', name: '封面',     chap: '00' },
    'lists.html':    { no: '01', name: '书单',     chap: '01' },
    'market.html':   { no: '02', name: '淘书',     chap: '02' },
    'book.html':     { no: '02', name: '书籍详情', chap: '02' },
    '_li.html':      { no: '02', name: '书籍详情', chap: '02' },
    'sell.html':     { no: '03', name: '卖书',     chap: '03' },
    'reviews.html':  { no: '04', name: '书话',     chap: '04' },
    'login.html':    { no: '05', name: '登录',     chap: '05' },
    'profile.html':  { no: '05', name: '我的书桌', chap: '05' },
    'checkout.html': { no: '06', name: '结算',     chap: '' }
  };

  var TOTAL = CHAPTERS.length;
  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (!file || file.indexOf('.') < 0) file = 'index.html';
  var ME = PAGES[file] || { no: '02', name: '页面', chap: '02' };
  var CUR_CHAP = null;
  CHAPTERS.forEach(function (c) { if (c.no === ME.chap) CUR_CHAP = c; });

  /* ---------------- 二、小工具 ---------------- */
  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function runHTML(mid) {
    return '<b>LUMEN BOOKS</b><span class="spx-run-rule"></span>' + mid +
           '<span class="spx-run-rule"></span><i>一页之间 THE SPREAD</i>';
  }
  var META_TEXT = '第 ' + ME.no + ' 页 · ' + ME.name;

  /* ---------------- 三、跨页刊头 / 页码 / 版权页注入 ---------------- */
  function injectHeads() {
    /* 3.1 页头：运行头 + 章号（对开跨页的两角） */
    each(document.querySelectorAll('.page-head-inner'), function (head) {
      if (!head.querySelector('.spx-run')) {
        head.insertBefore(el('div', 'spx-run', runHTML(META_TEXT)), head.firstChild);
      }
      if (!head.querySelector('.spx-chap')) {
        head.appendChild(el('div', 'spx-chap',
          '<span class="spx-chap-no">' + esc(ME.no) + '</span>' +
          '<span class="spx-chap-name">' + esc(ME.name) + '</span>'));
      }
    });

    /* 3.2 首页封面：跨页运行头 + 左右页码 */
    var cover = document.querySelector('.hero-card');
    if (cover) {
      if (!cover.querySelector('.spx-cover-run')) {
        cover.insertBefore(
          el('div', 'spx-cover-run', runHTML('旧书刊 · 创刊号 · 2026')),
          cover.firstChild);
      }
      if (!cover.querySelector('.spx-folio')) {
        cover.appendChild(el('span', 'spx-folio spx-folio--l', '01 · 封面'));
        cover.appendChild(el('span', 'spx-folio spx-folio--r', '02 · 目录向右 →'));
      }
    }

    /* 3.3 没有刊头的页面（结算 / 我的书桌 / 登录）：补一条细刊头带 */
    if (!document.querySelector('.page-head-inner') && !cover &&
        !document.querySelector('.spx-band')) {
      var band = el('div', 'spx-band', runHTML(META_TEXT));
      var holder = el('div', 'container');
      holder.appendChild(band);
      var header = document.querySelector('.site-header-wrap') || document.querySelector('.site-header');
      if (header && header.parentNode) {
        header.parentNode.insertBefore(holder, header.nextSibling);
      } else {
        var sec = document.querySelector('body > section') || document.querySelector('body > main');
        if (sec && sec.parentNode) sec.parentNode.insertBefore(holder, sec);
        else document.body.insertBefore(holder, document.body.firstChild);
      }
    }

    /* 3.4 页脚：版权页小字（印量 / 页码 / 出版方） */
    each(document.querySelectorAll('.site-footer'), function (foot) {
      if (foot.querySelector('.spx-colophon')) return;
      var colophon = el('div', 'spx-colophon',
        runHTML('旧书刊 · 独立出版 · 第 ' + ME.no + ' 页 / 共 ' + TOTAL + ' 章'));
      var bottom = foot.querySelector('.footer-bottom');
      if (bottom && bottom.parentNode) bottom.parentNode.insertBefore(colophon, bottom);
      else foot.appendChild(colophon);
    });
  }

  /* ---------------- 四、书签绸带 + 抽屉 ---------------- */
  var ribbon, clothText, clothPct, tip, drawer, scrim, favBox, favCount, cartCount,
      fill, progLabel, chapList, closeBtn, lastFocus;

  function buildRibbon() {
    var root = el('div', 'bm-root');
    root.id = 'spreadRibbon';

    /* 4.1 目录尺：全站章节沿书口排布 —— 你在哪 */
    var rail = el('div', 'bm-rail');
    var nav = el('div', 'bm-nav');
    CHAPTERS.forEach(function (c, i) {
      /* 名字在前、刻度在后：因为刻度条是右对齐固定在书口上的，
         这样名字会落在刻度内侧（页面里），刻度贴着书口 */
      var tick = el('a', 'bm-tick',
        '<span class="bm-tick-name">' + esc(c.no + ' · ' + c.name) + '</span><i class="bm-tick-mark"></i>');
      tick.href = c.file;
      tick.style.top = (TOTAL > 1 ? (i / (TOTAL - 1)) * 100 : 0) + '%';
      tick.setAttribute('aria-label', '第 ' + c.no + ' 页 · ' + c.name);
      if (c.no === ME.chap) {
        tick.className += ' active';
        tick.setAttribute('aria-current', 'page');
      }
      nav.appendChild(tick);
    });
    root.appendChild(rail);
    root.appendChild(nav);

    /* 4.2 绸带本体：长度随阅读进度增长 */
    ribbon = el('button', 'bm-ribbon');
    ribbon.type = 'button';
    ribbon.setAttribute('aria-expanded', 'false');
    ribbon.setAttribute('aria-controls', 'bmDrawer');
    ribbon.setAttribute('aria-label', '书签：你在哪 / 你收藏了什么');
    ribbon.innerHTML =
      '<span class="bm-cloth">' +
        '<span class="bm-cloth-text">' + esc((CUR_CHAP || ME).name) + '</span>' +
        '<span class="bm-cloth-pct">0%</span>' +
      '</span>' +
      '<span class="bm-tip"></span>';
    root.appendChild(ribbon);

    clothText = ribbon.querySelector('.bm-cloth-text');
    clothPct  = ribbon.querySelector('.bm-cloth-pct');
    tip       = ribbon.querySelector('.bm-tip');

    /* 4.3 抽屉：目录 + 阅读进度 + 你收藏了什么 */
    scrim = el('div', 'bm-scrim');
    drawer = el('aside', 'bm-drawer');
    drawer.id = 'bmDrawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-labelledby', 'bmDrawerTitle');
    drawer.innerHTML =
      '<div class="bm-head">' +
        '<div>' +
          '<h2 class="bm-head-title" id="bmDrawerTitle">书签</h2>' +
          '<p class="bm-head-sub">The Ribbon · <i>你在哪 / 你收藏了什么</i></p>' +
        '</div>' +
        '<button type="button" class="bm-close" aria-label="收起书签">×</button>' +
      '</div>' +
      '<div class="bm-body">' +
        '<section class="bm-sec">' +
          '<div class="bm-sec-head">你在哪<span id="bmWhere">' + esc(META_TEXT) + '</span></div>' +
          '<div class="bm-chapters"></div>' +
          '<div class="bm-progress">' +
            '<div class="bm-progress-bar"><i class="bm-progress-fill"></i></div>' +
            '<div class="bm-progress-text">' +
              '<b class="bm-progress-label">已读 0%</b>' +
              '<span>绸带垂到哪，你就在哪</span>' +
            '</div>' +
          '</div>' +
        '</section>' +
        '<section class="bm-sec">' +
          '<div class="bm-sec-head">你收藏了什么<span class="bm-fav-count">0 本</span></div>' +
          '<div class="bm-favs"></div>' +
        '</section>' +
      '</div>' +
      '<div class="bm-foot">' +
        '<span>共 ' + TOTAL + ' 章 · 第 ' + esc(ME.no) + ' 页</span>' +
        '<span><a href="checkout.html?cart=1">购物袋 <b class="bm-cart-count">0</b></a> · ' +
        '<a href="profile.html">我的书桌</a></span>' +
      '</div>';

    closeBtn = drawer.querySelector('.bm-close');
    favBox   = drawer.querySelector('.bm-favs');
    favCount = drawer.querySelector('.bm-fav-count');
    cartCount = drawer.querySelector('.bm-cart-count');
    fill     = drawer.querySelector('.bm-progress-fill');
    progLabel = drawer.querySelector('.bm-progress-label');
    chapList = drawer.querySelector('.bm-chapters');

    document.body.appendChild(root);
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);

    /* 4.4 章节清单（抽屉内，当前章点亮） */
    CHAPTERS.forEach(function (c) {
      var item = el('a', 'bm-chap' + (c.no === ME.chap ? ' active' : ''),
        '<span class="bm-chap-no">' + esc(c.no) + '</span>' +
        '<span class="bm-chap-name">' + esc(c.name) + '</span>' +
        '<span class="bm-chap-meta">' + esc(c.meta) + '</span>');
      item.href = c.file;
      if (c.no === ME.chap) item.setAttribute('aria-current', 'page');
      chapList.appendChild(item);
    });
  }

  /* 4.5 收藏 / 购物袋渲染（数据来自 store.js，没有 store.js 时显示空态） */
  function store() { return window.Store || null; }

  function renderFavs() {
    var S = store();
    var ids = (S && S.getFav) ? S.getFav() : [];
    if (favCount) favCount.textContent = ids.length + ' 本';
    if (!favBox) return;

    if (!ids.length) {
      favBox.innerHTML =
        '<p class="bm-empty">还没有夹过书签。<br>' +
        '在淘书页点封面右上角的 ★，就会夹进这条绸带里。<br>' +
        '<a href="market.html">去淘书 →</a></p>';
      return;
    }

    var shown = ids.slice(0, 6);
    var html = '';
    shown.forEach(function (id) {
      var b = S.getBook ? S.getBook(id) : null;
      if (!b) return;
      html +=
        '<a class="bm-fav" href="book.html?id=' + encodeURIComponent(id) + '">' +
          '<i class="bm-fav-cover" data-cover="' + esc(id) + '" style="background-color:' + esc(b.bg || '#111') + '"></i>' +
          '<span>' +
            '<b class="bm-fav-title">' + esc(b.title) + '</b>' +
            '<span class="bm-fav-author">' + esc(b.author || '') + '</span>' +
          '</span>' +
          '<span class="bm-fav-price">¥' + esc(b.price) + '</span>' +
        '</a>';
    });
    if (ids.length > shown.length) {
      html += '<a class="bm-more" href="profile.html">还有 ' + (ids.length - shown.length) + ' 本 · 全部收藏 →</a>';
    } else {
      html += '<a class="bm-more" href="profile.html">全部收藏 →</a>';
    }
    favBox.innerHTML = html;
    if (S && S.applyCovers) S.applyCovers(favBox);
  }

  function renderCart() {
    var S = store();
    var n = (S && S.cartCount) ? S.cartCount() : 0;
    if (cartCount) cartCount.textContent = String(n);
  }

  function renderDrawer() {
    renderFavs();
    renderCart();
  }

  /* 4.6 阅读进度：绸带长度 = 读到哪 */
  var ticking = false;
  function progress() {
    var de = document.documentElement;
    var max = Math.max(1, de.scrollHeight - window.innerHeight);
    var y = window.pageYOffset || de.scrollTop || 0;
    var p = Math.max(0, Math.min(1, y / max));

    var min = 96;
    var span = Math.max(60, window.innerHeight - min - 120);
    ribbon.style.setProperty('--bm-len', Math.round(min + p * span) + 'px');

    var pct = Math.round(p * 100) + '%';
    if (clothPct) clothPct.textContent = pct;
    if (fill) fill.style.width = (p * 100).toFixed(1) + '%';
    if (progLabel) progLabel.textContent = '已读 ' + pct;
    if (tip) {
      tip.innerHTML = '你在哪 · ' + esc((CUR_CHAP || ME).name) + ' <i>' + pct + '</i>';
    }
    if (clothText) clothText.textContent = (CUR_CHAP || ME).name;
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; progress(); });
  }

  /* 4.7 开关抽屉 */
  function openDrawer() {
    lastFocus = document.activeElement;
    renderDrawer();
    drawer.className += ' open';
    scrim.className += ' open';
    ribbon.setAttribute('aria-expanded', 'true');
    if (closeBtn && closeBtn.focus) closeBtn.focus({ preventScroll: true });
  }
  function closeDrawer() {
    drawer.className = drawer.className.replace(/\s*open/, '');
    scrim.className = scrim.className.replace(/\s*open/, '');
    ribbon.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    else if (ribbon.focus) ribbon.focus({ preventScroll: true });
  }
  function isOpen() { return drawer.className.indexOf('open') >= 0; }

  /* 4.8 收藏变动时绸带抖一下，作为「夹进书签」的反馈 */
  function shake() {
    ribbon.className += ' shake';
    setTimeout(function () { ribbon.className = ribbon.className.replace(/\s*shake/, ''); }, 600);
  }

  function bindRibbon() {
    ribbon.addEventListener('click', function () {
      if (isOpen()) closeDrawer(); else openDrawer();
    });
    scrim.addEventListener('click', closeDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) closeDrawer();
    });

    /* 悬停提示（触摸设备不需要） */
    var hoverOK = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (hoverOK && tip) {
      ribbon.addEventListener('mouseenter', function () { tip.className += ' show'; });
      ribbon.addEventListener('mouseleave', function () { tip.className = tip.className.replace(/\s*show/, ''); });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('storage', function () { renderDrawer(); });
    progress();

    /* 首次进入：绸带落下 + 一句自我介绍（每次会话一次） */
    ribbon.className += ' drop';
    if (tip) {
      var seen = false;
      try { seen = sessionStorage.getItem('spx-ribbon-hint') === '1'; } catch (e) {}
      if (!seen) {
        setTimeout(function () {
          tip.className += ' show';
          setTimeout(function () { tip.className = tip.className.replace(/\s*show/, ''); }, 4200);
          try { sessionStorage.setItem('spx-ribbon-hint', '1'); } catch (e) {}
        }, 1400);
      }
    }
  }

  /* ---------------- 五、与 store.js 的收藏 / 购物车联动 ---------------- */
  function bindStore() {
    var S = store();
    if (S && S.on) {
      S.on('fav', function () { renderDrawer(); shake(); });
      S.on('cart', function () { renderDrawer(); });
    }
  }

  /* ---------------- 六、启动 ---------------- */
  function boot() {
    injectHeads();
    buildRibbon();
    bindRibbon();
    bindStore();
    renderDrawer();
    /* 可以直接把书签分享出去：xxx.html#bookmark 打开时自动抽出绸带 */
    if (location.hash === '#bookmark' || location.hash === '#ribbon') {
      setTimeout(openDrawer, 260);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
