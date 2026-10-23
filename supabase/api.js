/* ============================================================
   api.js — 数据访问层（Phase 1 · 只读部分）
   ------------------------------------------------------------------
   唯一对外出口：页面只与本对象交互，绝不直接碰 Supabase client。
   设计：云模式（window.SB 就绪）走 Supabase；未配置 / 离线（window.SB=null）
         时所有方法返回 Promise.resolve(null)，由调用方显示「未连接」，
         绝不以本地目录数据伪装云端结果（遵守「写可降级、读不伪装」纪律）。
   返回：supabase-js 的 { data, error } 形态（bySlug 用 maybeSingle 返回单行或 null）。
   ============================================================ */
(function () {
  'use strict';

  var DB = {};

  function sb() { return window.SB || null; }

  /* ---------- 分类 ---------- */
  DB.categories = {
    list: function () {
      var c = sb();
      if (!c) return Promise.resolve(null);
      return c.from('categories').select('id,name,sort').order('sort', { ascending: true });
    }
  };

  /* ---------- 书目（只读）---------- */
  DB.books = {
    list: function (opts) {
      opts = opts || {};
      var c = sb();
      if (!c) return Promise.resolve(null);
      var q = c.from('books').select(
        'id,slug,title,author,publisher,pub_year,isbn,list_price,cover_url,bg,category_id,status,source,created_at,updated_at'
      );
      if (opts.categoryId != null) q = q.eq('category_id', opts.categoryId);
      if (opts.status) q = q.eq('status', opts.status);
      if (opts.limit != null) q = q.limit(opts.limit);
      if (opts.offset != null && opts.limit != null) q = q.range(opts.offset, opts.offset + opts.limit - 1);
      return q;
    },
    bySlug: function (slug) {
      var c = sb();
      if (!c) return Promise.resolve(null);
      return c.from('books').select('*').eq('slug', slug).maybeSingle();
    },
    byCategory: function (categoryId) {
      return this.list({ categoryId: categoryId });
    },
    search: function (q) {
      var c = sb();
      if (!c) return Promise.resolve(null);
      return c.from('books').select('id,slug,title,author,cover_url,bg,status')
        .ilike('title', '%' + (q || '') + '%');
    }
  };

  window.DB = DB;
})();
