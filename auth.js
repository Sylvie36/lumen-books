/* ============================================================
   auth.js — 全局登录态 + Header 用户区统一
   与 login.html / profile.html 共用同一套 localStorage 键：
     lumen_session = { account, loginAt }
   职责：
   1) 兼容旧用法：所有静态 .btn-login 未登录指向 login.html；
      登录后变为「个人中心」（→ profile.html）。
   2) 新版右上角用户区 .nav-user：由本脚本注入内容
      - 未登录：显示「登入」「注册」按钮
      - 已登录：显示头像 + 用户名 + 下拉菜单（个人中心 / 我的收藏 / 退出登录）
   3) 页面没有 .nav-user 时（首页除外），自动在右上角注入
      浮动用户区 .nav-user--float，保证除首页外都能登入 / 注册。
   ============================================================ */
(function () {
  var SESSION_KEY = 'lumen_session';

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch (e) { return null; }
  }
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    location.href = 'login.html';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 兼容：静态 .btn-login ---------- */
  function bindLoginBtn(el) {
    var s = getSession();
    el.setAttribute('href', 'login.html');
    if (s && s.account) {
      el.textContent = '个人中心';
      el.setAttribute('href', 'profile.html');
      el.classList.add('is-center');
    }
  }

  /* ---------- 新版：右上角 .nav-user 用户区 ---------- */
  var ICON = {
    user: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>',
    exit: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>'
  };

  function renderNavUser(el) {
    var s = getSession();
    if (s && s.account) {
      var account = s.account;
      var initial = esc(account.charAt(0).toUpperCase() || 'U');
      el.innerHTML =
        '<button class="nav-user-btn" type="button" aria-haspopup="true" aria-expanded="false">' +
          '<span class="uavatar">' + initial + '</span>' +
          '<span class="uname">' + esc(account) + '</span>' +
          '<svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' +
        '</button>' +
        '<div class="user-menu">' +
          '<a href="profile.html">' + ICON.user + '个人中心</a>' +
          '<a href="profile.html">' + ICON.heart + '我的收藏</a>' +
          '<div class="divider"></div>' +
          '<button class="logout-link" type="button">' + ICON.exit + '退出登录</button>' +
        '</div>';

      var btn = el.querySelector('.nav-user-btn');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = el.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      el.querySelector('.logout-link').addEventListener('click', function (e) {
        e.stopPropagation();
        logout();
      });
    } else {
      el.innerHTML =
        '<a class="btn-login" href="login.html">登入</a>' +
        '<a class="btn-register" href="login.html?tab=register">注册</a>';
    }
  }

  /* ---------- 右上角浮动用户区：页面无 .nav-user 时自动注入 ---------- */
  function ensureFloatUser() {
    if (document.querySelector('.nav-user')) return;          // 页头内已有用户区，不重复注入
    var page = (location.pathname.split('/').pop() || '').toLowerCase();
    if (page === '' || page === 'index.html') return;         // 首页不显示
    var el = document.createElement('div');
    el.className = 'nav-user nav-user--float';
    document.body.appendChild(el);
  }

  function init() {
    var loginBtn = document.querySelector('.btn-login');
    if (loginBtn) bindLoginBtn(loginBtn);

    ensureFloatUser();

    var users = document.querySelectorAll('.nav-user');
    for (var i = 0; i < users.length; i++) renderNavUser(users[i]);

    document.addEventListener('click', function () {
      var openEls = document.querySelectorAll('.nav-user.open');
      for (var j = 0; j < openEls.length; j++) {
        openEls[j].classList.remove('open');
        var b = openEls[j].querySelector('.nav-user-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
