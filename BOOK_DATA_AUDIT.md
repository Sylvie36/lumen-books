# LUMEN BOOKS · 书籍数据审计报告（阶段 0）

> 生成时间：2026-10-19 · 性质：**只读审计 + 迁移草案**，未修改任何现有数据源，未接入前台。
> 数据来源：对 `store.js` / `market.html` / `bookwall.js` / `lists.html` / `reviews.html` 的实际解析（非人工估计）。
> 重新生成方式：`node data/extract_sources.js`（会重写 `data/books.json` 与 `data/related_draft.json`）。

---

## 1. 各数据源实际记录数量

| 数据源 | 记录数 | 说明 |
|---|---|---|
| `store.js` → `CATALOG` | **54** | 全站唯一"业务目录"（market/book/checkout/购物车共用） |
| `market.html` 静态商品卡片 | **39** | `<article class="product-card" data-id>`，且卡片内标题/作者/价格是**静态写死的第二份数据** |
| `bookwall.js` → `BOOKS` | **15** | 首页 3D 书墙专用，混入展示参数 |
| `lists.html` → `LISTS` | **6** 个书单（含 65 条书目引用） | 书单自带 title/author/pub/note/price/onSale |
| `lists.html` → `TOPICS` | **9** | 话题浮点（id 1/5/6/9/10/12/13/15/20） |
| `reviews.html` → `REVIEWS` | **6** | 书评，`bookTitle` 以《》包裹的书名字符串 |
| **去重后书籍总数** | **55** | 54（CATALOG）+ 1（仅书墙） |

### 状态判定（未默认全上架）

| 状态 | 数量 | 判定依据 |
|---|---|---|
| `on` 上架在售 | 39 | market.html 存在对应卡片 |
| `off` 未上架 | 15 | CATALOG 有记录但无市场卡片（仅被书单/书评引用） |
| `pending` 待确认 | 1 | 仅存在于 bookwall，无任何业务记录（红楼梦） |

---

## 2. 书籍 ID 映射总表（55 条，原始 ID 未重编号）

"书墙参数"列 = `bookwall.js` 的 display 参数（w/h/t/ry/ty/z/spine/light）；"—" 表示该书不在书墙上。

| id | title | author | price | cat | 状态 | 书墙参数 | 封面来源 |
|---|---|---|---|---|---|---|---|
| zhishenshizheng | 置身事内：中国政府与经济发展 | 兰小欢 | ¥18 | 社科人文 | 上架 | — | covers/ |
| bainiangudu | 百年孤独 | 加西亚·马尔克斯 | ¥12 | 文学小说 | 上架 | 有 | covers/ |
| waerdeng | 瓦尔登湖 | 亨利·戴维·梭罗 | ¥15 | 文学小说 | 上架 | 有 | covers/ |
| beitaoyan | 被讨厌的勇气 | 岸见一郎 · 古贺史健 | ¥22 | 社科人文 | 上架 | 有 | covers/ |
| shehuixue | 社会学的想象力 | C. 赖特·米尔斯 | ¥14 | 社科人文 | 上架 | — | covers/ |
| xiangtu | 乡土中国 | 费孝通 | ¥9 | 社科人文 | 上架 | 有 | covers/ |
| qiangpao | 枪炮、病菌与钢铁 | 贾雷德·戴蒙德 | ¥16 | 社科人文 | 上架 | — | covers/ |
| sikao | 思考，快与慢 | 丹尼尔·卡尼曼 | ¥28 | 社科人文 | 上架 | — | covers/ |
| renleijianshi | 人类简史：从动物到上帝 | 尤瓦尔·赫拉利 | ¥20 | 社科人文 | 上架 | 有 | covers/ |
| gaodengshuxue | 高等数学（第七版） | 同济大学数学系 | ¥25 | 教材教辅 | 未上架 | — | covers/ |
| kaoyanyingyu | 考研英语（一）历年真题 | 考研命题组 | ¥30 | 考研考证 | 未上架 | — | covers/ |
| wannian | 万历十五年 | 黄仁宇 | ¥16 | 社科人文 | 未上架 | — | covers/ |
| yueliang | 月亮与六便士 | 毛姆 | ¥13 | 文学小说 | 未上架 | — | covers/ |
| jurenjianshi | 人类群星闪耀时 | 斯蒂芬·茨威格 | ¥18 | 文学小说 | 未上架 | — | covers/ |
| wuyanzhizhong | 乌合之众 | 古斯塔夫·勒庞 | ¥12 | 社科人文 | 未上架 | — | covers/ |
| aideyishu | 爱的艺术 | 艾里希·弗洛姆 | ¥14 | 社科人文 | 未上架 | — | covers/ |
| feibaoligoutong | 非暴力沟通 | 马歇尔·卢森堡 | ¥15 | 社科人文 | 未上架 | — | covers/ |
| qinmiiguanxi | 亲密关系 | 罗兰·米勒 | ¥32 | 社科人文 | 未上架 | — | covers/ |
| yingxiangli | 影响力 | 罗伯特·西奥迪尼 | ¥20 | 社科人文 | 未上架 | — | covers/ |
| wenxin | 文心 | 夏丏尊 · 叶圣陶 | ¥12 | 社科人文 | 未上架 | — | covers/ |
| xiezuozhehuishi | 写作这回事 | 斯蒂芬·金 | ¥18 | 文学小说 | 未上架 | — | covers/ |
| fengeganjue | 风格感觉 | 史蒂芬·平克 | ¥36 | 文学小说 | 未上架 | — | covers/ |
| jinzita | 金字塔原理 | 芭芭拉·明托 | ¥24 | 社科人文 | 未上架 | — | covers/ |
| xuehuiitwen | 学会提问 | 尼尔·布朗 | ¥20 | 社科人文 | 未上架 | — | covers/ |
| gaodengshuxue2 | 高等数学（第七版）下册 | 同济大学数学系 | ¥20 | 教材教辅 | 上架 | 有 | covers/ |
| xianxingdaishu | 线性代数（第六版） | 同济大学数学系 | ¥13 | 教材教辅 | 上架 | — | covers/ |
| gailvlun | 概率论与数理统计（第四版） | 盛骤 · 谢式千 | ¥11 | 教材教辅 | 上架 | — | covers/ |
| yingyujiaocheng | 新视野大学英语（第三版）读写教程 2 | 郑树棠 | ¥23 | 教材教辅 | 上架 | — | covers/ |
| shujujiegou | 数据结构（C 语言版） | 严蔚敏 · 吴伟民 | ¥17 | 教材教辅 | 上架 | — | covers/ |
| caozuoxitong | 操作系统概念（第九版） | 西尔伯沙茨 | ¥39 | 教材教辅 | 上架 | — | covers/ |
| weiguanjingji | 微观经济学（第八版） | 平狄克 · 鲁宾费尔德 | ¥30 | 教材教辅 | 上架 | — | covers/ |
| xinlishenghuo | 心理学与生活（第 19 版） | 格里格 · 津巴多 | ¥38 | 教材教辅 | 上架 | 有 | covers/ |
| kaoyanzhengzhi | 考研政治历年真题解析 | 考研命题研究组 | ¥21 | 考研考证 | 上架 | 有 | covers/ |
| kaoyanshuxue | 考研数学复习全书 | 李永乐 · 王式安 | ¥29 | 考研考证 | 上架 | — | covers/ |
| liujizhenti | 大学英语六级真题详解 | 新东方考试研究中心 | ¥18 | 考研考证 | 上架 | 有 | covers/ |
| jiaoshizige | 教育知识与能力（中学） | 中公教育研究院 | ¥24 | 考研考证 | 上架 | — | covers/ |
| fashuoliankao | 法律硕士联考考试分析 | 教育部考试中心 | ¥28 | 考研考证 | 上架 | — | covers/ |
| cpakuaiji | 注册会计师教材 · 会计 | 中注协考试委员会 | ¥35 | 考研考证 | 上架 | — | covers/ |
| huozhe | 活着 | 余华 | ¥12 | 文学小说 | 上架 | — | covers/ |
| pingfan | 平凡的世界（全三册） | 路遥 | ¥45 | 文学小说 | 上架 | — | covers/ |
| weicheng | 围城 | 钱锺书 | ¥15 | 文学小说 | 上架 | 有 | covers/ |
| sant | 三体 | 刘慈欣 | ¥10 | 文学小说 | 上架 | 有 | covers/ |
| jieyou | 解忧杂货店 | 东野圭吾 | ¥17 | 文学小说 | 上架 | 有 | covers/ |
| xiaowangzi | 小王子 | 圣埃克苏佩里 | ¥9 | 文学小说 | 上架 | — | covers/ |
| huoluan | 霍乱时期的爱情 | 加西亚·马尔克斯 | ¥21 | 文学小说 | 上架 | — | covers/ |
| bailuyuan | 白鹿原 | 陈忠实 | ¥17 | 文学小说 | 上架 | — | covers/ |
| guofulun | 国富论 | 亚当·斯密 | ¥24 | 社科人文 | 上架 | — | covers/ |
| zhengyilun | 正义论 | 约翰·罗尔斯 | ¥21 | 社科人文 | 上架 | — | covers/ |
| quanqiutongshi | 全球通史（第 7 版） | 斯塔夫里阿诺斯 | ¥36 | 社科人文 | 上架 | — | covers/ |
| meixue | 美学散步 | 宗白华 | ¥16 | 社科人文 | 上架 | — | covers/ |
| weilaijianshi | 未来简史：从智人到神人 | 尤瓦尔·赫拉利 | ¥28 | 社科人文 | 上架 | — | covers/ |
| biancheng | 边城 | 沈从文 | ¥11 | 绝版稀缺 | 上架 | 有 | covers/ |
| chengnan | 城南旧事 | 林海音 | ¥14 | 绝版稀缺 | 上架 | — | covers/ |
| tangshi | 唐诗鉴赏辞典 | 上海辞书出版社 | ¥19 | 绝版稀缺 | 上架 | 有 | covers/ |
| hongloumeng | 红楼梦 | 曹雪芹 | **待确认** | 文学小说 | 待确认 | 有 | books/ |

> 注：表中 title/author 取 CATALOG 值（业务口径）。书墙另有简称/异写，见第 3 节。

---

## 3. 重复、缺失与不一致记录

### 3.1 同一 id 在 bookwall 与 CATALOG 的字段冲突（8 处，需定"官方口径"）

| id | 字段 | bookwall.js | store.js CATALOG |
|---|---|---|---|
| renleijianshi | title | 人类简史 | 人类简史：从动物到上帝 |
| bainiangudu | author | 马尔克斯 | 加西亚·马尔克斯 |
| beitaoyan | author | 岸见一郎 | 岸见一郎 · 古贺史健 |
| kaoyanzhengzhi | title | 考研政治真题解析 | 考研政治历年真题解析 |
| kaoyanzhengzhi | author | 考研命题组 | 考研命题研究组 |
| waerdeng | author | 亨利·梭罗 | 亨利·戴维·梭罗 |
| gaodengshuxue2 | title | 高等数学·下册 | 高等数学（第七版）下册 |
| liujizhenti | title | 英语六级真题详解 | 大学英语六级真题详解 |
| liujizhenti | author | 新东方研发中心 | 新东方考试研究中心 |
| xinlishenghuo | title | 心理学与生活 | 心理学与生活（第 19 版） |
| xinlishenghuo | author | 格里格·津巴多 | 格里格 · 津巴多 |

### 3.2 仅书墙有、目录无（1 条，pending）

- `hongloumeng`（红楼梦）：bookwall 有完整展示参数与封面 `assets/books/covers/book-08.jpg`，但 CATALOG/market/lists/reviews **均无记录** → 无价格、无出版社、无在售状态。**不能凭猜测补全**，需人工确认：是否上架、价格、出版社、ISBN。

### 3.3 仅目录有、市场无（15 条，off）

`gaodengshuxue, kaoyanyingyu, wannian, yueliang, jurenjianshi, wuyanzhizhong, aideyishu, feibaoligoutong, qinmiiguanxi, yingxiangli, wenxin, xiezuozhehuishi, fengeganjue, jinzita, xuehuiitwen`

均被 lists/reviews 的书单/书评引用（lists.html 的 65 条书目引用主要落在这批 + 已上架书）。建议统一建模为 `status:'off'`（下架/暂不上架），而非删除。

### 3.4 结构性重复（第二份数据源）

- **market.html 卡片静态文本**：39 张卡片内写死 `<h3>标题</h3>`、作者、出版社、价格。审计比对结果：**39 张全部与 CATALOG 一致（0 冲突）**，但这是两份需同步维护的数据，后台改价后卡片文本不会自动更新。
- **lists.html LISTS 书目**：每条书单自带 title/author/pub/note/price/onSale，与 CATALOG 重复（lists.html 通过 `storeBookOf()` 在运行时回查 Store 对齐价格/书名）。
- **reviews.html REVIEWS**：`bookTitle` 为书名字符串，无 id 关联，靠字符串匹配。

---

## 4. 需要人工确认的字段（缺失即标记，未编造）

| 字段 | 缺失数 | 缺失范围 |
|---|---|---|
| title / author / cat / cover | 0 | 全齐 |
| price / listPrice / bg | 1 | hongloumeng |
| pub | 3 | gaodengshuxue、kaoyanyingyu、hongloumeng |
| publisher / year / isbn | 51 | 仅 4 本主推书（zhishenshizheng/bainiangudu/waerdeng/beitaoyan）有；其余书（含 39 本在售书）均无 |
| cond（成色）/ seller（卖家） | 50 | 仅 4 本主推书有，其余走 `getBookDetail()` 兜底值 |

> 说明：`pub`（如"中信出版社 · 2014"）与 `publisher`/`year` 是可拆分关系，建模时建议拆成三列，由 pub 回填。

---

## 5. 封面路径检查结果

| 检查项 | 结果 |
|---|---|
| CATALOG 54 本 → `assets/covers/cover-<id>.png` | **54/54 全部存在** ✓ |
| bookwall 15 本 → `assets/books/covers/book-NN.jpg` | **15/15 全部存在** ✓ |
| 封面缺失 | **0** |
| 双封面体系 | covers/ 为 54 张 PNG（业务封面）；books/covers/ 为 15 张 JPG（书墙 3D 封面），编号 book-01..15 与书墙数组顺序对应 |
| `hongloumeng` 封面 | 存在：`assets/books/covers/book-08.jpg`（书墙体系），无 covers/ 业务封面 |

---

## 6. 迁移建议（供阶段 1 建立统一数据模型）

1. **单一数据源**：以 `data/books.json`（本草案）为种子灌入后端数据库；`store.js` 的 CATALOG 退化为"API 不可用时的本地回退"。
2. **官方口径**：title/author 以 CATALOG 为准（3.1 表的 11 处冲突按 CATALOG 值统一）；书墙只消费 `display`，不再自带 title/author。
3. **status 三态**：`on`（39）/ `off`（15）/ `pending`（1，hongloumeng 待人工确认后决定）。
4. **字段拆分**：`pub` → `publisher` + `year`；`isbn`/`cond`/`seller` 允许为空并在后台标"待补充"。
5. **封面统一**：后台存封面 URL；迁移期保留两套目录，`cover` 字段记录实际路径（本草案已保留原始路径）。
6. **关联数据**：lists（6 书单/65 书目）、reviews（6）、topics（9）已抽取至 `data/related_draft.json`，建议后续建成独立表（lists / list_books / reviews / topics），reviews 的 `bookTitle` 改为 book id 外键。
7. **market 卡片动态化**：消除 3.4 的第二份静态数据，改由 API 渲染（保持现有 DOM 结构与筛选逻辑不变）。
8. **本草案不接入前台**：现有页面仍读原数据源；`data/` 目录仅作迁移中间产物。

---

## 7. 本阶段产物

| 文件 | 性质 |
|---|---|
| `BOOK_DATA_AUDIT.md` | 本报告 |
| `data/books.json` | 迁移草案：55 本书全字段（含 display 与 status），**未接入前台** |
| `data/related_draft.json` | 迁移草案：6 书单 / 6 书评 / 9 话题的结构化抽取 |
| `data/extract_sources.js` | 重新生成上述两个 JSON 的脚本（只读现有源码） |
