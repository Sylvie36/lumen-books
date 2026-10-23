/* ============================================================
   client.js — Supabase 连接器（Phase 0 · 仅连接，无业务方法）
   职责：
   1) 读取 env.js 注入的 window.SUPABASE_URL / SUPABASE_ANON_KEY；
   2) supabase-js 加载顺序：页面已加载的 window.supabase
      → 本地 vendor/supabase.js（离线优先）
      → CDN（jsdelivr）兜底；
   3) 创建单例 client 挂载到 window.SB；
   4) 判定并暴露 DB_MODE：
        'cloud' = env 已配置且客户端就绪
        'local' = 未配置或加载失败（站点按现有本地数据运行）
      同时写入 <html data-db-mode>，并派发 'sb-ready' 事件；
   5) 未配置时 window.SB = null，控制台无异常，页面零影响。
   说明：本文件不含任何表查询/写入逻辑；业务方法集中在 api.js。
   ============================================================ */
(function () {
  'use strict';

  var CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('script load failed: ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* env.js 存在、URL/key 非空且未被模板占位时视为已配置 */
  function readConfig() {
    var url = window.SUPABASE_URL || '';
    var key = window.SUPABASE_ANON_KEY || '';
    if (!url || !key) return null;
    if (url.indexOf('your-project-ref') >= 0 || key.indexOf('your-anon-or-publishable-key') >= 0) return null;
    return { url: url, key: key };
  }

  function createClient() {
    var cfg = readConfig();
    if (!cfg) return null;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    return window.supabase.createClient(cfg.url, cfg.key, {
      auth: { persist: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  function ensureLib() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return Promise.resolve();
    }
    return loadScript('supabase/vendor/supabase.js')
      .catch(function () { return loadScript(CDN_URL); })
      .catch(function () { return null; });   /* 离线且 CDN 不可达：保持 local 模式 */
  }

  function boot() {
    return ensureLib().then(function () {
      window.SB = createClient();
      window.DB_MODE = window.SB ? 'cloud' : 'local';
      document.documentElement.setAttribute('data-db-mode', window.DB_MODE);
      window.dispatchEvent(new CustomEvent('sb-ready', { detail: { mode: window.DB_MODE } }));
    });
  }

  /* 供 api.js / 页面等待连接就绪 */
  window.SBReady = boot();
})();
