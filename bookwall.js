/* ==========================================================================
   BOOKWALL · 首页 3D 书墙
   数据 → 渲染真实 3D 书籍（封面/书脊/纸页/书背/顶面）→ 悬停突出 + 分类筛选
   点击书籍跳转在售页（复用 market.html 的 ?q= 搜索，不新造逻辑）。
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- 书籍数据（15 本，参数独立控制排列） ----------------
     w/h 展示尺寸(px)  t 厚度  ry 默认旋转角  ty 纵向错落  z 前后深度 */
  var BOOKS = [
    { id: 'biancheng',   title: '边城',             author: '沈从文',         cat: '绝版稀缺', cover: 'assets/books/covers/book-01.jpg', spine: '#2E4638', w: 96,  h: 232, t: 26, ry: -14, ty: 6,  z: 4  },
    { id: 'renleijianshi', title: '人类简史',       author: '尤瓦尔·赫拉利',  cat: '社科人文', cover: 'assets/books/covers/book-02.jpg', spine: '#7A4A28', w: 100, h: 242, t: 30, ry: -17, ty: 0,  z: 10 },
    { id: 'bainiangudu', title: '百年孤独',         author: '马尔克斯',       cat: '文学小说', cover: 'assets/books/covers/book-03.jpg', spine: '#233250', w: 94,  h: 228, t: 22, ry: -13, ty: 9,  z: 2  },
    { id: 'beitaoyan',   title: '被讨厌的勇气',     author: '岸见一郎',       cat: '社科人文', cover: 'assets/books/covers/book-04.jpg', spine: '#D9622B', w: 95,  h: 226, t: 24, ry: -18, ty: 2,  z: 8  },
    { id: 'kaoyanzhengzhi', title: '考研政治真题解析', author: '考研命题组', cat: '考研考证', cover: 'assets/books/covers/book-05.jpg', spine: '#22304E', w: 97,  h: 238, t: 34, ry: -12, ty: 5,  z: 3  },
    { id: 'xiangtu',     title: '乡土中国',         author: '费孝通',         cat: '社科人文', cover: 'assets/books/covers/book-06.jpg', spine: '#1E3A2C', w: 93,  h: 224, t: 24, ry: -16, ty: 0,  z: 12 },
    { id: 'waerdeng',    title: '瓦尔登湖',         author: '亨利·梭罗',      cat: '文学小说', cover: 'assets/books/covers/book-07.jpg', spine: '#C95A24', w: 94,  h: 222, t: 22, ry: -14, ty: 8,  z: 5  },
    { id: 'hongloumeng', title: '红楼梦',           author: '曹雪芹',         cat: '文学小说', cover: 'assets/books/covers/book-08.jpg', spine: '#7E2D39', w: 98,  h: 240, t: 28, ry: -18, ty: 1,  z: 9  },
    { id: 'gaodengshuxue2', title: '高等数学·下册', author: '同济大学数学系', cat: '教材教辅', cover: 'assets/books/covers/book-09.jpg', spine: '#EFE9DC', w: 96,  h: 230, t: 26, ry: -13, ty: 5,  z: 6, light: 1 },
    { id: 'sant',        title: '三体',             author: '刘慈欣',         cat: '文学小说', cover: 'assets/books/covers/book-10.jpg', spine: '#1E1E20', w: 94,  h: 226, t: 22, ry: -15, ty: 0,  z: 11 },
    { id: 'liujizhenti', title: '英语六级真题详解', author: '新东方研发中心', cat: '考研考证', cover: 'assets/books/covers/book-11.jpg', spine: '#1E5A8A', w: 96,  h: 234, t: 30, ry: -17, ty: 6,  z: 3  },
    { id: 'xinlishenghuo', title: '心理学与生活',   author: '格里格·津巴多',  cat: '教材教辅', cover: 'assets/books/covers/book-12.jpg', spine: '#6E4E96', w: 95,  h: 228, t: 26, ry: -14, ty: 2,  z: 7  },
    { id: 'jieyou',      title: '解忧杂货店',       author: '东野圭吾',       cat: '文学小说', cover: 'assets/books/covers/book-13.jpg', spine: '#8A6A50', w: 94,  h: 224, t: 22, ry: -18, ty: 8,  z: 4  },
    { id: 'weicheng',    title: '围城',             author: '钱锺书',         cat: '文学小说', cover: 'assets/books/covers/book-14.jpg', spine: '#CC8A2D', w: 95,  h: 230, t: 24, ry: -13, ty: 1,  z: 10 },
    { id: 'tangshi',     title: '唐诗鉴赏辞典',     author: '上海辞书出版社', cat: '绝版稀缺', cover: 'assets/books/covers/book-15.jpg', spine: '#1E4247', w: 97,  h: 236, t: 32, ry: -16, ty: 5,  z: 6  }
  ];

  var shelf = document.getElementById('bwShelf');
  var filtersBox = document.getElementById('bwFilters');
  if (!shelf || !filtersBox) return;
  var track = null;                       // .bw-track 跑马灯轨道（render 中创建）

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 渲染书墙 ---------------- */
  function render() {
    var html = '';
    BOOKS.forEach(function (b, i) {
      html +=
        '<a class="bw-book enter" data-copy="0" href="market.html?q=' + encodeURIComponent(b.title) + '"' +
        ' data-cat="' + b.cat + '"' +
        (b.light ? ' data-light="1"' : '') +
        ' style="--w:' + b.w + 'px; --h:' + b.h + 'px; --t:' + b.t + 'px;' +
        ' --ry:' + b.ry + 'deg; --ty:' + b.ty + 'px; --z:' + b.z + 'px;' +
        ' --spine:' + b.spine + '; --dly:' + (i * 55) + 'ms"' +
        ' aria-label="' + b.title + ' · ' + b.author + '（' + b.cat + '）">' +
        '<span class="bw-tip"><b>' + b.title + '</b><i>' + b.author + '</i></span>' +
        '<span class="bw-inner">' +
          '<span class="bw-face bw-front"><img src="' + b.cover + '" alt="' + b.title + '" draggable="false"></span>' +
          '<span class="bw-face bw-spine">' +
            '<span class="bw-spine-title">' + b.title + '</span>' +
            '<span class="bw-spine-author">' + b.author + '</span>' +
          '</span>' +
          '<span class="bw-face bw-pages"></span>' +
          '<span class="bw-face bw-back"></span>' +
          '<span class="bw-face bw-top"></span>' +
        '</span>' +
        '<span class="bw-shadow"></span>' +
        '</a>';
    });
    // 全部书置于一条轨道内：跑马灯只平移这条轨道，逐本书位置不变
    shelf.innerHTML = '<div class="bw-track">' + html + '</div>';
    track = shelf.firstElementChild;
  }

  /* ---------------- 布局：对称浅弧 + 纵深层叠，桌面端无缝跑马灯 ----------------
     弧形：以副本为周期，弧顶在中间（抬高 + 前突 + 略大 + 略亮），两侧平缓
     落回，形成自然弧形而非左右阶梯；纵深由 --arc-z（正向，居中前突）与
     --cs / --bri 共同表达。所有层叠参数按“副本内序号”对称取值（curve 在
     副本边界为 0），循环复位时下一副本与原位置像素级一致 → 无缝、无跳变。
     跑马灯：单条 .bw-track 整体匀速平移（纯 CSS 动画，--loop = 单副本宽、
     --dur = 副本宽 ÷ 速度），不逐帧改书位、不销毁重建；副本克隆自副本 0
     （aria-hidden + tabindex=-1，避免重复读屏/焦点/事件克隆）。
     触屏 / 窄屏 / prefers-reduced-motion / 单副本过窄（筛选后书太少）时
     回退原静态逻辑。不用负 translateZ 做纵深（Chromium z<0 命中丢失）。 */
  var SCALE_640 = 0.66, SCALE_900 = 0.78, SCALE_1080 = 0.88;
  var SPEED = 45;            // 跑马灯速度 px/s（匀速，向左）
  var MIN_COPY_W = 420;      // 单副本低于此宽度（筛选后书太少）退回静态居中
  var MAX_COPIES = 8;        // 副本数上限，防止筛选后小副本克隆过多 DOM
  function currentScale(vw) {
    return vw <= 640 ? SCALE_640 : vw <= 900 ? SCALE_900 : vw <= 1080 ? SCALE_1080 : 1;
  }

  /* 依目标副本数增删克隆体（d=1 时全部移除，回到静态） */
  function syncCopies(d) {
    Array.prototype.forEach.call(shelf.querySelectorAll('.bw-book'), function (el) {
      if (el.getAttribute('data-copy') !== '0') el.parentNode.removeChild(el);
    });
    if (d <= 1) return;
    var src = Array.prototype.slice.call(shelf.querySelectorAll('.bw-book[data-copy="0"]'));
    for (var k = 1; k < d; k++) {
      src.forEach(function (b) {
        var c = b.cloneNode(true);          // 克隆保留 hide 态，筛选状态随副本 0
        c.setAttribute('data-copy', String(k));
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('tabindex', '-1');
        c.classList.remove('enter');        // 克隆体不参与入场动画
        track.appendChild(c);
      });
    }
  }

  function layout() {
    var vw = window.innerWidth;
    var narrow = vw <= 900;
    if (!narrow) shelf.style.minWidth = ''; // 从窄屏切回桌面时先解除滚动宽度

    /* 浅弧参数（按副本内序号对称取值，副本边界 curve=0 保证连续）：
       ARC_LIFT 弧顶抬升 / ARC_Z 弧顶前突(正值，保证 z ≥ 0) /
       ARC_CS 两侧相对弧顶的缩小量 / ARC_BRI 两侧相对弧顶的调暗量。
       桌面弧稍明显、移动端更平缓。 */
    var ARC_LIFT = narrow ? 5 : 10;
    var ARC_Z    = narrow ? 4 : 10;
    var ARC_CS   = narrow ? 0.06 : 0.10;
    var ARC_BRI  = narrow ? 0.07 : 0.12;

    // 单副本（副本 0）的可见书 = 间距与副本宽度基准；筛选在副本 0 上先生效
    var base = Array.prototype.filter.call(
      track.querySelectorAll('.bw-book[data-copy="0"]'),
      function (el) { return !el.classList.contains('hide'); }
    );
    var n0 = base.length;
    var widths = [];
    var sumW = 0;
    base.forEach(function (el) {
      var w = parseFloat(el.style.getPropertyValue('--w')) || 96;
      widths.push(w);
      sumW += w;
    });

    var csEdge = 1 - ARC_CS;                 // 两侧书(curve≈0)的层叠缩放
    var gap;                                 // 每本书宽度的前推进倍数
    if (narrow) {
      gap = 0.72;                            // 窄屏固定交叠，滑动浏览
    } else {
      var avail = Math.max(0, shelf.clientWidth - 16);  // 两侧各留 8px 呼吸位
      /* 精确求解视觉跨度 = avail 的 gap：
         书盒不缩放、内胆 scale 缩放，首书视觉左缘内缩 w0*(1-scale)/2，
         末书视觉右缘 = x_last + wl*(1+scale)/2；首末书均处弧线两端，
         其有效缩放 = 响应式 scale × csEdge。 */
      var scale = currentScale(vw) * csEdge;
      var w0 = widths[0] || 96;
      var wl = widths[n0 - 1] || 96;
      var stepSum = sumW - wl;
      gap = stepSum > 0
        ? (avail - wl * (1 + scale) / 2 + w0 * (1 - scale) / 2) / stepSum
        : 0.72;
      gap = Math.min(1.06, Math.max(0.55, gap));
    }
    // 单副本宽度 = 副本内每本书宽 × gap 之和（即循环位移 --loop 的模长）
    var copyW = 0;
    widths.forEach(function (w) { copyW += w * gap; });
    /* 副本宽需 ≥ 书架宽，2 个副本即可在任意位移下铺满可视窗口：
       间距微调放大到 书架宽+16，副本数稳定在 2，DOM 与合成开销减半。
       仅当需要的放大幅度温和（≤1.3）时调整——筛选后书少时宁可多副本
       或退回静态，避免两三本书被拉满全屏。 */
    if (!narrow && copyW > 0 && copyW < shelf.clientWidth + 16) {
      var need = (shelf.clientWidth + 16) / copyW;
      if (need <= 1.3) {
        gap *= need;
        copyW = 0;
        widths.forEach(function (w) { copyW += w * gap; });
      }
    }

    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var marquee = !narrow && fine && !reduce && n0 > 0 && copyW >= MIN_COPY_W;
    var d = 1;
    if (marquee) {
      // 覆盖条件：(D-1) × 副本宽 ≥ 书架宽 → 任意时刻可视窗口都被内容铺满
      d = Math.min(MAX_COPIES, Math.max(2, Math.ceil(shelf.clientWidth / copyW) + 1));
    }
    syncCopies(d);
    shelf.classList.toggle('marquee', marquee);

    var books = shelf.querySelectorAll('.bw-book:not(.hide)');
    var n = books.length;
    var x = 0;
    books.forEach(function (el, i) {
      var j = n0 > 0 ? i % n0 : 0;            // 副本内序号：层叠参数按副本周期取值
      var t = n0 > 1 ? j / (n0 - 1) : 0;      // 0(最左) → 1(最右)
      var curve = n0 > 1 ? Math.sin(Math.PI * t) : 0;  // 0→1→0：弧顶=1，副本边界=0
      var lift = -ARC_LIFT * curve;           // 中间抬高、两侧回落（对称浅弧）
      var arcZ = ARC_Z * curve;               // 中间前突、两侧回退（仅正向，z ≥ 0）
      var cs = 1 - ARC_CS * (1 - curve);      // 弧顶 1.0，两侧略小
      var bri = 1 - ARC_BRI * (1 - curve);    // 弧顶最亮，两侧略暗
      el.style.setProperty('--x', x.toFixed(1) + 'px');
      el.style.setProperty('--lift', lift.toFixed(1) + 'px');
      el.style.setProperty('--arc-z', arcZ.toFixed(1) + 'px');
      el.style.setProperty('--cs', cs.toFixed(3));
      el.style.setProperty('--bri', bri.toFixed(3));
      el.style.zIndex = 10 + Math.round(curve * 20);   // 弧顶(前)压住两侧(后)
      x += (widths[j] || 96) * gap;           // widths 按副本周期重复
    });

    if (marquee) {
      shelf.style.minWidth = '';
      track.style.setProperty('--loop', (-copyW).toFixed(1) + 'px');
      track.style.setProperty('--dur', (copyW / SPEED).toFixed(2) + 's');
    } else if (narrow) {
      // 书架的内容宽度：让窄屏滚动条知道可滚多远
      shelf.style.minWidth = (x + 120) + 'px';
    } else {
      // 桌面静态：整体居中（gap 由可用宽度反算，通常已恰好铺满，此处兜底超宽屏）
      var total = x;
      var avail2 = shelf.clientWidth;
      if (total < avail2) {
        var offset = (avail2 - total) / 2;
        books.forEach(function (el) {
          var cur = parseFloat(el.style.getPropertyValue('--x')) || 0;
          el.style.setProperty('--x', (cur + offset) + 'px');
        });
      }
    }
  }

  /* ---------------- 分类胶囊（由数据生成） ---------------- */
  var currentCat = '全部藏书';

  function renderFilters() {
    var cats = [];
    var counts = {};
    BOOKS.forEach(function (b) {
      counts[b.cat] = (counts[b.cat] || 0) + 1;
      if (cats.indexOf(b.cat) < 0) cats.push(b.cat);
    });
    var html = '<button type="button" class="bw-filter on" data-cat="全部藏书">全部藏书<span class="bw-count">' + BOOKS.length + '</span></button>';
    cats.forEach(function (c) {
      html += '<button type="button" class="bw-filter" data-cat="' + c + '">' + c + '<span class="bw-count">' + counts[c] + '</span></button>';
    });
    filtersBox.innerHTML = html;
  }

  function applyFilter(cat) {
    currentCat = cat;
    var visible = 0;
    Array.prototype.forEach.call(shelf.querySelectorAll('.bw-book'), function (el) {
      var show = (cat === '全部藏书') || (el.getAttribute('data-cat') === cat);
      el.classList.toggle('hide', !show);
      if (show) visible++;
    });
    // 重新布局前先关闭入场动画，避免重排时跳动
    Array.prototype.forEach.call(shelf.querySelectorAll('.bw-book.enter'), function (el) {
      el.classList.remove('enter');
    });
    layout();
  }

  filtersBox.addEventListener('click', function (e) {
    var btn = e.target.closest('.bw-filter');
    if (!btn) return;
    Array.prototype.forEach.call(filtersBox.querySelectorAll('.bw-filter'), function (b) {
      b.classList.toggle('on', b === btn);
    });
    applyFilter(btn.getAttribute('data-cat'));
  });

  /* ---------------- 移动端：点按选中（再次点按跳转由 <a> 默认行为完成） ---------------- */
  var isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  if (isTouch) {
    shelf.addEventListener('click', function (e) {
      var book = e.target.closest('.bw-book');
      if (!book) return;
      var wasActive = book.classList.contains('active');
      Array.prototype.forEach.call(shelf.querySelectorAll('.bw-book.active'), function (el) {
        el.classList.remove('active');
      });
      if (!wasActive) {
        e.preventDefault();          // 第一次点按：仅选中突出
        book.classList.add('active');
      }
      // 第二次点按：走 <a> 跳转
    });
  }

  /* ---------------- 初始化 ---------------- */
  render();
  renderFilters();
  layout();
  var rsT = null;                          // resize 防抖：避免拖窗过程频繁重建副本
  window.addEventListener('resize', function () {
    if (rsT) clearTimeout(rsT);
    rsT = setTimeout(layout, 120);
  });
  /* 页面隐藏时暂停跑马灯，回前台从原位置继续（play-state 续跑无跳帧） */
  document.addEventListener('visibilitychange', function () {
    shelf.classList.toggle('paused', document.hidden);
  });
  if (reduce) {
    Array.prototype.forEach.call(shelf.querySelectorAll('.bw-book'), function (el) {
      el.classList.remove('enter');
    });
  }

  /* 入场动画结束后移除 .enter：
     animation fill-mode:both 会在结束后继续用 to 帧锁定 transform，
     压制 :hover 的突出变换；及时移除类即可把控制权交还给基础样式。 */
  shelf.addEventListener('animationend', function (e) {
    var el = e.target;
    if (e.animationName === 'bw-rise' && el.classList && el.classList.contains('enter')) {
      el.classList.remove('enter');
    }
  });

  /* ---------------- 桌面端：场景视差 + 指针光源 ----------------
     鼠标在书墙区域移动时：
     1) 整个书架场景随光标做小幅度 rotateX/rotateY（lerp 平滑），
        层叠书列呈整体摆动的纸张体感；
     2) 光源位置（--lx/--ly）跟随光标，驱动封面高光与投影偏移。
     触屏设备与减少动态偏好下完全禁用。 */
  var bwBox = document.querySelector('.bw');
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (bwBox && finePointer && !reduce) {
    var MAX_RX = 4.5;                       // 俯仰最大角度
    var MAX_RY = 6;                         // 偏航最大角度
    var target = { rx: 0, ry: 0, lx: 0.5, ly: 0.32 };
    var cur = { rx: 0, ry: 0, lx: 0.5, ly: 0.32 };
    var raf = null;

    function applyVars() {
      bwBox.style.setProperty('--srx', cur.rx.toFixed(3) + 'deg');
      bwBox.style.setProperty('--sry', cur.ry.toFixed(3) + 'deg');
      bwBox.style.setProperty('--lx', cur.lx.toFixed(4));
      bwBox.style.setProperty('--ly', cur.ly.toFixed(4));
    }

    function tick() {
      var k = 0.085;                        // lerp 系数：越小越沉稳
      var settled = true;
      ['rx', 'ry', 'lx', 'ly'].forEach(function (key) {
        cur[key] += (target[key] - cur[key]) * k;
        if (Math.abs(target[key] - cur[key]) > 0.0008) settled = false;
      });
      applyVars();
      if (settled) { raf = null; return; }  // 收敛后停帧，避免空转
      raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    bwBox.addEventListener('pointermove', function (e) {
      var r = bwBox.getBoundingClientRect();
      var px = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5));
      var py = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5));
      /* 场景逆光标方向偏转（相机环绕约定）：
         这样光标一侧的书会向观察者/光标方向倾斜，
         悬停的书不会被视差推出光标范围，hover 保持稳定。 */
      target.ry = -px * MAX_RY * 2;
      target.rx = py * MAX_RX * 2;
      target.lx = 0.5 + px;                 // 光源跟随光标
      target.ly = 0.32 + py * 0.8;
      kick();
    });
    bwBox.addEventListener('pointerleave', function () {
      target.rx = 0; target.ry = 0; target.lx = 0.5; target.ly = 0.32;
      kick();
    });
    /* 页面隐藏时暂停帧循环 */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      } else {
        kick();
      }
    });
  }
})();
