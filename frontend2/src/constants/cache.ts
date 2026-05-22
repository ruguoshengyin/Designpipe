// Designpipe Cache (localStorage) — persists step data, QA, workflow state across page refreshes.

export const DP_CACHE_KEY = "dp_cache_v2";
export const DP_STATE_KEY = "dp_wf_state_v2";
export const DP_PROJECTS_KEY = "dp_projects_v2";

// Initial demo data attached to window.DPData
export const dpData = {
  projects: [
    {
      id: "iphone15",
      title: "转转 iPhone 15 搜索结果页优化",
      product: "转转 App",
      targetUser: "想购买二手 iPhone 的用户",
      scenario: "搜索 iPhone 15 后，通过成色、容量、价格筛选并快速比较商品",
      style: "转转风格",
      cover: "iphone",
      currentStep: 3,
      maxStep: 5,
      direction: null,
      updatedAt: "2 分钟前",
      collaborators: ["Y", "L", "Z"],
      status: "进行中",
      tag: "二手电商",
    },
  ],

  steps: [
    { idx: 1, name: "竞品分析", en: "Research", desc: "搜索真实竞品数据，提炼与当前设计任务相关的信息" },
    { idx: 2, name: "设计分析", en: "Diagnose", desc: "专家级诊断：核心问题、决策模型、机会点、设计原则" },
    { idx: 3, name: "概念方向 + 线框图", en: "Concept", desc: "A / B / C 差异化策略 + 对应线框图，选定一个方向" },
    { idx: 4, name: "高保真设计稿", en: "Hi-fi", desc: "转转风格的可交互 HTML" },
    { idx: 5, name: "交付文档", en: "Handoff", desc: "精简交付摘要 + 文件索引" },
  ],

  step1: {
    objective: "围绕「转转 iPhone 15 搜索结果页」提炼可直接驱动列表/筛选/卡片设计决策的竞品输入。",
    focus: [
      "搜索入口如何承接「想买 iPhone 15」的明确意图",
      "排序与快捷筛选如何降低决策成本",
      "商品卡哪些关键字段同屏可见",
      "信任 / 风险 / 保障信息如何前置",
      "用户如何比较 2-3 件候选并继续下一步",
    ],
    competitors: [
      { name: "闲鱼", url: "https://www.goofish.com", observation: "卡片以图片为主，机况描述弱，信任靠「鱼小铺/官方认证」标签前置", usable: "标签前置 + 大图沉浸式信息流", avoid: "缺乏统一容量/成色字段，比价困难", impact: "Step 3 方向 A 借鉴标签前置；线框卡片不照搬" },
      { name: "京东到家", url: "https://www.jd.com", observation: "顶部 chip 式快捷筛选（容量/版本/颜色），下拉详细筛选层级清晰", usable: "二级筛选 chip 持久可见，状态可撤销", avoid: "结构偏新机，无机况维度", impact: "Step 3 线框筛选条结构、Step 4 chip 组件" },
      { name: "多抓鱼", url: "https://www.duozhuayu.com", observation: "卡片把「成色等级 + 价格 + 简短机况」做成三联，编辑感强", usable: "成色等级标准化、字段一致", avoid: "类目窄、节奏过慢，转转 C2C 节奏更快", impact: "Step 2 决策模型核心矛盾；Step 3 线框结构基础" },
      { name: "Apple 官方翻新", url: "https://www.apple.com.cn/shop/refurbished", observation: "保障信息（一年保修、180 天免费换货）放在卡片顶部", usable: "保障信息卡顶部固定，与价格同屏", avoid: "SKU 极少，无 C2C 节奏", impact: "Step 3 方向 B「能力增强」核心：保障前置" },
    ],
    inputs: [
      "搜索结果页必须固定关键词上下文，避免用户在筛选中迷失",
      "排序 + 容量/成色/价格至少有一组持久可见的快捷筛选",
      "商品卡同屏字段：型号-成色-容量-价格-保障，比价感优先",
      "前置「保障 / 验机 / 7 天无理由」等信任锚点",
      "下拉详筛要支持「条件可见 + 可撤销」，避免误筛后无法回退",
    ],
  },

  step2: {
    diagnosis: "用户在「想买 iPhone 15」的明确意图下，被淹没在差异极大的 C2C 商品池中，缺少可比较的标准化字段与可信赖的快速决策路径。",
    decisionModel: [
      { label: "目标锁定", text: "进入页面时用户已锁定型号/容量/预算区间" },
      { label: "快速过滤", text: "通过 1-2 次筛选把池子从 1000+ 缩到 20 以内" },
      { label: "横向比对", text: "在 2-3 个候选间比对机况、价格、保障" },
      { label: "信任校验", text: "对单品做一次「是否值得买」的信任评估" },
      { label: "进入详情", text: "进入候选商品详情或直接咨询客服" },
    ],
    tensions: [
      { name: "标准化 ↔ 真实感", expr: "C2C 描述自由 vs 比价需要统一字段", design: "对成色 / 容量等做强约束的结构化标签" },
      { name: "丰富信息 ↔ 列表密度", expr: "保障 / 验机 / 机况都重要 vs 屏幕只有 6 张卡的位置", design: "卡片分两层：第一层强决策字段，第二层在卡片展开/详情" },
      { name: "AI 智能 ↔ 用户控制", expr: "智能排序提升转化 vs 用户害怕被推销", design: "默认推荐但筛选条件全程可见、可一键清除" },
    ],
    judgements: [
      "列表页不是搜索页的延续，而是「比价决策面板」",
      "用户的真正动作是「快速排除」而不是「逐个浏览」",
      "保障信息必须做到卡片级，而不是详情级",
    ],
    opportunities: [
      { p: "P0", name: "成色 / 容量结构化筛选", why: "60%+ 用户在 30 秒内做这两步", impact: "贯穿 Step 3/4" },
      { p: "P0", name: "卡片同屏五要素", why: "比价决策的最小信息单位", impact: "Step 3/4 卡片样式" },
      { p: "P1", name: "保障标签前置", why: "信任是 C2C 二手最大瓶颈", impact: "Step 3 方向 B 核心" },
      { p: "P1", name: "比价对比抽屉", why: "横向比较 2-3 件是高频动作", impact: "Step 3 方向 C 核心" },
      { p: "P2", name: "条件可视 + 一键清除", why: "降低误操作回退成本", impact: "Step 3 筛选条设计" },
    ],
    principles: [
      "把搜索结果页当作「决策面板」，不是信息流",
      "结构化优先于真实感，关键字段必须可被比对",
      "信任做到卡片级",
      "用户始终能看见并撤销当前筛选条件",
      "默认推荐 + 全程可控",
    ],
    nielsen: [
      { rule: "Visibility of system status", issue: "用户不知道当前在搜哪个关键词、用了哪些筛选", level: "高", insight: "固定搜索词条 + 持久 chip 行" },
      { rule: "Match between system and real world", issue: "「成色」等级表述与用户口语不一致", level: "中", insight: "等级用图标 + 短句双轨" },
      { rule: "User control and freedom", issue: "筛选误操作后回退路径不清", level: "高", insight: "一键清除 + 单条 chip 可关" },
      { rule: "Consistency", issue: "卡片字段在不同 SKU 不一致", level: "高", insight: "强制结构化模板" },
      { rule: "Recognition over recall", issue: "保障信息隐藏在详情，用户记不住", level: "中", insight: "保障标签上提" },
    ],
    jtbd: {
      core: "我想用最少的代价，从一堆 C2C 商品里挑出一台「我能放心买」的 iPhone 15",
      emotion: "不被坑、不后悔、买完踏实",
      social: "和朋友聊起来时能讲清楚「我为什么买这一台」",
    },
  },

  step3: {
    mermaid: `flowchart TD
  A["进入搜索结果页"] --> B["首屏浏览"]
  B --> C["快捷筛选"]
  C --> D["卡片同屏比对"]
  D --> E{"找到候选？"}
  E -- "是" --> F["加入对比 / 进入详情"]
  E -- "否" --> G["调整筛选"]
  G --> C
  F --> H{"信任校验通过？"}
  H -- "是" --> I["进入详情 / 咨询客服"]
  H -- "否" --> J["看保障标签 / 卖家信用"]
  J --> F`,
  },

  step4: {
    directions: [
      {
        key: "A",
        title: "保守优化",
        subtitle: "信息层级 + 卡片重构",
        oneliner: "在不动主流程的前提下，把搜索结果页的卡片字段和筛选条整理成标准化决策面板。",
        moves: ["顶部固定搜索词 + 快捷筛选 chip 行", "卡片统一五要素：型号 / 成色 / 容量 / 价格 / 保障", "保障标签前置到卡片"],
        advantage: "改动小、上线快、不破坏现有 SKU 与运营策略",
        tradeoff: "对比 / 信任体验提升有限，长期天花板低",
        cost: "low",
        impact: "+ 8-12% 列表→详情转化",
        cite: "对应 Step 2 P0 「卡片同屏五要素」",
      },
      {
        key: "B",
        title: "能力增强",
        subtitle: "保障锚点 + 智能排序",
        oneliner: "在 A 基础上引入「放心买」保障锚点和场景化智能排序，让信任前置成为产品的核心价值。",
        moves: ["保障锚点：验机 / 7天无理由 / 一年质保做成卡片角标", "智能排序：根据用户预算和偏好动态加权", "卖家信用：信用分 + 历史成交气泡"],
        advantage: "信任前置直接拉升下单意愿，差异化竞品",
        tradeoff: "依赖运营 / 履约能力，需要协同业务方",
        cost: "med",
        impact: "+ 15-20% 加购，+ 8% GMV",
        cite: "对应 Step 2 P1 「保障标签前置」",
        recommended: true,
      },
      {
        key: "C",
        title: "体验重构",
        subtitle: "比价工作台",
        oneliner: "把搜索结果页重做为「比价工作台」：左侧浏览 / 右侧对比 / 全程横向比较，重新定义二手比价场景。",
        moves: ["横向「对比抽屉」：可加入 2-3 件商品横向看", "比价表格：型号 / 成色 / 容量 / 价格 / 保障一行对一行", "新的页面骨架：左侧列表 + 右侧对比，桌面/平板双形态"],
        advantage: "重新定义品类心智，构建长期护城河",
        tradeoff: "改动大、需要工程支持、ROI 周期长",
        cost: "high",
        impact: "+ 25-35% 比价场景，但首次发版风险大",
        cite: "对应 Step 2 P1 「比价对比抽屉」",
      },
    ],
    recommendation: {
      pick: "B",
      reason: "B 在控制改动幅度的同时，正面解决 Step 2 中诊断到的「信任是 C2C 二手最大瓶颈」，且 ROI 周期短于 C。可作为 V1 发版，C 作为 V2 路线图。",
    },
  },

  step5: {
    title: "iPhone 15 搜索结果页 - 线框 + 标注",
    summary: "围绕方向 B「能力增强」：搜索词上下文固定、快捷筛选持久、卡片五要素同屏、保障锚点前置、对比入口轻量浮现。",
    annotations: [
      { n: 1, target: "header", note: "搜索词条固定在顶部，可点击修改；左侧返回箭头保留上下文。" },
      { n: 2, target: "chips", note: "快捷筛选 chip 行：价格 / 成色 / 容量 优先级靠前，已选 chip 可单独关闭。" },
      { n: 3, target: "sort", note: "排序与高级筛选并排，高级筛选展开为底部 sheet。" },
      { n: 4, target: "card", note: "卡片五要素：型号 + 成色 + 容量 + 价格 + 保障标签同屏，价格视觉权重最高。" },
      { n: 5, target: "trust", note: "保障锚点（验机 / 7 天无理由 / 一年质保）做卡片右上角小标签，颜色统一。" },
      { n: 6, target: "compare", note: "右下浮起对比抽屉入口，加入 2-3 件商品后激活，作为 V2 演进口子。" },
    ],
  },

  step7: {
    background: "转转作为头部二手电商，iPhone 15 搜索结果页是搜索流量的核心承接面，承担列表→详情→下单的关键转化节点。",
    diagnosis: "用户在明确意图下被 C2C 池子的非标信息淹没，列表页不是搜索的延续，而应该是「比价决策面板」。",
    direction: "方向 B「能力增强」：在标准化卡片基础上前置保障锚点，引入场景化智能排序。",
    decisions: [
      "搜索词条固定 + 快捷筛选 chip 持久可见，全程可撤销",
      "卡片五要素：型号 / 成色 / 容量 / 价格 / 保障",
      "保障锚点卡片级前置（验机 / 7天无理由 / 一年质保）",
      "对比抽屉作为 V2 演进入口，V1 仅埋点观测",
      "智能排序默认开启，提供「按价格」「按成色」显式覆盖",
    ],
    next: [
      "V1 发版：方向 B 全量，预计 2-3 个迭代",
      "V2 路线：引入方向 C 比价工作台横向能力",
      "需要业务方配合：保障体系标签 SOP、卖家信用分公开口径",
      "埋点：filter_chip_click / card_5elements_view / trust_anchor_view / compare_drawer_intent",
    ],
    files: [
      { name: "01-竞品分析.md", size: "12.3 KB", type: "md" },
      { name: "02-设计分析.md", size: "18.7 KB", type: "md" },
      { name: "03-概念方向+线框图 A·B·C.pdf", size: "2.1 MB", type: "pdf" },
      { name: "04-高保真-转转风格.html", size: "82.0 KB", type: "html" },
      { name: "05-交付摘要.md", size: "6.5 KB", type: "md" },
    ],
  },
} as any;

export function dpSaveCache(): void {
  try {
    const d = (window as any).DPData;
    const step6 = d.step6 ? { html: d.step6.html } : null;
    localStorage.setItem(DP_CACHE_KEY, JSON.stringify({
      step1: d.step1 || null,
      step2: d.step2 || null,
      step3: d.step3 || null,
      step4: d.step4 || null,
      step5: d.step5 || null,
      step6: step6,
      step7: d.step7 || null,
      qa: d.qa || [],
      pageType: d.pageType || null,
    }));
  } catch(e: any) { console.warn("[DPCache] save failed:", e.message); }
}

export function dpSaveWorkflowState(state: any): void {
  try { localStorage.setItem(DP_STATE_KEY, JSON.stringify(state)); } catch {}
}

export function dpLoadWorkflowState(): any {
  try { return JSON.parse(localStorage.getItem(DP_STATE_KEY) || "null"); } catch { return null; }
}

export function dpSaveProjects(projects: any[]): void {
  try { localStorage.setItem(DP_PROJECTS_KEY, JSON.stringify(projects)); } catch {}
}

export function dpLoadProjects(): any[] | null {
  try { return JSON.parse(localStorage.getItem(DP_PROJECTS_KEY) || "null"); } catch { return null; }
}

export function dpClearCache(): void {
  try {
    localStorage.removeItem(DP_CACHE_KEY);
    localStorage.removeItem(DP_STATE_KEY);
  } catch {}
}

// Auto-restore on module load (mirrors the IIFE in app.html)
function autoRestore(): void {
  try {
    const raw = localStorage.getItem(DP_CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw);
    const d = (window as any).DPData;
    if (!d) return;
    if (cache.step1) d.step1 = cache.step1;
    if (cache.step2) d.step2 = cache.step2;
    if (cache.step3) d.step3 = cache.step3;
    if (cache.step4) d.step4 = cache.step4;
    if (cache.step5) d.step5 = cache.step5;
    if (cache.step6) d.step6 = cache.step6;
    if (cache.step7) d.step7 = cache.step7;
    if (cache.qa)    d.qa   = cache.qa;
    if (cache.pageType) d.pageType = cache.pageType;
    console.info("[DPCache] ✅ 已恢复步骤缓存");
  } catch(e: any) { console.warn("[DPCache] restore failed:", e.message); }
  try {
    const savedProjects = JSON.parse(localStorage.getItem(DP_PROJECTS_KEY) || "null");
    if (savedProjects && savedProjects.length) {
      const d = (window as any).DPData;
      if (!d) return;
      const demo = d.projects.find((p: any) => p.id === "iphone15");
      const userProjects = savedProjects.filter((p: any) => p.id !== "iphone15");
      d.projects = demo ? [demo, ...userProjects] : userProjects;
      console.info("[DPCache] ✅ 已恢复项目列表", d.projects.length, "个");
    }
  } catch(e: any) { console.warn("[DPCache] projects restore failed:", e.message); }
}

// Attach helpers to window
if (typeof window !== 'undefined') {
  (window as any).dpSaveCache = dpSaveCache;
  (window as any).dpSaveWorkflowState = dpSaveWorkflowState;
  (window as any).dpLoadWorkflowState = dpLoadWorkflowState;
  (window as any).dpSaveProjects = dpSaveProjects;
  (window as any).dpLoadProjects = dpLoadProjects;
  (window as any).dpClearCache = dpClearCache;
  // Initialize DPData
  (window as any).DPData = dpData;
  // Now auto-restore (merges localStorage over defaults)
  autoRestore();
}
