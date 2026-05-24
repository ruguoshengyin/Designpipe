# Designpipe 2.0 — Bug 日志

> 每次修复 bug 后更新此文件。格式：现象 → 根因 → 修法 → 涉及文件。

---

## BUG-001 · FastAPI StreamingResponse DB 连接提前关闭
**发现时间**：重构后首次测试  
**现象**：`/api/generate` 和 `/api/chat` 返回 `no active connection` 错误，SSE 流立即中断  
**根因**：FastAPI 的 `Depends(get_db)` 在 handler 函数 return 时就关闭了 DB 连接，而 StreamingResponse 的 generator 是在 return 之后才真正执行的，此时连接已失效  
**修法**：在 `event_stream()` generator 内部用 `async with aiosqlite.connect(DB_PATH) as db` 自己管理连接生命周期，彻底移除 `Depends(get_db)`  
**文件**：`backend/routers/generate.py`, `backend/routers/chat.py`

---

## BUG-002 · Python f-string 内不能含反斜杠
**发现时间**：重构 generate.py 时  
**现象**：`SyntaxError: f-string expression part cannot include a backslash`  
**根因**：在 f-string 的 `{}` 内写了 `'线框图参考：\n' + wireframe_ref`，Python 3.11 以下不允许  
**修法**：把拼接逻辑提到 f-string 外，先赋值给变量再引用  
**文件**：`backend/routers/generate.py`

---

## BUG-003 · 中文弯引号被误识别为字符串边界
**发现时间**：重构 generate.py 时  
**现象**：`SyntaxError` 在含有中文 `"关键动作"` 的 f-string 行  
**根因**：中文全角引号 `"` `"` 与 Python 字符串边界引号混淆，解析器提前截断字符串  
**修法**：改用 ASCII 单引号或去掉引号直接写文字  
**文件**：`backend/routers/generate.py`

---

## BUG-004 · `dpSaveCache` 未定义
**发现时间**：前端热更新后控制台报错  
**现象**：`ReferenceError: dpSaveCache is not defined`  
**根因**：从 app.html 迁移时，旧函数名 `dpSaveCache` 没有在 frontend2 里实现，应改为 `dpSaveWorkflowState`  
**修法**：全局替换为 `window.dpSaveWorkflowState()`  
**文件**：`frontend2/src/components/Workflow.tsx`

---

## BUG-005 · Step 2 串行 AI 调用导致等待 3+ 分钟
**发现时间**：首次端到端测试  
**现象**：生成线框图时前端长时间无响应，用户需等 3-5 分钟  
**根因**：Step 2 依次串行执行 8 次 AI 调用（页面识别 + 概念方向 + 3×线框图生成 + 3×线框图摘要），且使用了第三方 API 代理（apiyi.com），单次往返延迟约 2.7 秒  
**修法**：用 `asyncio.gather()` 将 3 个线框图生成任务并行执行，每个方向的摘要紧跟其对应线框图在同一协程内生成，无需额外等待  
**效果**：Step 2 预计从 ~3 分钟降至 ~1 分钟  
**文件**：`backend/routers/generate.py`

---

## BUG-006 · "从线框图开始" 进度文案显示为"竞品分析"
**发现时间**：用户测试  
**现象**：点击「从线框图开始」后，loading 文案显示 `AI 正在生成竞品分析…`，误导用户以为走了完整流程  
**根因**：`Kickoff.tsx` 的 `handleConfirm()` 第一行无条件写死 `setLoadingMsg('AI 正在生成竞品分析…')`，未区分 `startStep`。实际上"从线框图开始"内部仍会先生成竞品数据作为基础，但这属于内部步骤，不应对用户展示  
**修法**：按 `startStep` 分支显示不同文案：`startStep === 3` 时显示 `AI 正在准备数据…（约 10 秒）`，后续子步骤加上 `（2/3）`/`（3/3）` 进度标记  
**文件**：`frontend2/src/components/Kickoff.tsx`

---

## BUG-007 · 新建项目返回首页后项目消失 / 进度为 0
**发现时间**：用户测试  
**现象**：在 Workflow 里跑了一段流程后回到首页，看不到刚才的项目；或看到项目但标题是"新设计项目"、进度条为空  
**根因**：两个叠加 bug  
1. **ID 错位**：`newProject()` 先用 `'proj_' + Date.now()` 临时 ID 跳转 Workflow，后台 API 创建成功后返回服务端 UUID，state 里的 ID 被替换。Workflow 仍用旧 tempId 调用 `onProjectUpdate`，在 state 里找不到匹配项，所有更新丢失；API 调用也因 404 失败  
2. **字段名不匹配**：服务端返回 snake_case（`current_step`, `max_step`），ProjectCard 读 camelCase（`currentStep`, `maxStep`），导致进度条始终为 0  
**修法**  
- 先 `await API.createProject()` 拿到真实 UUID 再跳转，消除 ID 错位  
- 加 `normalizeProject()` 归一化所有 API 响应，同时写 camelCase + snake_case  
- `onProjectUpdate` 同步维护两套字段名  
**文件**：`frontend2/src/App.tsx`

---

## BUG-008 · 新建项目后首页 loading 卡死 / 按钮无反馈
**发现时间**：用户测试  
**现象**：点击"新建设计项目"后，按钮没有任何视觉反馈，页面像卡住一样；偶发首页 `加载中…` 永远不消失  
**根因**  
1. `newProject()` 改为先 `await API.createProject()` 再跳转，API 耗时 ~1-3 秒但没有 loading 状态，用户不知道在等什么  
2. `listProjects()` 没有超时保护，若 API 挂起，`loading = true` 永远不会变成 `false`  
**修法**  
- 增加 `creating` 状态，传递给 Home → 新建按钮变灰 + 转圈动画 + 文案"创建中…"，防止重复点击  
- `listProjects()` effect 加 4 秒 setTimeout 兜底，无论 API 是否响应都会解除 loading  
**文件**：`frontend2/src/App.tsx`, `frontend2/src/views/Home.tsx`, `frontend2/src/components/project/ProjectCard.tsx`

---

## BUG-009 · Step1 崩溃 + dpClearCache 未定义导致页面白屏
**发现时间**：用户测试（新建项目进入 Workflow 后）  
**现象**：页面打不开，React 崩溃白屏  
**根因**：两个独立错误同时触发  
1. `Step1.tsx` 直接读 `data.objective`，新项目时 `DPData.step1 = null`，读 null 属性抛 TypeError，React 树崩溃  
2. `Kickoff.tsx` 调用 `window.dpClearCache()`，但该函数从未在 frontend2 里定义（遗漏从 app.html 迁移）  
**修法**  
- Workflow.tsx 传给 Step1 的 data 加 `|| {}` 空对象兜底  
- App.tsx 补定义 `window.dpClearCache`（清除 localStorage 缓存）并在 Window 接口声明中注册  
**文件**：`frontend2/src/components/Workflow.tsx`, `frontend2/src/App.tsx`

---

## BUG-010 · Kickoff 确认后一直转圈，无法继续
**发现时间**：用户测试  
**现象**：点击"开始分析"或"从线框图开始"后，loading 动画永远不消失，页面卡死  
**根因**：`handleConfirm` 在 `setThinking(true)` 之后立即调用 `window.dpClearCache()`，该函数抛出 TypeError（BUG-009 的遗留），导致 async 函数在此中断，末尾的 `setThinking(false)` 永远不执行  
**修法**  
- 把 `handleConfirm` 整体包在 `try/finally` 里，`finally` 块无条件执行 `setLoadingMsg('')` + `setThinking(false)`  
- `dpClearCache()` 和 `dpSaveCache()` 改用可选调用 `?.()` 防止未来再出现类似崩溃  
**文件**：`frontend2/src/components/Kickoff.tsx`

---

## BUG-011 · 已有进度的项目重新打开走 Kickoff / 内容为空
**发现时间**：用户测试  
**现象**：首页点击已生成过内容的项目，还是显示 Kickoff 问卷；或进入 Workflow 后步骤内容全空  
**根因**：两个叠加问题  
1. `dp_wf_state_v2` 是全局 localStorage key，不区分项目——多项目时互相覆盖  
2. `dpSaveWorkflowState` 只存了导航状态（currentStep/completedStep），没存 DPData 步骤内容（step1/2/4/6），页面刷新后 DPData 全部为空  
**修法**  
- cache key 改为 `dp_wf_v3_{projectId}`，每个项目独立存储  
- `dpSaveWorkflowState` 同时快照 DPData.step1/2/4/7/pageType；hi-fi HTML 单独存一个 key 防止超出 5MB 限制  
- Workflow 挂载时从缓存恢复 DPData（仅补空值，不覆盖已有内容）  
- `openProject` 判断逻辑改为：`step > 0` 或 有 localStorage 缓存，才 `skipKickoff=true`  
**文件**：`frontend2/src/App.tsx`, `frontend2/src/components/Workflow.tsx`

---

## FEAT-001 · 高保真原型改为多屏可交互
**实现时间**：2026-05-23  
**需求**：高保真生成的 HTML 可交互，点击按钮能跳转到对应界面  
**方案**：修改 AI prompt，要求生成多屏结构的单文件 HTML 原型  
**HTML 骨架**  
- 多个 `.dp-screen` div，仅第一个 `.active`（translateX(0)），其余 translateX(100%)  
- `dpShow(id)` 函数：隐藏当前屏、推入历史栈、展示目标屏（0.22s cubic 滑动动画）  
- `dpBack()` 函数：从历史栈弹出，滑回上一屏  
- 所有 CTA 按钮绑定 `onclick="dpShow('sN')"`，次级屏 nav-bar 有返回按钮 `onclick="dpBack()"`  
- 规划 3-5 个屏幕：主屏 + 主 CTA 结果 + 次 CTA 结果 + 可选更深层  
**验证 pass 同步更新**：保留所有 `.dp-screen` + `dpShow/dpBack` 脚本，只对 s1 主屏做模块补全  
**前端无需改动**：`<iframe sandbox="allow-scripts">` 天然支持 JS，`pointerEvents` 由"可交互"开关控制  
**文件**：`backend/routers/generate.py`

---

## BUG-012 · 点击有进度的项目后页面空白
**发现时间**：用户测试（重启后打开已有项目）  
**现象**：点击首页已有进度的项目卡片，进入 Workflow 后页面一片空白（React 崩溃白屏）  
**根因**：两个叠加问题  
1. `Step7` 在 `data = null` 时直接读 `data.background` → TypeError，React 树崩溃白屏  
2. 重启后 localStorage 缓存丢失（用户清除过 / 换设备），Workflow 不从 API 拉取已保存的 step 数据，DPData 全空  
**修法**  
- `Step7` 加 null guard：`data = _data || {}`，无数据时渲染"交付总结生成中"占位  
- `Workflow` 新增 `useEffect`：`skipKickoff=true` 且无 localStorage 缓存时，并行 `fetch /api/projects/:id/steps/0~4` 把 DB 里的内容恢复到 DPData（仅补空值，不覆盖已有内容）  
**文件**：`frontend2/src/components/steps/Step7.tsx`, `frontend2/src/components/Workflow.tsx`

---

## BUG-013 · "单独打开"按钮无效——重新打开了同一页面
**发现时间**：用户测试  
**现象**：点击步骤头部的"单独打开"按钮，新标签页打开的是 Workflow 页面本身，与直接复制 URL 没有区别，高保真原型无法独立预览  
**根因**：`onClick` 写死为 `window.open(window.location.href, '_blank')`，没有区分步骤类型，也没有取对应内容  
**修法**：改为按当前步骤分支处理  
- Step 4（高保真）：取 `DPData.step6.html`，创建 Blob URL 在新标签页打开完整可交互 HTML 原型  
- Step 3（概念·线框）：取选定方向的 `wireframeHTML`，同样 Blob URL 打开  
- 其他步骤：把当前步骤区域的 `innerText` 包进简单 HTML 阅读页后 Blob URL 打开  
- Blob URL 在 60 秒后自动 `revokeObjectURL` 释放内存  
**文件**：`frontend2/src/components/Workflow.tsx`

---

## BUG-014 · `qa.filter is not a function` 导致高保真生成失败
**发现时间**：用户测试  
**现象**：进入高保真步骤时顶部报错 `AI 生成失败：qa.filter is not a function`，高保真 HTML 无法生成，页面也就没有多屏交互结构  
**根因**：`App.tsx` 中 `window.DPData.qa` 初始化为 `{}`（对象），而 `buildQAContext()` 直接调用 `qa.filter()`（数组方法），类型不匹配抛 TypeError，AI 生成函数在此中断  
**修法**  
- `App.tsx`：`qa: {}` 改为 `qa: []`，与 `buildQAContext` 期望的数组类型一致  
- `utils/ai.ts`：`buildQAContext` 加防御 `Array.isArray(raw) ? raw : []`，以后即使外部误写为对象也不会崩溃  
**文件**：`frontend2/src/App.tsx`, `frontend2/src/utils/ai.ts`

---

## FEAT-002 · 高保真图标改用 Lucide Icons · 转转强弱规范
**实现时间**：2026-05-24  
**需求**：高保真原型图标从 ad-hoc 内联 SVG 改为 Lucide 开源图标库，强弱参考转转规范  
**方案**：在 hi-fi 生成 prompt 末尾追加图标规范章节  
- `<head>` 引入 `https://unpkg.com/lucide@latest/dist/umd/lucide.min.js`  
- 用法：`<i data-lucide="icon-name"></i>` + `</body>` 前调用 `lucide.createIcons()`  
- **强（stroke-width:2）**：返回箭头、主 CTA 内图标、Tab 选中项、错误提示  
- **弱（stroke-width:1.5）**：Tab 未选中、列表箭头、表单图标、装饰图标  
- 尺寸：Tab bar 22px · Nav bar 20px · 列表行 16px · 表单内 14px  
- 颜色：Tab 选中 #FF0F27 · Tab 未选中 #999999 · 辅助图标 #BBBBBB  
- 验证 pass 同步约束：保留 Lucide CDN 和 createIcons() 调用  
**文件**：`backend/routers/generate.py`

---

## BUG-015 · 高保真配色出现蓝色——违反转转规范
**发现时间**：用户测试  
**现象**：生成的高保真原型中功能按钮（智能分组/自动排序/批量编辑）使用蓝色文字+蓝色图标+蓝色背景，不符合转转设计规范  
**根因**：AI 默认使用 iOS/Material 系统蓝（#007AFF/#4169E1）作为次级操作色；设计规范里没有明确禁止蓝色，AI 推断不出"转转无蓝色体系"  
**修法**  
- `backend/utils/design_spec.py`：新增 §7b 「绝对禁止蓝色」条目，列出所有常见蓝色值，并给出正确替代配色速查表  
- `frontend2/src/constants/designSpec.ts`：同步新增 §9 颜色最高优先级约束，前端 legacy 路径也受约束  
- 正确规范：次级功能按钮 → `bg:#F5F5F5 color:#111 icon:#666`；主CTA → `bg:#FF0F27 color:#fff`  
**文件**：`backend/utils/design_spec.py`, `frontend2/src/constants/designSpec.ts`

---

## FEAT-003 · 高保真品质精修 pass + design spec v1.2
**实现时间**：2026-05-24  
**需求**：高保真输出对齐/尺寸/排版不符合可交付标准  
**方案**  
1. **design_spec.py 全面升级至 v1.2**（集成 zhuanzhuan-design skill token 系统）  
   - 完整字号/字重/颜色对照表（10~22px 共12档，每档明确 weight+color）  
   - 4pt 间距系统（4/8/12/16/20/24/32px）  
   - 精确圆角表（按钮pill / 卡片16px / chip 6px / 卖点标签1px / 输入框pill）  
   - 组件高度速查（按钮 48/40/32px；chip 26px；nav 88px；tab 60px；操作栏 64/80px）  
   - 阴影规范（0 1px 2px + 0 8px 24px rgba(17,17,17,.04)）  
   - HTML 模板（横版商品卡、次级按钮组、主CTA）  
2. **新增 Phase 4：品质精修 pass**（在策略核查 pass 之后运行）  
   - ① 排版：字号/字重/颜色强制对齐规范，消灭 Inter/Roboto  
   - ② 间距：所有 padding/margin/gap 改为4的倍数，左右边距统一16px  
   - ③ 圆角：按组件类型强制修正  
   - ④ 颜色：消灭蓝色，价格强制#111，图标颜色显式设置  
   - ⑤ 对齐：flex容器加 align-items，文字与图标垂直居中  
   - ⑥ 组件尺寸：按钮/chip/nav/tab bar 精确高度  
   - ⑦ 多屏一致性：各屏导航/tab bar 高度颜色一致，保留交互绑定  
**文件**：`backend/utils/design_spec.py`, `backend/routers/generate.py`

---

_最后更新：2026-05-24_
