/* ============================================================
   store.js — 跨页共享的「购物车 / 收藏」数据层 + 浮动圆形购物车
   与 auth.js 共用同一套 localStorage 键空间（独立键）：
     lumen_cart = [{ id, qty }]
     lumen_fav  = [id, ...]
   书目目录 CATALOG 覆盖 market / book 全部在售书，供购物车与收藏跨页共享。
   ============================================================ */
(function () {
  'use strict';

  /* 书目总目录（全站唯一数据源）：
       title / author / pub(出版社·年份) / price(二手价) / listPrice(定价) / bg(封面色) / cat(分类)
     详情页（book.html / checkout.html）用到的 4 本额外带扩展字段：
       publisher / year / isbn / cond / seller —— 供书籍详情与下单页直接读取。 */
  var CATALOG = {
    /* ---------- 详情页核心 4 本（扩展字段齐全） ---------- */
    'zhishenshizheng': {
      title: '置身事内：中国政府与经济发展', author: '兰小欢',
      pub: '上海人民出版社 · 2021', publisher: '上海人民出版社', year: '2021 年 8 月',
      isbn: '9787508684031', price: 18, listPrice: 65, bg: '#111111', cat: '社科人文',
      cond: '九成新 · 无笔记无划线',
      seller: { name: '林清和', avatar: '林', credit: '4.9', place: '上海' }
    },
    'bainiangudu': {
      title: '百年孤独', author: '加西亚·马尔克斯',
      pub: '南海出版公司 · 2017', publisher: '南海出版公司', year: '2017 年 6 月',
      isbn: '9787544270878', price: 12, listPrice: 55, bg: '#A1DB67', cat: '文学小说',
      cond: '八成新 · 少量划线',
      seller: { name: '周砚辞', avatar: '周', credit: '4.7', place: '成都' }
    },
    'waerdeng': {
      title: '瓦尔登湖', author: '亨利·戴维·梭罗',
      pub: '人民文学出版社 · 2018', publisher: '人民文学出版社', year: '2018 年 4 月',
      isbn: '9787020024759', price: 15, listPrice: 32, bg: '#c0c0c0', cat: '文学小说',
      cond: '九五新 · 接近全新',
      seller: { name: '苏昀', avatar: '苏', credit: '5.0', place: '北京' }
    },
    'beitaoyan': {
      title: '被讨厌的勇气', author: '岸见一郎 · 古贺史健',
      pub: '机械工业出版社 · 2020', publisher: '机械工业出版社', year: '2020 年 3 月',
      isbn: '9787111495482', price: 22, listPrice: 39.8, bg: '#111111', cat: '社科人文',
      cond: '全新 · 未拆封',
      seller: { name: '郑一鸣', avatar: '郑', credit: '4.8', place: '广州' }
    },

    /* ---------- 在售二手（market.html）其余 5 本 ---------- */
    'shehuixue':     { title: '社会学的想象力', author: 'C. 赖特·米尔斯', pub: '北京师范大学出版社 · 2017', price: 14, listPrice: 49, bg: '#c0c0c0', cat: '社科人文' },
    'xiangtu':       { title: '乡土中国', author: '费孝通', pub: '北京大学出版社 · 2012', price: 9, listPrice: 28, bg: '#A1DB67', cat: '社科人文' },
    'qiangpao':      { title: '枪炮、病菌与钢铁', author: '贾雷德·戴蒙德', pub: '中信出版社 · 2016', price: 16, listPrice: 68, bg: '#111111', cat: '社科人文' },
    'sikao':         { title: '思考，快与慢', author: '丹尼尔·卡尼曼', pub: '中信出版社 · 2012', price: 28, listPrice: 69, bg: '#c0c0c0', cat: '社科人文' },
    'renleijianshi': { title: '人类简史：从动物到上帝', author: '尤瓦尔·赫拉利', pub: '中信出版社 · 2014', price: 20, listPrice: 68, bg: '#A1DB67', cat: '社科人文' },

    /* ---------- 其他分类在售 ---------- */
    'gaodengshuxue': { title: '高等数学（第七版）', author: '同济大学数学系', price: 25, listPrice: 58, bg: '#111111', cat: '教材教辅' },
    'kaoyanyingyu':  { title: '考研英语（一）历年真题', author: '考研命题组', price: 30, listPrice: 69, bg: '#A1DB67', cat: '考研考证' },

    /* ---------- 书单 / 书评里出现的书 ---------- */
    'wannian':          { title: '万历十五年', author: '黄仁宇', pub: '中华书局 · 2006', price: 16, listPrice: 45, bg: '#A1DB67', cat: '社科人文' },
    'yueliang':         { title: '月亮与六便士', author: '毛姆', pub: '上海译文出版社 · 2018', price: 13, listPrice: 38, bg: '#111111', cat: '文学小说' },
    'jurenjianshi':     { title: '人类群星闪耀时', author: '斯蒂芬·茨威格', pub: '生活·读书·新知三联书店 · 2015', price: 18, listPrice: 42, bg: '#c0c0c0', cat: '文学小说' },
    'wuyanzhizhong':    { title: '乌合之众', author: '古斯塔夫·勒庞', pub: '中央编译出版社 · 2018', price: 12, listPrice: 35, bg: '#111111', cat: '社科人文' },
    'aideyishu':        { title: '爱的艺术', author: '艾里希·弗洛姆', pub: '上海译文出版社 · 2018', price: 14, listPrice: 36, bg: '#A1DB67', cat: '社科人文' },
    'feibaoligoutong':  { title: '非暴力沟通', author: '马歇尔·卢森堡', pub: '华夏出版社 · 2009', price: 15, listPrice: 38, bg: '#c0c0c0', cat: '社科人文' },
    'qinmiiguanxi':     { title: '亲密关系', author: '罗兰·米勒', pub: '人民邮电出版社 · 2015', price: 32, listPrice: 78, bg: '#111111', cat: '社科人文' },
    'yingxiangli':      { title: '影响力', author: '罗伯特·西奥迪尼', pub: '北京联合出版公司 · 2016', price: 20, listPrice: 52, bg: '#A1DB67', cat: '社科人文' },
    'wenxin':           { title: '文心', author: '夏丏尊 · 叶圣陶', pub: '生活·读书·新知三联书店 · 2008', price: 12, listPrice: 30, bg: '#111111', cat: '社科人文' },
    'xiezuozhehuishi':  { title: '写作这回事', author: '斯蒂芬·金', pub: '上海文艺出版社 · 2014', price: 18, listPrice: 45, bg: '#c0c0c0', cat: '文学小说' },
    'fengeganjue':      { title: '风格感觉', author: '史蒂芬·平克', pub: '机械工业出版社 · 2018', price: 36, listPrice: 88, bg: '#A1DB67', cat: '社科人文' },
    'jinzita':          { title: '金字塔原理', author: '芭芭拉·明托', pub: '南海出版公司 · 2013', price: 24, listPrice: 58, bg: '#111111', cat: '社科人文' },
    'xuehuiitwen':      { title: '学会提问', author: '尼尔·布朗', pub: '机械工业出版社 · 2019', price: 20, listPrice: 48, bg: '#c0c0c0', cat: '社科人文' },

    /* ---------- 在售二手（market.html）新增 30 本 ---------- */
    /* 教材教辅 */
    'gaodengshuxue2':  { title: '高等数学（第七版）下册', author: '同济大学数学系', pub: '高等教育出版社 · 2014', price: 20, listPrice: 45, bg: '#111111', cat: '教材教辅' },
    'xianxingdaishu':  { title: '线性代数（第六版）', author: '同济大学数学系', pub: '高等教育出版社 · 2014', price: 13, listPrice: 29, bg: '#A1DB67', cat: '教材教辅' },
    'gailvlun':        { title: '概率论与数理统计（第四版）', author: '盛骤 · 谢式千', pub: '高等教育出版社 · 2008', price: 11, listPrice: 24, bg: '#c0c0c0', cat: '教材教辅' },
    'yingyujiaocheng': { title: '新视野大学英语（第三版）读写教程 2', author: '郑树棠', pub: '外语教学与研究出版社 · 2015', price: 23, listPrice: 52, bg: '#111111', cat: '教材教辅' },
    'shujujiegou':     { title: '数据结构（C 语言版）', author: '严蔚敏 · 吴伟民', pub: '清华大学出版社 · 2007', price: 17, listPrice: 39, bg: '#A1DB67', cat: '教材教辅' },
    'caozuoxitong':    { title: '操作系统概念（第九版）', author: '西尔伯沙茨', pub: '机械工业出版社 · 2018', price: 39, listPrice: 89, bg: '#c0c0c0', cat: '教材教辅' },
    'weiguanjingji':   { title: '微观经济学（第八版）', author: '平狄克 · 鲁宾费尔德', pub: '中国人民大学出版社 · 2015', price: 30, listPrice: 68, bg: '#111111', cat: '教材教辅' },
    'xinlishenghuo':   { title: '心理学与生活（第 19 版）', author: '格里格 · 津巴多', pub: '人民邮电出版社 · 2016', price: 38, listPrice: 88, bg: '#A1DB67', cat: '教材教辅' },
    /* 考研考证 */
    'kaoyanzhengzhi':  { title: '考研政治历年真题解析', author: '考研命题研究组', pub: '高等教育出版社 · 2021', price: 21, listPrice: 48, bg: '#c0c0c0', cat: '考研考证' },
    'kaoyanshuxue':    { title: '考研数学复习全书', author: '李永乐 · 王式安', pub: '国家行政学院出版社 · 2020', price: 29, listPrice: 68, bg: '#111111', cat: '考研考证' },
    'liujizhenti':     { title: '大学英语六级真题详解', author: '新东方考试研究中心', pub: '群言出版社 · 2019', price: 18, listPrice: 42, bg: '#A1DB67', cat: '考研考证' },
    'jiaoshizige':     { title: '教育知识与能力（中学）', author: '中公教育研究院', pub: '世界图书出版公司 · 2021', price: 24, listPrice: 56, bg: '#c0c0c0', cat: '考研考证' },
    'fashuoliankao':   { title: '法律硕士联考考试分析', author: '教育部考试中心', pub: '高等教育出版社 · 2021', price: 28, listPrice: 66, bg: '#111111', cat: '考研考证' },
    'cpakuaiji':       { title: '注册会计师教材 · 会计', author: '中注协考试委员会', pub: '中国财政经济出版社 · 2022', price: 35, listPrice: 82, bg: '#A1DB67', cat: '考研考证' },
    /* 文学小说 */
    'huozhe':          { title: '活着', author: '余华', pub: '作家出版社 · 2012', price: 12, listPrice: 28, bg: '#c0c0c0', cat: '文学小说' },
    'pingfan':         { title: '平凡的世界（全三册）', author: '路遥', pub: '北京十月文艺出版社 · 2017', price: 45, listPrice: 108, bg: '#111111', cat: '文学小说' },
    'weicheng':        { title: '围城', author: '钱锺书', pub: '人民文学出版社 · 2017', price: 15, listPrice: 36, bg: '#A1DB67', cat: '文学小说' },
    'sant':            { title: '三体', author: '刘慈欣', pub: '重庆出版社 · 2008', price: 10, listPrice: 23, bg: '#c0c0c0', cat: '文学小说' },
    'jieyou':          { title: '解忧杂货店', author: '东野圭吾', pub: '南海出版公司 · 2014', price: 17, listPrice: 39, bg: '#111111', cat: '文学小说' },
    'xiaowangzi':      { title: '小王子', author: '圣埃克苏佩里', pub: '人民文学出版社 · 2003', price: 9, listPrice: 22, bg: '#A1DB67', cat: '文学小说' },
    'huoluan':         { title: '霍乱时期的爱情', author: '加西亚·马尔克斯', pub: '南海出版公司 · 2012', price: 21, listPrice: 49, bg: '#c0c0c0', cat: '文学小说' },
    'bailuyuan':       { title: '白鹿原', author: '陈忠实', pub: '人民文学出版社 · 2012', price: 17, listPrice: 39, bg: '#111111', cat: '文学小说' },
    /* 社科人文 */
    'guofulun':        { title: '国富论', author: '亚当·斯密', pub: '商务印书馆 · 2014', price: 24, listPrice: 58, bg: '#A1DB67', cat: '社科人文' },
    'zhengyilun':      { title: '正义论', author: '约翰·罗尔斯', pub: '中国社会科学出版社 · 2009', price: 21, listPrice: 49, bg: '#c0c0c0', cat: '社科人文' },
    'quanqiutongshi':  { title: '全球通史（第 7 版）', author: '斯塔夫里阿诺斯', pub: '北京大学出版社 · 2005', price: 36, listPrice: 88, bg: '#111111', cat: '社科人文' },
    'meixue':          { title: '美学散步', author: '宗白华', pub: '上海人民出版社 · 2015', price: 16, listPrice: 39, bg: '#A1DB67', cat: '社科人文' },
    'weilaijianshi':   { title: '未来简史：从智人到神人', author: '尤瓦尔·赫拉利', pub: '中信出版社 · 2017', price: 28, listPrice: 68, bg: '#c0c0c0', cat: '社科人文' },
    /* 绝版稀缺 */
    'biancheng':       { title: '边城', author: '沈从文', pub: '北岳文艺出版社 · 1995', price: 11, listPrice: 15, bg: '#111111', cat: '绝版稀缺' },
    'chengnan':        { title: '城南旧事', author: '林海音', pub: '浙江文艺出版社 · 1994', price: 14, listPrice: 18, bg: '#A1DB67', cat: '绝版稀缺' },
    'tangshi':         { title: '唐诗鉴赏辞典', author: '上海辞书出版社', pub: '上海辞书出版社 · 1983', price: 19, listPrice: 26, bg: '#c0c0c0', cat: '绝版稀缺' }
  };

  /* 自动补全每本书的封面图路径（占位封面，本地 assets/covers/ 下生成，离线可用） */
  Object.keys(CATALOG).forEach(function (id) {
    if (!CATALOG[id].cover) CATALOG[id].cover = 'assets/covers/cover-' + id + '.png';
  });

  var CART_KEY = 'lumen_cart';
  var FAV_KEY  = 'lumen_fav';

  function read(key, def) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? def : v; }
    catch (e) { return def; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  var subs = { cart: [], fav: [] };

  var Store = {
    catalog: CATALOG,
    getBook: function (id) { return CATALOG[id] || null; },

    /* 详情页 / 下单页专用：把书目补成完整结构。
       CATALOG 里只有 4 本带 publisher/year/isbn/cond/seller，
       其余书用兜底值补齐，保证 book.html / checkout.html 不会报错。 */
    getBookDetail: function (id) {
      var b = CATALOG[id] || CATALOG['zhishenshizheng'];
      return {
        id: id,
        title: b.title,
        author: b.author,
        publisher: b.publisher || b.pub || '出版社待补充',
        year: b.year || '',
        isbn: b.isbn || '—',
        cond: b.cond || '八成新 · 有少量笔记',
        bg: b.bg,
        cover: b.cover,
        price: b.price,
        listPrice: b.listPrice,
        cat: b.cat,
        seller: b.seller || { name: '书友', avatar: '书', credit: '4.8', place: '—' }
      };
    },

    /* ---------------- 购物车 ---------------- */
    getCart: function () { return read(CART_KEY, []); },
    cartCount: function () {
      return this.getCart().reduce(function (s, it) { return s + (it.qty || 1); }, 0);
    },
    cartHas: function (id) { return this.getCart().some(function (it) { return it.id === id; }); },
    addCart: function (id, qty) {
      qty = qty || 1;
      var cart = this.getCart(), hit = null;
      cart.forEach(function (it) { if (it.id === id) hit = it; });
      if (hit) hit.qty = Math.min(9, (hit.qty || 1) + qty);
      else cart.push({ id: id, qty: qty });
      write(CART_KEY, cart);
      this.emit('cart');
      return cart;
    },
    setCartQty: function (id, qty) {
      var cart = this.getCart();
      cart.forEach(function (it) { if (it.id === id) it.qty = Math.max(1, Math.min(9, qty)); });
      write(CART_KEY, cart);
      this.emit('cart');
    },
    removeCart: function (id) {
      write(CART_KEY, this.getCart().filter(function (it) { return it.id !== id; }));
      this.emit('cart');
    },
    clearCart: function () { write(CART_KEY, []); this.emit('cart'); },

    /* ---------------- 收藏 ---------------- */
    getFav: function () { return read(FAV_KEY, []); },
    favCount: function () { return this.getFav().length; },
    hasFav: function (id) { return this.getFav().indexOf(id) >= 0; },
    toggleFav: function (id) {
      var fav = this.getFav(), i = fav.indexOf(id), nowFaved;
      if (i >= 0) { fav.splice(i, 1); nowFaved = false; }
      else { fav.push(id); nowFaved = true; }
      write(FAV_KEY, fav);
      this.emit('fav');
      return nowFaved;
    },
    removeFav: function (id) {
      write(FAV_KEY, this.getFav().filter(function (x) { return x !== id; }));
      this.emit('fav');
    },

    /* ---------------- 事件订阅 ---------------- */
    on: function (ev, fn) { (subs[ev] = subs[ev] || []).push(fn); },
    emit: function (ev) { (subs[ev] || []).forEach(function (fn) { try { fn(); } catch (e) {} }); },

    /* ---------------- 黄色星星飞出特效 ---------------- */
    flyStar: function (x, y) {
      var s = document.createElement('span');
      s.className = 'star-burst';
      s.textContent = '★';
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      document.body.appendChild(s);
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 850);
    },

    /* ---------------- 统一贴封面图 ----------------
       任何带 data-cover="<bookId>" 的元素都会被设置背景图为对应封面。
       动态生成的内容只需在元素上标 data-cover，构建后调用 Store.applyCovers()。 */
    applyCovers: function (root) {
      root = root || document;
      var els = root.querySelectorAll('[data-cover]');
      Array.prototype.forEach.call(els, function (el) {
        var b = CATALOG[el.getAttribute('data-cover')];
        if (b && b.cover) el.style.backgroundImage = "url('" + b.cover + "')";
      });
    }
  };

  window.Store = Store;

  /* 页面静态封面（带 data-cover 的 HTML 元素）在加载后统一贴图 */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { Store.applyCovers(); });
  else Store.applyCovers();

  /* ===================== 浮动圆形购物车 ===================== */
  function injectCart() {
    var page = location.pathname.split('/').pop();
    /* profile / login：个人页不显示购物车
       sell：卖书页自带「回收清单」，其 .cart-item / .cart-empty 等类名
             会覆盖 common.css 的购物车样式，故本页只取 Store 数据不注入 UI
       checkout：下单页本身即结算流程，不重复挂购物车 */
    if (page === 'profile.html' || page === 'login.html' ||
        page === 'sell.html' || page === 'checkout.html') return;

    var fab = document.createElement('button');
    fab.className = 'cart-fab';
    fab.id = 'cartFab';
    fab.setAttribute('aria-label', '购物车');
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
      '<path d="M3 4h2l2.4 12.2a1.6 1.6 0 0 0 1.58 1.3h8.64a1.6 1.6 0 0 0 1.58-1.3L21 8H6.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="9.5" cy="20" r="1.4" fill="currentColor"/>' +
      '<circle cx="17.5" cy="20" r="1.4" fill="currentColor"/></svg>' +
      '<span class="cart-badge" id="cartBadge">0</span>';

    var panel = document.createElement('div');
    panel.className = 'cart-panel';
    panel.id = 'cartPanel';
    panel.innerHTML =
      '<div class="cart-panel-head"><b>购物车</b><button class="cart-close" id="cartClose" aria-label="关闭">×</button></div>' +
      '<div class="cart-items" id="cartItems"></div>' +
      '<div class="cart-foot"><div class="cart-total">合计 <b id="cartTotal">¥0</b></div>' +
      '<a class="btn-primary cart-checkout" href="checkout.html?cart=1">去结算</a></div>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    fab.addEventListener('click', function (e) { e.stopPropagation(); panel.classList.toggle('open'); });
    document.getElementById('cartClose').addEventListener('click', function (e) { e.stopPropagation(); panel.classList.remove('open'); });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== fab) panel.classList.remove('open');
    });

    document.getElementById('cartItems').addEventListener('click', function (e) {
      var row = e.target.closest('.cart-item'); if (!row) return;
      var id = row.dataset.id;
      var cur = (Store.getCart().filter(function (it) { return it.id === id; })[0] || {}).qty || 1;
      if (e.target.closest('[data-act="inc"]')) Store.setCartQty(id, cur + 1);
      else if (e.target.closest('[data-act="dec"]')) Store.setCartQty(id, cur - 1);
      else if (e.target.closest('[data-act="del"]')) Store.removeCart(id);
    });

    Store.on('cart', renderCart);
    renderCart();
  }

  function renderCart() {
    var badge = document.getElementById('cartBadge');
    var box = document.getElementById('cartItems');
    var totalEl = document.getElementById('cartTotal');
    if (!box) return;
    var cart = Store.getCart();
    var count = Store.cartCount();
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }

    if (!cart.length) {
      box.innerHTML = '<p class="cart-empty">购物车还是空的，去 <a href="market.html">在售二手</a> 逛逛吧～</p>';
      if (totalEl) totalEl.textContent = '¥0';
      return;
    }
    var total = 0;
    box.innerHTML = cart.map(function (it) {
      var b = Store.getBook(it.id); if (!b) return '';
      var sub = b.price * it.qty; total += sub;
      return '<div class="cart-item" data-id="' + it.id + '">' +
        '<span class="cart-cover" style="--book-bg:' + b.bg + ';background-image:url(\'' + b.cover + '\')"></span>' +
        '<div class="cart-info"><div class="cart-name">' + b.title + '</div>' +
        '<div class="cart-price">¥' + b.price + '</div></div>' +
        '<div class="qty"><button type="button" data-act="dec" aria-label="减少">−</button><span>' + it.qty + '</span><button type="button" data-act="inc" aria-label="增加">+</button></div>' +
        '<button class="cart-del" type="button" data-act="del" aria-label="删除">×</button>' +
        '</div>';
    }).join('');
    if (totalEl) totalEl.textContent = '¥' + total;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectCart);
  else injectCart();
})();
