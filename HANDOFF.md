# FirstLght 交接文档（2026-11-17 20:00 压缩）

新建对话后让 AI 先读这份文档，即可无缝继续。

## 一、项目定位与栈
- **FirstLght**：命理排盘 App，星谕的复刻版，iOS WKWebView 套壳 PWA。
- 四体系：八字、紫微、印度占星(Lahiri 恒星黄道/整宫制)、西洋占星。
- 前端 HTML/CSS/JS，构建 esbuild 打包 `assets/console` → `js/console.js`（`npm run build:console`）。
- 八字引擎 `src/bazi-pro.mjs`（基于 lunar-javascript），紫微 `src/ziwei.mjs`，印占 `src/vedic-pro.mjs`+`src/vedic-strong.mjs`，星历 `src/ephemeris.mjs`。
- 服务端 `server.mjs` 直接读根目录 `js/console.js` + `assets/console/*`；`www/` 是 IPA 打包用的副本（CI 拷入）。
- **www/ 在 .gitignore**，提交源码需 `git add -f www/js/deep-*.js`。
- 版本号 5 处：`app-release.json`(含 releases 历史)、`package.json`+`package-lock.json`、`project.yml`、`ios-src/Info.plist`。全局替换会误伤 releases 历史，用 node 精准改并回写。
- 发布校验 `npm run check:release`：须保留上一版记录 + 每次用户可见变更 version 与 build 双升。

## 二、当前版本与状态
- **0.32.0/build116**（commit `373916e` + `afe91a1`）已发布 IPA，CI 全绿。
- 产物：`FirstLght-Analyze/FirstLight-0.32.0-build116.ipa`（桌面显示名「星谕」，bundleName FirstLight，含 PrivacyInfo.xcprivacy）。
- 工作区有**未提交改动**（目录锚点 + 紫微飞星轨迹），159 项测试全绿，尚未升版本出包。
- 上一轮全部交付：0.31.0（八字三垣/印占 Shadbala/紫微流月流日）、0.31.1（印占数据源修复）、0.32.0（发布缺陷/时间口径/五行色/深色/神煞）。

## 三、当前未提交改动（需升 0.33.0/117 出包）
1. **报告目录锚点 + 滚动进度**（`assets/console/full-report.js` + `app.js` + `design.css`）
   - `tocHtml(report)` 生成 `<details class="rpt-toc" open>` 可折叠目录（sticky 会遮挡正文，改为 relative + scroll-margin-top:96px）。
   - `composeFullReport` 返回体补了 `sections:report.sections`（此前 body-only，目录拿不到 sections）。
   - 每个 `.rpt-sec` 加 `data-sec=N` 锚点；目录项 `data-toc=N` 点击平滑滚动。
   - `openFullReport` 尾部加 `bindReportToc`：点击跳转 + scroll 监听更新 `[data-rpt-progress]` 百分比 + 高亮当前章 `.rpt-toc-item.on`。
   - `design.css` 加 `.rpt-toc*` 样式（含深色模式）。目录条目数已验证（八字 14 章、紫微 11 章）。

2. **紫微四化飞星轨迹**（`www/js/deep-ziwei.js` 四化章节）
   - 数据源 `palaces[].flying[]`，字段 `{star,type,branch}`——**branch 是 0-11 索引，无 palace 字段**，目标宫按 `palaces[m.branch].name` 取。
   - 生成 `flyRows`（起宫/四化/化星/落宫/象意五列），`<table class="rpt-fly">` 放进四化章 `html` 字段。
   - `flyLines`（含「飞星轨迹」「点击飞星连线」文案）push 进 `sihuaSec`（即 lines）。
   - **坑**：`findStarPalace` 改成函数声明（避免 TDZ），删掉原 215 行 const 重复声明。

3. **测试新增**（`test/boundary-contract.test.mjs`）
   - 报告目录契约（tocHtml/锚点/进度/scrollIntoView/CSS）。
   - 紫微飞星轨迹（含飞星轨迹/点击飞星连线文案 + ≥12 行表）。
   - **坑**：断言 `sec.html&&/<table/.test()` 不能写 `sec.html?/regex/`（解析歧义报 SyntaxError）。

## 四、下一步（新会话可做的）
- **升 0.33.0/117 出包**：当前改动测试已绿，node 改 5 处版本文件 → `npm run check:release` → `npm run build:console` → `npm test` → `node build/verify-depth.mjs`（真机视口）→ commit push → 等 CI → 下载 IPA 到 `FirstLght-Analyze/` → 解包校验 Info.plist。
- **遗留缺口**（已记录在工作日志 `.workbuddy/memory/2026-11-17.md` 末尾）：
  - Ashtakavarga 八分点（需可靠 BAV 表，宁缺毋错）。
  - Shadbala 补 Saptavargaja（七分盘友谊）/Drik（相位力）两项。
  - 印占 Yogini/Jaimini。
  - 八字合婚与紫微合盘（合盘目前只有西占 synastry）。
  - console.js 拆包（1.8MB+，冷启动有感知）。
  - iPad 横屏布局（现无 landscape 适配）。

## 五、CI 与构建流程
- `.github/workflows/build-ipa.yml`：Verify Offline Core（`npm test`）+ Build FirstLight IPA（xcodegen → xcodebuild → 打包 www → zip）。
- 打包步骤：拷 index.html/js/console.js/assets/console（design.css+liquid.css+credits.html）/www/js（排除 rules.js）→ xcodegen → xcodebuild → 校验 Info.plist + 资源完整性（index.html 引用的每个本地资源必须入包）→ zip。
- CI 抖动：webkit/chromium 交互时序竞态，`rerun-failed-jobs` 可救；冒烟脚本已加 `getAnimations().finished` 等待。
- `scripts/mobile-smoke.mjs`：三视口（390×844/414×896/360×780）真机断言，需 `FIRSTLIGHT_BROWSER=webkit`，本地约 3-4 分钟。
- `build/verify-depth.mjs`：playwright webkit 390×844 四体系报告渲染审计（溢出/转义/页错误/目录条目）。
- `build/tocprobe.mjs` + `build/tocclick.mjs`：目录条目数与点击跳转探测。`build/ziweifly.mjs`：紫微飞星表渲染探测。
- GitHub API 取 token：`git credential fill`（protocol=https/host=github.com）。repo `Hloeh12/FirstLght`。artifact 下载用 `/actions/artifacts/{id}/zip`。

## 六、代码风格与坑
- 报告 sections 支持 `{lines,table,html}`：**lines 会被 esc() 转义**，表格只能放 `html` 或 `table` 字段。已有「lines 禁含 HTML」跨体系契约测试。
- `design.css` 是 CRLF，用 node 读写并验证落盘（`grep -c` 确认）；改完跑 `node build/fsstat.cjs` 看 NaNpx。
- `liquid.css` 在 design.css 之后且大量 `!important`，深色/五行色覆盖必须写进 liquid.css 尾部。
- 五行色语义权威覆盖：`[data-e=X]{color:var(--*X)!important}` + `[data-e=X] .term{...!important}`（否则被 `.term` 硬编码粉色压住）。
- 时间口径：`normalized()` 有有效经度默认开真太阳时；盘头常驻 `.time-basis-note` 口径条。
- 紫微流日/流时日干支自推公式 **(JDN+49)%60**（JDN=floor(Date.UTC/864e5)+2440588，K 恒 49；`Lunar.fromYmd` 是农历，公历必须 `Solar.fromYmd`）。
- 深度报告知识库：`www/js/deep-bazi.js`（13 章）、`deep-ziwei.js`（11 章）、`deep-vedic.js`（11 章）、`deep-west.js`、`deep-synastry.js`（7 章）。
- 版本链历史：0.29.1/111→0.30.0/112→0.30.1/113→0.31.0/114→0.31.1/115→0.32.0/116。下一版 **0.33.0/117**。

## 七、用户偏好
- 专业深入源码级分析与可直接落地的修复，按模块/板块分组、编号列表、关注优先级排序。
- 报告要深度化、小白可读、不设上限，参考测测/问真/文墨天机/专业印占/中华八字知识。
- 排盘布局清晰、无视觉杂质、苹果液态玻璃效果；UI/字体/颜色/布局可整体重改，最合理优先。
- 传统五行色规范（木绿火红土黄金白水蓝黑），品牌粉仅用于导航按钮。
