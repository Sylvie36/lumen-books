/* 阶段 0 数据审计：从 5 个数据源实际抽取书籍数据，输出 data/books.json 草案 + data/related_draft.json
   用法：node data/extract_sources.js（只读项目源码，不修改任何现有数据源） */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function read(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }
function field(block, key) {
  const m = block.match(new RegExp(key + ':\\s*([^,}]+)'));
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null;
}
function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

/* ---------- 1. store.js CATALOG（支持 seller 等嵌套花括号） ---------- */
const storeSrc = read('store.js');
const catalog = {};
{
  const start = storeSrc.indexOf('var CATALOG = {');
  const endMark = storeSrc.indexOf('\n  };', start);
  const body = storeSrc.slice(start, endMark);
  /* 逐条目扫描：遇到 'id': { 后用花括号计数找条目结束 */
  const entryRe = /'([a-z0-9]+)':\s*\{/g;
  let em;
  while ((em = entryRe.exec(body))) {
    const id = em[1];
    let depth = 1, i = em.index + em[0].length;
    while (i < body.length && depth > 0) {
      if (body[i] === '{') depth++;
      else if (body[i] === '}') depth--;
      i++;
    }
    const b = body.slice(em.index + em[0].length, i - 1);
    if (!/title:/.test(b)) continue;
    catalog[id] = {
      title: field(b, 'title'),
      author: field(b, 'author') || null,
      pub: field(b, 'pub') || null,
      publisher: field(b, 'publisher') || null,
      year: field(b, 'year') || null,
      isbn: field(b, 'isbn') || null,
      price: num(field(b, 'price')),
      listPrice: num(field(b, 'listPrice')),
      cat: field(b, 'cat') || null,
      bg: field(b, 'bg') || null,
      cond: field(b, 'cond') || null,
      cover: 'assets/covers/cover-' + id + '.png'
    };
  }
}

/* ---------- 2. bookwall.js BOOKS ---------- */
const bwSrc = read('bookwall.js');
const bookwall = {};
const bwRe = /\{\s*id:\s*'([a-z0-9]+)',\s*title:\s*'([^']+)',\s*author:\s*'([^']+)',\s*cat:\s*'([^']+)',\s*cover:\s*'([^']+)',\s*spine:\s*'(#[0-9A-Fa-f]{6})',\s*w:\s*(\d+),\s*h:\s*(\d+),\s*t:\s*(\d+),\s*ry:\s*(-?\d+),\s*ty:\s*(\d+),\s*z:\s*(\d+)(,\s*light:\s*1)?\s*\}/g;
while ((m = bwRe.exec(bwSrc))) {
  bookwall[m[1]] = {
    title: m[2], author: m[3], cat: m[4], cover: m[5], spine: m[6],
    w: +m[7], h: +m[8], t: +m[9], ry: +m[10], ty: +m[11], z: +m[12], light: !!m[13]
  };
}

/* ---------- 3. market.html 静态卡片 ---------- */
const mktSrc = read('market.html');
const marketIds = [...mktSrc.matchAll(/class="product-card reveal" data-id="([a-z0-9]+)"/g)].map(x => x[1]);
const marketStatic = {};
[...mktSrc.matchAll(/data-id="([a-z0-9]+)">[\s\S]*?<h3>([^<]+)<\/h3>[\s\S]*?<p class="pub">([^<]*)<\/p>[\s\S]*?price-now"><small>¥<\/small>([\d.]+)/g)]
  .forEach(x => { marketStatic[x[1]] = { title: x[2].trim(), pub: x[3].trim(), price: +x[4] }; });

/* ---------- 4. lists.html LISTS + TOPICS ---------- */
const listSrc = read('lists.html');
const lists = {};
const listRe = /^\s{2}(\d+):\s*\{\s*$/gm;
const idxs = [...listSrc.matchAll(listRe)].map(x => ({ id: x[1], at: x.index }));
for (let i = 0; i < idxs.length; i++) {
  const start = idxs[i].at;
  const end = i + 1 < idxs.length ? idxs[i + 1].at : listSrc.length;
  const block = listSrc.slice(start, end);
  const books = [...block.matchAll(/title:\s*'([^']+)',\s*author:\s*'([^']+)'/g)].map(x => ({ title: x[1], author: x[2] }));
  lists[idxs[i].id] = {
    title: field(block, 'title'),
    curator: field(block, 'curator'),
    fav: field(block, 'fav'),
    bookCount: books.length,
    books
  };
}
const topics = [...listSrc.matchAll(/\{\s*id:\s*(\d+),\s*title:\s*'([^']+)',\s*tag:\s*'([^']+)'/g)]
  .map(x => ({ id: +x[1], title: x[2], tag: x[3] }));

/* ---------- 5. reviews.html REVIEWS ---------- */
const revSrc = read('reviews.html');
const reviews = {};
const revRe = /^\s{2}(\d+):\s*\{\s*$/gm;
const ridxs = [...revSrc.matchAll(revRe)].map(x => ({ id: x[1], at: x.index }));
for (let i = 0; i < ridxs.length; i++) {
  const start = ridxs[i].at;
  const end = i + 1 < ridxs.length ? ridxs[i + 1].at : revSrc.length;
  const block = revSrc.slice(start, end);
  reviews[ridxs[i].id] = {
    bookTitle: field(block, 'bookTitle'),
    topics: (field(block, 'topics') || '').replace(/[[\]\s]/g, '').split(',').filter(Boolean).map(Number)
  };
}

/* ---------- 交叉核对 ---------- */
const allIds = new Set([...Object.keys(catalog), ...Object.keys(bookwall), ...marketIds]);
const audit = { coverMissing: [], catalogOnly: [], bookwallOnly: [], mismatch: [] };
const books = [];

allIds.forEach(id => {
  const c = catalog[id] || null;
  const w = bookwall[id] || null;
  const onMarket = marketIds.includes(id);
  const coverPath = c ? c.cover : (w ? w.cover : null);
  const coverExists = coverPath ? fs.existsSync(path.join(ROOT, coverPath)) : false;

  let status, statusReason;
  if (onMarket) { status = 'on'; statusReason = 'market.html 有在售卡片'; }
  else if (c) { status = 'off'; statusReason = 'CATALOG 有记录但无市场卡片（仅书单/书评引用）'; }
  else { status = 'pending'; statusReason = '仅书墙数据，无业务记录，需人工确认'; }

  const b = {
    id,
    title: (c && c.title) || (w && w.title) || null,
    author: (c && c.author) || (w && w.author) || null,
    pub: (c && c.pub) || null,
    publisher: (c && c.publisher) || null,
    year: (c && c.year) || null,
    isbn: (c && c.isbn) || null,
    price: c ? c.price : null,
    listPrice: c ? c.listPrice : null,
    cat: (c && c.cat) || (w && w.cat) || null,
    cover: coverPath,
    bg: (c && c.bg) || null,
    status, statusReason,
    display: w ? { w: w.w, h: w.h, t: w.t, ry: w.ry, ty: w.ty, z: w.z, spine: w.spine, light: w.light } : null
  };
  books.push(b);

  if (!coverExists) audit.coverMissing.push({ id, cover: coverPath });
  if (c && !w && !onMarket) audit.catalogOnly.push(id);
  if (w && !c) audit.bookwallOnly.push(id);
  if (onMarket && c) {
    const ms = marketStatic[id];
    if (ms && (ms.title !== c.title || (c.price !== null && ms.price !== c.price))) {
      audit.mismatch.push({ id, market: ms.title + ' ¥' + ms.price, catalog: c.title + ' ¥' + c.price });
    }
  }
});

/* ---------- 汇总输出 ---------- */
const summary = {
  counts: {
    catalog: Object.keys(catalog).length,
    bookwall: Object.keys(bookwall).length,
    marketCards: marketIds.length,
    lists: Object.keys(lists).length,
    reviews: Object.keys(reviews).length,
    topics: topics.length,
    union: allIds.size,
    on: books.filter(b => b.status === 'on').length,
    off: books.filter(b => b.status === 'off').length,
    pending: books.filter(b => b.status === 'pending').length
  },
  coverMissing: audit.coverMissing,
  bookwallOnly: audit.bookwallOnly,
  catalogOnly: audit.catalogOnly,
  mismatch: audit.mismatch,
  marketIdsNotInCatalog: marketIds.filter(id => !catalog[id]),
  catalogNotOnMarket: Object.keys(catalog).filter(id => !marketIds.includes(id))
};

const draft = {
  _meta: {
    generated: new Date().toISOString(),
    note: '阶段 0 迁移草案。仅从现有代码抽取，未接入前台、未覆盖任何数据源。status: on=市场在售 / off=仅目录记录 / pending=待人工确认',
    sources: summary.counts
  },
  books
};

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'books.json'), JSON.stringify(draft, null, 2));
fs.writeFileSync(path.join(ROOT, 'data', 'related_draft.json'), JSON.stringify({
  summary,
  lists,
  reviews,
  topics
}, null, 2));

console.log(JSON.stringify(summary, null, 1));
