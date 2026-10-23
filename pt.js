/* ==========================================================================
   PT · Curtain 页面转场（零依赖，参考 interlude.js curtain 效果）
   - 点击站内链接：面板自底部升起盖页 + 内容上漂淡出，遮盖完成后跳转。
   - 新页面载入：面板保持覆盖（预隐藏），随后继续升出顶部，内容延迟 0.2s 漂入。
   - 返回（目标 URL = document.referrer）：全程反向，自上而下。
   所有位姿均由 CSS 类驱动，JS 只负责在合适的帧切换类。
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;                       /* 减少动效：完全禁用 */

  var KEY = 'lumen_pt';
  var LEAVE_MS = 560;                       /* 遮盖耗时（与 pt.css 面板过渡一致） */
  var PANEL_MS = 560;                       /* 面板升起/收起耗时 */
  var ENTER_DELAY = 200;                    /* 新内容晚于面板进入（参考 entrance 0.2） */

  /* 面板优先复用页面静态写好的 #pt-panel（保证首帧即可覆盖，杜绝白屏），
     仅在缺失时兜底动态创建 */
  var panel = document.getElementById('pt-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'pt-panel';
    document.documentElement.appendChild(panel);
  }

  var html = document.documentElement;

  function cleanup() {
    html.classList.remove(
      'pt-anim', 'pt-leave', 'pt-enter', 'pt-enter-prep',
      'pt-leave-back', 'pt-enter-back', 'pt-enter-prep-back'
    );
  }

  /* ---------- 进入：面板升出顶部，内容延迟 0.2s 漂入 ---------- */
  function enter(dir) {
    var back = dir === 'back';
    /* 起点帧：面板覆盖、内容停在偏位透明（此时无过渡） */
    html.classList.remove('pt-pending');
    html.classList.add(back ? 'pt-enter-prep-back' : 'pt-enter-prep');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {    /* 双 rAF：确保起点帧已提交再开过渡 */
        html.classList.add('pt-anim');
        html.classList.add(back ? 'pt-enter-back' : 'pt-enter');
        setTimeout(cleanup, PANEL_MS + ENTER_DELAY + 80);
      });
    });
  }

  /* ---------- 离开：面板自底升起，遮盖完成后跳转 ---------- */
  function leave(url, back) {
    html.classList.add('pt-anim');
    html.classList.add(back ? 'pt-leave-back' : 'pt-leave');
    try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), dir: back ? 'back' : 'fwd' })); } catch (e) {}
    setTimeout(function () { location.href = url; }, LEAVE_MS);
  }

  /* ---------- 启动：转场进入则播放 reveal ---------- */
  var flag = null;
  try { flag = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (flag && Date.now() - flag.t < 30000) {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { enter(flag.dir); });
    } else {
      enter(flag.dir);
    }
  }

  /* bfcache 恢复：清掉残留状态 */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { cleanup(); }
  });

  /* ---------- 拦截站内导航 ---------- */
  function isBackNav(url) {
    try {
      var ref = document.referrer && new URL(document.referrer);
      var cur = new URL(url, location.href);
      if (!ref || ref.origin !== location.origin) return false;
      return ref.pathname === cur.pathname && (ref.search || '') === (cur.search || '');
    } catch (e) { return false; }
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;

    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;

    e.preventDefault();
    leave(url.href, isBackNav(url.href));
  });
})();
