/* ============================================================
   env.example.js — Supabase 前端配置模板（Phase 0）
   用法：复制本文件为 env.js（已被 .gitignore，不会提交），
        填入你自己项目的真实值。

   密钥分级（强制）：
   - SUPABASE_URL       项目 API 地址，公开；
   - SUPABASE_ANON_KEY  匿名/publishable 公钥：设计上前端可见，
                        安全性由 RLS 保证，可放入此文件；
   - service_role/secret 服务端密钥：严禁出现在任何前端文件、
                        静态资源或 Git 仓库，只允许放在本地 .env
                        供 supabase/seed.mjs 使用。
   ============================================================ */
window.SUPABASE_URL = 'https://your-project-ref.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-or-publishable-key';
