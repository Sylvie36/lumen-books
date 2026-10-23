# LUMEN BOOKS · Supabase 接入文档（Phase 0）

> 本目录存放数据库接入的基础设施。当前进度：**Phase 0（基础设施）**。
> 铁律：现有 9 个页面与共享 JS/CSS 在 Phase 4 之前零改动；数据库逻辑全部收敛在本目录。

## 1. 阶段路线图

| 阶段 | 内容 | 状态 |
|---|---|---|
| Phase 0 | 基础设施：.gitignore / env 模板 / vendor 离线副本 / client.js / 本文档 | 本次完成 |
| Phase 1 | categories + books 建表、只读 RLS、幂等 seed、db-test.html 验证 | 待确认后执行 |
| Phase 2 | listings 在售数据 + public_profiles 视图 | 未开始 |
| Phase 3 | Supabase Auth + auth-bridge + 收藏/购物车/地址 | 未开始 |
| Phase 4 | orders/order_items + create_order RPC + checkout 接入 | 未开始 |
| Phase 5 | 卖书/书评/书单/书墙数据化 + Realtime（毕业设计扩展） | 未开始 |

## 2. 创建 Supabase 项目

1. 登录 https://supabase.com → New project；
2. **PostgreSQL 版本选 15+**（新项目默认即 15+，确认一眼即可）；
3. 区域选离用户最近的（课程演示任意）；
4. 创建后进入 Project Settings → API，记录三项：
   - Project URL
   - anon / publishable key（前端用）
   - service_role / secret key（**仅服务端**，见下）

## 3. 密钥分级（强制）

| 密钥 | 用途 | 允许出现的位置 |
|---|---|---|
| Project URL | 前端 + seed | `supabase/env.js` / `.env` |
| anon / publishable key | 浏览器前端（安全性靠 RLS） | `supabase/env.js`（已 gitignore） |
| service_role / secret key | seed 脚本、管理操作（**绕过 RLS**） | 仅本地 `.env`（已 gitignore）；**严禁进前端、静态资源、Git 仓库** |

泄露处置：一旦误提交，立即在 Dashboard 轮换该 key。

## 4. 本地配置

1. 复制 `supabase/env.example.js` 为 `supabase/env.js`，填入 URL 与 anon key（env.js 已被 .gitignore，不会提交）；
2. seed 需要 service key：在项目根目录建 `.env`（已 gitignore）：

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

## 5. 目录结构

```
supabase/
├── env.example.js        # 前端配置模板（提交）
├── env.js                # 你的本地配置（gitignore，勿提交）
├── vendor/supabase.js    # supabase-js UMD 离线副本（有意提交）
├── client.js             # 连接器：env → vendor → CDN → 单例 window.SB + DB_MODE
├── README.md             # 本文档
├── schema.sql            # （Phase 1）建表 + RLS
├── seed.mjs              # （Phase 1）幂等种子
└── api.js                # （Phase 1）只读数据访问层
```

### vendor 离线副本信息

- 来源：`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js`
- 版本：**2.118.0**
- sha256：`EE3BE8DE192B97CB1D73D1E95D6B82BB1F6B658C0F97C4EF757FC331996ED3D3`
- 大小：218,252 bytes
- 升级方式：改 URL 版本号重新下载，更新此处版本与 sha256。

## 6. 运行与验证（Phase 1 起）

- 建表：Supabase Dashboard → SQL Editor → 粘贴 `schema.sql` 全文执行；
- 种子：`node supabase/seed.mjs`（读取 `.env` 中的 service key）；
- 验证：`python -m http.server 8000` 后访问 `http://127.0.0.1:8000/db-test.html`；
- 离线说明：`client.js` 按「页面已加载 → vendor 本地副本 → CDN」顺序加载 supabase-js；
  三者皆失败时 `DB_MODE='local'`，站点按现有本地数据运行，无任何报错。

## 7. 回滚

- 代码：`git log` 查看基线/各阶段提交；`git checkout <commit> -- <path>` 或 `git reset --hard <commit>`；
- 数据：定期 `pg_dump` 备份；Supabase 免费项目长期闲置会暂停，重新启用即可。

## 8. 设计决策记录（审查结论，Phase 1+ 实施时遵守）

1. **RLS 与授权必须双保险**：public 下新表默认对 anon/authenticated 授予全部权限，
   「加策略不会收回授权」——每表必须 `revoke all` 后再按需 `grant`；
2. **视图安全**：视图默认 security definer 语义、绕过 RLS，需与表同样谨慎；
   `public_profiles`（Phase 3）有意用 definer 语义，安全边界 = 列清单（仅 6 个安全列）
   + `security_barrier=true` + 显式 `revoke all` / `grant select`；
   未来「我的数据」类视图用 `security_invoker = true`（PG 15+）；
3. **订单**：`create_order()` RPC（PLPGSQL 单事务 + `FOR UPDATE` 行锁）校验
   qty / 重复 listing_id / 上架状态 / 库存；价格与总价以库内值为准；
   订单号用专用序列保证唯一；`orders` / `order_items` 禁止前端直写；
4. **身份**：Supabase Auth JWT 是唯一可信身份；`lumen_session` 仅作 UI 镜像；
   旧明文密码用户不导入；
5. **离线纪律**：读可降级到本地目录（`DB_MODE` 标识可见）；写操作失败必须显式报错，
   严禁伪装成功；
6. **幂等 seed**：只写引用表（books / categories / listings 等），按 `seed_key` upsert，
   永不写入用户数据表；每行带 `source` 溯源列。
