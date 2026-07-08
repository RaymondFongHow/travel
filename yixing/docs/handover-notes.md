# Handover Notes

这份文档给下一个 agent。第一版静态网站已经建成并可以本地运行 / 部署；当前的重点转为：讨论并确认真实地点池，然后把占位数据替换掉。

## 当前实现状态（v1 已建成，2026-07）

已按 docs 里的产品模型实现第一版纯静态站（无构建工具、无框架、无依赖）：

- `index.html`（repo 根）：travel.raymondfonghow.com 的极简落地页，相对链接到 `yixing/`。
- `yixing/index.html` / `yixing/styles.css` / `yixing/app.js`：单页拼配工具。
- `yixing/data/places.js`：30 张卡片（含 2 张住宿、自由时间 / Saboteur、交通缓冲、2 张宜兴站到达 / 返程）。2026-07-09 按群里补充分两批加：第一批 11 张候选（仍 `pending`）—— 丁蜀线的黄龙山矿址公园 / 蜀山风景区 / Tide Coffee / 陶喜艺术餐厅，春日线的知春卢仝山房，龙池山一线的龙池山风景区 / 自行车公园 / 观景平台 / 不介·黑松林，夜晚线的唐味与宜兴站（拆成「宜兴站 · 到达」`yixing-station` 与「宜兴站 · 返程」`yixing-station-return` 两张 —— 草稿内卡片 id 全局去重，同一张不能既在到达日又在返程日，高铁往返本就是两次事件，故分两张分别作首尾）；第二批 2 张景点 —— 张公洞（湖㳇镇孟峰山麓溶洞，YX；上线核实过：属湖㳇而非张渚 / 善卷洞）、龙背山森林公园（城区南 / 高铁站北，CENTER）。地点归属均用网络核对过：黄龙山矿址公园=丁蜀（DS）、不介·黑松林在龙池山自行车公园内（LC）、唐味在万达周边城区（CENTER）、卢仝山房归入阳羡湖㳇（YX）；Tide Coffee 未查到确切地址，暂挂丁蜀陶二厂片区（DS，仍 pending）。同批把已确认要去的 宜兴竹海 / 善卷洞 / 陶瓷博物馆 去掉 `pending` 并把开放时间 / 公交线 / 门票等信息写进 summary / cautions（卡片 schema 没有单独的时间 / 票价字段，故走自由文本）。
- `yixing/data/transport-edges.js`：23 条占位直连边，全部 `confidence: "low"`，label 带「估」。
- `yixing/data/blocked-edges.js`：3 条示例禁连关系（含建议中转）。
- `yixing/data/presets.js`：三个示例模板（只是起点，含刻意留白）—— 周五晚到 / 周六早到 / 溶洞与夜景（2026-07-09 按群里 7.25–7.26 草案加：d1 陶博馆→善卷洞→龙背山，d2 竹海→张公洞）。三个模板都以「宜兴站 · 到达」开头（fri 在 arrival 日、sat 在 d1）、以「宜兴站 · 返程」结尾（d3），呼应高铁往返。

已实现的功能：

- 四主题（dingshu / spring / bamboo-water / night）由 `body[data-theme]` + CSS variables 驱动；点选卡片也会切到该卡主题。
- 感官菜单是双重控件（用户反馈后的设计）：点选一种感官同时切换页面主题并把卡片池筛选到该主题；「全部」恢复完整卡片池。筛选只影响卡片池，不影响已放入槽位的卡和路线图。
- 卡片池按主题分组；卡片显示时长、位置、需预约 / 热度 / 待确认小标签；自由时间与缓冲卡视觉更轻。
- 拼配区 11 个槽位（Arrival、Day 1-3 各时段、Stay 1/2、Lunch / Return）；支持放入、移出、移动 / 交换；同一草案内卡片不重复（再次放入等于移动）。
- 交互双轨：点卡片再点槽位（触屏主路径）+ pointer events 拖拽（触屏长按提起，鼠标直接拖）；未使用 HTML5 原生 drag-and-drop。
- 相邻已选地点的交通反馈来自 `transportEdges`（唯一数据源，无区域矩阵）；缺边显示「需单独确认」和断点，命中 `blockedEdges` 时显示原因与建议中转；`locationCode: "CURRENT"` 的卡不触发交通边。
- 顺序路线图为普通 HTML（flex column，连接线高度按分钟映射，64-260px 上下限）；`buildRouteGraph` 纯数据逻辑与 DOM 渲染分离；单段 ≥60 分钟提示「移动偏重」。
- 高热卡片放入下午槽提示热度风险；需预约卡片放入任意槽显示预约提示；住宿卡放入非 Stay 槽给强提示（不硬性阻止）。
- `localStorage` 保存草稿 + 清空按钮；两个 preset 按钮载入默认槽位状态。URL hash 分享暂未做。
- locationCode（DS / YX / CENTER 等）只作为内部数据键，UI 一律通过字典显示中文名（丁蜀 / 阳羡 / 宜兴城区…）。

响应式布局（用户确认的四视图结构，v1.1）：

- 四个视图共享同一页头：简介 / 卡片池 / 行程拼配 / 路线图，由 `body[data-view]` + `VIEWS` 驱动，当前视图随草稿存进 `localStorage`（首访落在简介）。
- 移动端（<1024px）：单视图 + 底部固定 tab 栏（四个按钮，非汉堡菜单）；点选卡片或长按提起拖拽时自动切到行程拼配（拖拽提起时把 pointer capture 转到 body，避免视图切换隐藏拖拽源后事件丢失）；放卡后出现 snackbar，带「撤销」和「继续选卡」（跳回卡片池），4 秒自动消失；槽位再变动（移出 / preset / 清空 / 新选卡）时撤销快照作废。
- 桌面端（≥1024px）：tab 栏与简介视图隐藏（简介内容由页头 tagline 与各区说明覆盖），卡片池 | 行程拼配 | 路线图三栏并排，容器放宽到 1520px；snackbar 桌面不出现，反馈走 toast。
- CSS 注意：视图系统的媒体查询必须放在 styles.css 末尾，同等特异性下靠顺序覆盖组件规则（tab 栏桌面隐藏曾因此出过 bug）。
- 补充（v1.1 收尾）：简介里的四个感官入口可点（`data-theme-go`：切主题 + 筛选卡片池并跳到卡片池）；移动端隐藏页头 tagline（内容由简介视图承担，避免重复）；移动端视图切换有 0.22s 轻淡入（`prefers-reduced-motion` 下关闭）；拖拽提起后指针停在视口上下边缘会自动滚动，够得到画面外的槽位。

v1.2（用户反馈批次，2026-07-07）：

- 命名与文案：标题改为「宜兴之旅」，卡片池 →「菜单」、行程拼配 →「行程」；删掉说教式开场白与页脚的占位声明小字。
- 主题只作用于菜单区：`data-theme` 挂在 `#view-pool` 上，body 始终素色近白，「全部」= 素色；主题 CSS 选择器从 `body[data-theme]` 放宽为 `[data-theme]`，night 主题在菜单区呈深色面板。
- 选卡反馈动画：点选卡片时克隆影子飞向底部悬置区再切到行程视图（`prefers-reduced-motion` 下关闭）。
- 行程支持导出 / 导入本地 JSON（先整体校验再落盘，坏文件不动现有行程）；preset 改称「模板」，移到行程标题下，小字注明只是起点。
- 交通时间两层化：direct edge 优先，缺边退回 `data/region-times.js` 的区域两两穷举粗估（含同区短驳兜底），虚线显示；blocked 对仍显示断点不退回。详见 `docs/static-interaction-model.md` 交通时间数据一节。
- 路线图顶部新增 SVG 区域概览图：7 个区域按近似真实方位布点、短时距对连线（线长 ≈ 时间），当前行程涉及的区域点亮。
- 概览图动线（v1.6+）：当前行程按天画成带方向箭头的彩色路线（arrival 暖灰 / Day 1 陶红 / Day 2 竹青 / Day 3 灯黄，与卡片主题色一致），跨天经由住宿区域衔接；每天一条平行偏移避免重叠路段互相盖住；图下有按天图例（`dayRegionPaths` + `updateRegionRoutes`）。
- 桌面端感官菜单改为换行铺开，修掉右缘截断。

v1.3（用户反馈批次，2026-07-07）：

- 菜单「全部」状态也有面板：比页面底色深一档的同色系（#f1f0ec），与主题态布局一致。
- 格式与方案（v1.6，防止模板冲掉用户编辑）：「格式」只管结构（`state.tripFormat`：fri 含周五到达页 / sat 无，切换到 sat 会先确认再清空到达页）；「方案」是完整行程 —— 内置示例（presets.js，带 `format` 字段）+ 用户通过「保存当前」弹窗取名保存到 localStorage（`yixing-saved-plans-v1`，上限 12 份，可删除）。载入任何方案时若当前草稿非空会先 confirm；移动端载入后 snackbar 可撤销（快照含 tripFormat）。
- 行程是「自动日历」（v1.5 重写，取代先前的槽位网格）：四个日页（到达 19:00 起 / Day 1、2 各 09:00 起 / Day 3 半天），← → 翻天。每天是有序卡片队列（`state.days`），事件按 `durationMin` 自动向后叠放并显示起止时间；相邻真实地点之间自动插入交通段推后时钟（direct edge > blocked 断点提示 > 区域粗估 > 45 分兜底；原地卡不产生交通但不吞掉上一段路，按「上一个真实地点」计算）。住宿位单独挂在 Day 1/2 底部（`state.stays`），住宿卡拖到当天任意位置都会自动进住宿位。放置语义：拖/点到某张卡上 = 插到它前面，空白处 = 排到当天最后；撤销用整份草稿快照。每天有「结束于 HH:MM · 交通合计」小结，超过 22:00 提示偏满。旧版槽位制的 localStorage 草稿和导出文件会自动转换（`convertV1Slots`）。
- 缓存注意：index.html 里数据/逻辑脚本带 `?v=N` 版本参数；改 data/*.js 或 app.js 时把 v 加一，否则本地 python 服务器（无 Cache-Control，浏览器走启发式缓存）和 GitHub Pages（max-age=600）可能给用户旧文件。
- 时长覆盖逻辑（`coveredSlots`）：时间槽里的卡按 `durationMin` 向上取整到小时占格，被覆盖的空槽自动隐藏（移出后恢复）；被覆盖但已被占用的槽保持可见并提示「与上一项的预估时长重叠」。覆盖不跨天、不跨住宿槽。
- 放了卡的时间槽标题显示起止时间（如「10:00 – 11:30」，起点整点 + durationMin）。
- 拖拽 ghost 提起后伸展到该卡在网格里将占据的高度（行高实测自可见空时间槽，span = ceil(durationMin/60)），顶端对齐手指即开始时间；动画用强制 reflow 触发 transition，不依赖 rAF（预览环境里 rAF 可能不触发）。
- 区域概览图改为按真实经纬度投影排版（cos31° 校正纵横比，viewBox 300×440，占满整列），标签朝向按数据手工指定（`side`），验证过零重叠；线上数字为分钟粗估。坐标为近似值，记录在 `data/region-times.js` 注释里。
- 文案清理：删掉鸡汤式语句（简介留白宣言、preset「不是答案」、页脚 Saboteur 一句等），只保留操作说明。

v1.7（可编辑菜单，2026-07-09）：

- 菜单（卡池）从只读改为可编辑，做成和行程对称的模式：`data/places.js` 只是「仓库默认种子」（`DEFAULT_PLACES`），运行时的工作卡池是 `PLACES`，首访从默认播种、之后可增删改并存到 localStorage（`yixing-pool-v1`，格式 `{v,site,kind:"pool",places}`）。`cardById` 不再在加载时一次性建好，改由 `rebuildIndex()` 按当前 `PLACES` 随时重建；初始化顺序改为先 `loadPool()` 再 `load()`（草稿清洗依赖 cardById）。
- 首访不落盘：`loadPool()` 播种后不 `persistPool()`，所以没编辑过的用户仍能拿到仓库后续新增的卡；一旦编辑/新增/删除/导入才写入 localStorage 并从此以本地为准。「恢复默认」（`resetPool`）用 `normalizePool(DEFAULT_PLACES)` 覆盖回仓库版本。
- 菜单区标题栏加了 `新增卡片 / 导入 / 导出 / 恢复默认`（复用 `.plan-actions` 样式），每张卡右上角加「编辑」按钮（`data-edit-card`，pointerdown 与 click 都特判，避免触发拖拽/选卡）。
- 卡片编辑是表单弹窗（`#card-overlay`，复用 `.overlay`）：标题 / 类型 / 主题 / 位置 / 时长 / 暑热 / 需预约 / 适合时段（多选）/ 标签 / 简介 / 待确认。下拉项由 `initCardForm()` 从 `TYPE_LABELS`、`THEME_GROUPS`、`LOC_LABELS` 动态填充，中文标签不再重复写在 HTML。进阶字段（experienceValue/visualValue/budgetLevel/groupFit/cardRole/mapNode/cautions/sourceLinks/住宿三项）编辑时原样保留、新建时由 `normalizeCard` 补默认；改主题/位置时 mapNode 会重算。新卡 id 用 `genCardId()` 时间戳生成、不可改（保护方案/草稿里的引用）。
- 导入让用户选替换或合并（`#menu-import-overlay`：整体替换 / 合并追加）；合并按 id 覆盖同名、追加新卡。任何来源都过 `normalizeCard`/`normalizePool` 校验（坏卡丢弃、无标题丢弃），坏文件不动现有菜单。导出文件名 `yixing-menu.json`。
- 删除卡片或改动卡池后调用 `purgeMissingFromDraft()`，把行程 `state.days`/`state.stays` 里已不存在的卡 id 一并清掉；`buildDaySchedule` 和 `selectedItems` 本来也会跳过缺失卡，双保险。
- `renderPool` 增加「其他」兜底组：主题不在四感官里的卡（导入或改出来的）在「全部」下也看得到、能编辑。

重要：**当前所有地点、交通时间、禁连关系都是占位草稿**，来自 `docs/place-options-to-discuss.md` 的候选方向，尚未经过四人讨论确认，也未用高德 / 百度核实。占位卡片带 `pending: true` 字段（UI 显示「待确认」）；该字段是实现阶段对 schema 的最小扩展。

## 已定方向

- 最终是 GitHub Pages 可部署的纯静态网站。
- GitHub repo 应是 `RaymondFongHow/travel`，宜兴项目位于 repo 内的 `yixing/`。
- 目标访问路径是 `travel.raymondfonghow.com/yixing`。
- 面向四位朋友的宜兴旅行，两男两女，其中包括用户。
- 页面应该简约、现代、sans-serif。
- 不做传统旅游攻略，也不先做固定行程。
- 第一版核心是候选卡片 / 可拖拽板块 / 行程拼配。
- 用户想让朋友通过拼配感受不同感官主题，而不是被动阅读。
- 地点、体验、住宿、餐饮都可以是卡片。
- 自由时间、休息、Saboteur / 打牌也应该是卡片。
- 住宿必须参与动线判断。
- 交通地图是时距网络图，不是普通地理地图。
- 只有明确存在 direct edge 的两点才能连线。
- 如果 A 到 C 应经过 B，就不要画 A-C 直连。

## 用户约束

- 可以周五晚上到，也可以周六早上到。
- 周一吃完中饭后开始回程。
- 高铁到达和离开。
- 宜兴内部以打车为主，步行为辅。
- 骑行可以作为体验，但不是为了交通骑行。
- 住宿不需要贵，以方便行程为主。
- 用户提到“100 CNY 以内标间两间”，这里需要确认是每间每晚 100 CNY 以内，还是总预算。
- 可以接受长时间走路 / 骑行，但最好避开太热。
- 体验型活动优先级高。
- “真的进入地方”为主，好看重要但为辅。
- 行程不要排太死，没事时可能会停下来玩 Saboteur / 打牌。

## 不要误读

- 不要直接输出一个固定 itinerary 作为主产品。
- 不要把每个时间槽塞满。
- 不要把宜兴简化成紫砂壶购物。
- 不要把交通网络图做成自动最短路径规划器。
- 不要使用需要后端或账号系统的方案。
- 不要把站点写成只能部署在域名根路径；宜兴页面需要能在 `/yixing` 子路径下工作。
- 不要把 locationCode 当成自动连线依据。
- 不要默认住宿在山里；预算和高铁模式下城区 / 东氿更稳，但仍应作为卡片候选。

## 下一步建议

1. 和朋友讨论确认真实地点池（以 `docs/place-options-to-discuss.md` 为清单），把地点分成 `must / strong / optional / avoid-for-this-trip`。
2. 用确认结果替换 `yixing/data/places.js` 的占位卡片，去掉已确认卡片的 `pending` 标记。
3. 用高德 / 百度逐条核实 `transportEdges` 的时间，提升 `confidence`，补齐或删除边。
4. 复核 `blockedEdges`：哪些组合确实不应直连、建议中转是谁。
5. 确认住宿候选后更新两张住宿卡（`stay-dingshu-lake` 目前没有任何交通边，故意如此）。
6. 页面骨架已就绪，数据替换后基本不需要改 `app.js`。

## 仍需讨论的问题

- 住宿预算到底是每间每晚 100 CNY 以内，还是两间总计 100 CNY 以内。
- 周五晚上到的概率有多高；这会影响是否需要 `fri-night-arrival` preset。
- 是否需要网站里支持两个 preset：周五晚到 / 周六早到。
- 朋友是否都愿意做手作体验，还是只需要用户主推。
- 紫砂体验希望偏游客友好，还是偏工作室深度。
- 是否需要预约类卡片在 UI 中有更强提示。
- 餐饮要不要进入第一版卡片池；如果进入，是否先只做“餐饮类型”而不是具体店。
- 是否需要先查真实住宿候选，还是先用住宿区域卡片占位。
- 交通时间使用高德/百度人工估算后写死，还是先用粗略区域估算。
- 网站是否需要分享拼配结果；如果需要，优先考虑 URL hash。

## 文件入口

- `README.md`：travel repo 总览。
- `index.html`：根域名落地页。
- `yixing/index.html` + `yixing/styles.css` + `yixing/app.js`：拼配工具页面（v1 实现）。
- `yixing/data/`：places / transport-edges / blocked-edges / presets（均为占位数据）。
- `yixing/README.md`：宜兴项目总览。
- `yixing/docs/experience-concept.md`：感官和视觉方向。
- `yixing/docs/static-interaction-model.md`：静态交互和数据模型。
- `yixing/docs/card-composition-model.md`：卡片拼配核心产品模型。
- `yixing/docs/network-map-model.md`：交通时距网络图。
- `yixing/docs/place-options-to-discuss.md`：地点讨论模板。
