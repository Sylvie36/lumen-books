-- =============================================================================
-- LUMEN BOOKS · Supabase schema —— Phase 1（只读引用表：categories + books）
-- -----------------------------------------------------------------------------
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴本文件全文 → Run
-- 本阶段边界：仅 categories / books 两张「公开引用表」（只读）。
--   profiles / listings / orders / 任何用户数据表 不在本文件内（后续阶段分批创建）。
--
-- 安全要点（依据 Supabase 官方 RLS 文档审查结论）：
--   1) public 下新建表默认对 anon / authenticated 授予全部权限，
--      “加 RLS 策略不会收回授权”，因此必须显式 revoke all 后只 grant select；
--   2) 两表均启用 RLS，并建立 using(true) 的公开只读策略；
--   3) service_role 密钥仅用于 seed / Dashboard，不出现在任何前端、静态资源或 Git。
--
-- 幂等：表 / 策略 / 触发器均用 if exists / create or replace，可重复执行。
-- =============================================================================

-- ---------- 1. 分类表（公开引用表）----------
create table if not exists public.categories (
  id   smallserial primary key,
  name text not null unique,
  sort int  not null default 0
);

-- ---------- 2. 书目表（版次信息，全站唯一数据源）----------
create table if not exists public.books (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,          -- 业务键：沿用现有站点 55 个 id（zhishenshizheng 等）
  title       text        not null,
  author      text,
  publisher   text,
  pub_year    int,
  isbn        text,
  category_id smallint    references public.categories(id),
  list_price  numeric(10,2),
  cover_url   text,
  bg          text,                                  -- 封面色（前端 --book-bg）
  status      text        not null default 'on'
                          check (status in ('on','off','pending')),
  seed_key    text        not null unique,           -- 幂等 upsert 键（= slug）
  source      text,                                  -- 溯源：data/books.json
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- 3. updated_at 触发器（通用）----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- ---------- 4. 索引 ----------
create index if not exists idx_books_isbn      on public.books (isbn);
create index if not exists idx_books_category  on public.books (category_id);
create index if not exists idx_books_status    on public.books (status);

-- ---------- 5. 行级安全（RLS）----------
-- 强制开启（SQL 建表不会自动开启 RLS）
alter table public.categories enable row level security;
alter table public.books      enable row level security;

-- 默认权限回收：新表在 public 下默认对 anon/authenticated 授予全部权限，
-- 必须先 revoke all 再按需 grant（加策略不会收回授权）。
revoke all on table public.categories, public.books from anon, authenticated;

-- 公开只读：任何人（含未登录）可读全部行
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
  for select to anon, authenticated using (true);

drop policy if exists books_read on public.books;
create policy books_read on public.books
  for select to anon, authenticated using (true);

-- 仅授予 select（写权限留给 service_role 经 seed 使用，前端 anon 无写权限）
grant select on table public.categories, public.books to anon, authenticated;

-- ---------- 6. 审计（每次改 schema 后执行，须全部为 t）----------
-- select c.relname, c.relrowsecurity
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname = 'public' and c.relkind = 'r' order by 1;

-- ---------- 7. 后续阶段占位（本文件不含，仅说明顺序）----------
-- Phase 2: listings + bookwall_display + public_profiles 视图（半公开）
-- Phase 3: profiles / auth 触发器 / favorites / cart_items / addresses
-- Phase 4: orders / order_items + create_order() RPC
-- Phase 5: sell_requests / reviews / booklists / topics + Realtime
