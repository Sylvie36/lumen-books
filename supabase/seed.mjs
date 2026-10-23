#!/usr/bin/env node
/* ============================================================
   seed.mjs — LUMEN BOOKS Phase 1 幂等种子（仅引用表：categories / books）
   ------------------------------------------------------------------
   上游：data/books.json（由 data/extract_sources.js 从真实页面生成，是全站
         书目唯一数据源；每本书的 slug / 分类 / 状态均由该文件决定）。
   安全：仅使用 service_role key（从本地 .env 读取，已被 gitignore），
         该密钥绝不进入前端、静态资源或 Git。
   幂等：categories 按 name upsert；books 按 seed_key(=slug) upsert；
         重复运行结果收敛到同一状态，不会产生重复书目。
   运行：
     node supabase/seed.mjs            # 真实写入（需配置 .env）
     node supabase/seed.mjs --dry-run  # 仅校验映射 + 计数，不联网
   ============================================================ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

// ---------- 0. 读取本地 .env（仅本地，gitignored）----------
function loadEnv() {
  const p = resolve(ROOT, '.env');
  try {
    const txt = readFileSync(p, 'utf8');
    const env = {};
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

// ---------- 1. 上游数据 ----------
const raw = JSON.parse(readFileSync(resolve(ROOT, 'data/books.json'), 'utf8'));
const books = raw.books;

// 5 个分类（与现有站点 / store.js CATALOG 口径一致）
const CATS = ['社科人文', '文学小说', '教材教辅', '考研考证', '绝版稀缺'];

function toYear(s) {
  if (!s) return null;
  const m = String(s).match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}
function toPublisher(b) {
  if (b.publisher) return b.publisher;
  if (b.pub) return b.pub.split(' · ')[0];
  return null;
}

// 构建 books 插入行（映射自 data/books.json）
const bookRows = books.map((b) => {
  if (!CATS.includes(b.cat)) throw new Error(`未知分类: "${b.cat}" (slug=${b.id})`);
  const listPrice = (b.listPrice == null ? null : Number(b.listPrice));
  if (listPrice != null && Number.isNaN(listPrice)) throw new Error(`非法定价: ${b.listPrice} (${b.id})`);
  return {
    slug: b.id,
    title: b.title,
    author: b.author || null,
    publisher: toPublisher(b),
    pub_year: toYear(b.year),
    isbn: b.isbn || null,
    category: b.cat,                       // 仅用于映射，入库时转 category_id
    list_price: listPrice,
    cover_url: b.cover || null,
    bg: b.bg || null,
    status: b.status || 'on',
    seed_key: b.id,
    source: 'data/books.json'
  };
});

// ---------- 2. 映射校验报告（dry-run 与真实运行前均打印）----------
const countsByCat = {};
const statusCounts = {};
let badYear = 0;
for (const r of bookRows) {
  countsByCat[r.category] = (countsByCat[r.category] || 0) + 1;
  statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  if (r.pub_year === null) badYear++;
}
console.log(`书目总数     : ${bookRows.length}`);
console.log('分类计数     :', countsByCat);
console.log('状态计数     :', statusCounts);
console.log(`pub_year 为空: ${badYear}（上游无年份信息，入库为 NULL，不影响其他字段）`);

if (DRY) {
  console.log('\n[dry-run] 未联网，映射校验通过。配置 .env 后去掉 --dry-run 即可真实写入。');
  process.exit(0);
}

// ---------- 3. 真实写入（service_role key + REST upsert）----------
const env = loadEnv();
const URL = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('\n缺少 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY。\n请在项目根目录 .env 配置（参考 supabase/README.md 第 4 节），不要写入任何前端文件。');
  process.exit(1);
}

// 用已提交的 vendor UMD 副本在 Node 中加载 supabase-js（零外部依赖）
const vendorCode = readFileSync(resolve(__dirname, 'vendor/supabase.js'), 'utf8');
const sandbox = {
  console,
  fetch: globalThis.fetch, Headers: globalThis.Headers, Request: globalThis.Request,
  Response: globalThis.Response, AbortController: globalThis.AbortController,
  crypto: globalThis.crypto, TextEncoder: globalThis.TextEncoder, Blob: globalThis.Blob,
  setTimeout, clearTimeout, WebSocket: function () {},
  navigator: { userAgent: 'node-seed' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  document: { createElement: () => ({ style: {}, setAttribute: () => {} }), head: { appendChild: () => {} }, documentElement: { setAttribute: () => {} }, addEventListener: () => {}, removeEventListener: () => {}, getElementById: () => null, body: {} }
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(vendorCode, sandbox);
const supabase = sandbox.supabase.createClient(URL, KEY, {
  auth: { persist: false, autoRefreshToken: false }
});

function fail(label, err) {
  console.error(`\n[失败] ${label}:`, err && err.message ? err.message : err);
  process.exit(1);
}

(async () => {
  // 3.1 分类 upsert（按 name 幂等）
  const { data: catRows, error: catErr } = await supabase
    .from('categories').upsert(CATS.map((name, i) => ({ name, sort: i })), { onConflict: 'name' })
    .select('id,name');
  if (catErr) fail('categories upsert', catErr);
  const catMap = Object.fromEntries(catRows.map((c) => [c.name, c.id]));
  console.log(`\n分类已同步   : ${catRows.length} 条 ->`, catMap);

  // 3.2 现有 books（用于区分 inserted / updated）
  const { data: existing } = await supabase.from('books').select('seed_key');
  const existingKeys = new Set((existing || []).map((x) => x.seed_key));

  // 3.3 books upsert（按 seed_key 幂等）
  const payload = bookRows.map((r) => ({
    slug: r.slug, title: r.title, author: r.author, publisher: r.publisher,
    pub_year: r.pub_year, isbn: r.isbn, category_id: catMap[r.category],
    list_price: r.list_price, cover_url: r.cover_url, bg: r.bg, status: r.status,
    seed_key: r.seed_key, source: r.source
  }));
  const { error: bookErr } = await supabase.from('books').upsert(payload, { onConflict: 'seed_key' }).select('seed_key');
  if (bookErr) fail('books upsert', bookErr);

  // 3.4 计数核对
  const { count, error: cntErr } = await supabase.from('books').select('*', { count: 'exact', head: true });
  if (cntErr) fail('books count', cntErr);
  const inserted = bookRows.filter((r) => !existingKeys.has(r.seed_key)).length;
  const updated = bookRows.length - inserted;
  console.log(`书目已同步   : inserted=${inserted} updated=${updated} 库内总数=${count}`);
  console.log(`\n[完成] categories=${catRows.length} books=${count}（重复运行应保持相同总数，不产生重复）`);
})();
