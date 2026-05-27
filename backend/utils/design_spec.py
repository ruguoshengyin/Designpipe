DESIGN_SPEC = r"""## 转转 ZHUAN — 设计系统规范 v2.0
> 权威来源：Figma 原稿 + CSS Token + UI Kit JSX 实现
> v2.0 在 v1.x 基础上全面校正矛盾项，以 Figma 实源为准。
> ⚠️ 凡与 v1.x 不一致处，以本文为准。

---

### 1 · 产品定位

转转是二手商品交易 App，核心品类是**二手手机**（iPhone、华为）和**二手奢侈品**（GUCCI、LV）。
用户通过**成色 / 功能等级 / 容量 / 价格**多维筛选商品，核心场景是**搜索 → 列表 → 筛选**。
工具型 App，非营销驱动，每屏服务于一笔交易。

**内容基础规则（硬约束）：**
- 所有界面文案为**简体中文**
- 价格：`¥` + 整数，无小数（`¥2159` ✓，`¥2159.00` ✗，`$` ✗）
- 成色标签仅限：`全新 / 99新 / 95新 / 9成新 / 8成新`
- 功能等级仅限：`S / A / B / C`
- 顶部筛选 Tab 固定 4 项：`综合 / 价格 / 型号 / 筛选`，不得改名/增删/重排
- 英文型号原样保留大小写：`iPhone`、`GUCCI`、`LV`
- 称谓：不使用"你/您"，文案是「标签式」非「句子式」

---

### 2 · 颜色系统（CSS Token 权威值）

```css
/* 品牌色 */
--zz-brand:       #FF0F27   /* 品牌主色：选中态文字 / 收藏选中 / chip选中文字和边框 */
--zz-action-red:  #FF0007   /* 操作红：主按钮背景 / 价格 ¥ 符号和数字 */
--zz-brand-bg:    #FFF2F2   /* 极淡红：选中 chip 背景 */

/* 文字灰阶 */
--zz-fg-1:        #111111   /* 一级文字：标题、商品名 */
--zz-fg-2:        #666666   /* 二级文字：chip 默认、副标题 */
--zz-fg-3:        #999999   /* 三级文字：占位、辅助说明 */
--zz-fg-dim:      #BBBBBB   /* 暗文字：placeholder、disabled */

/* 背景 / 容器 */
--zz-bg-page:     #F8F8F8   /* 页面背景（表单/设置/我的类页面） */
--zz-bg-white:    #FFFFFF   /* feeds/list-search 页面背景（必须白底！） */
--zz-bg-card:     #FFFFFF   /* 卡片白 */
--zz-bg-soft:     #F7F7F7   /* 输入框 / chip 底色（未选中） */

/* 结构 */
--zz-divider:     #F0F0F0   /* 分割线（0.5–1px） */
--zz-stroke:      #D8D8D8   /* 描边（价格输入框） */

/* 蒙层 */
--zz-overlay-30:  rgba(0,0,0,0.30)
--zz-overlay-70:  rgba(17,17,17,0.70)   /* 弹层 scrim */

/* 语义色（低频） */
--zz-warning:     #FFA628   /* 警示（≤3天到期 / 风险） */
--zz-warning-bg:  #FFFAED
--zz-link:        #42A0FF   /* 链接蓝 / Dialog 主行动文字按钮（低频，非通用交互色）*/
--zz-success:     #72D954
```

#### ⚠️ v1.x 校正（以下是 v1.x 的错误，v2.0 已修正）

| 项目 | v1.x（错误） | v2.0（正确） |
|---|---|---|
| feeds / list-search 页面背景 | `#F8F8F8` | `#FFFFFF` 白底 |
| 价格 ¥ 符号颜色 | `#111`（黑） | `#FF0007`（操作红） |
| 价格数字颜色 | `#111`（黑） | `#FF0007`（操作红） |
| chip 底色 | `#F5F5F5` | `#F7F7F7`（`--zz-bg-soft`） |
| chip 字重 | `400` | `300`（Light），**任何状态不加粗** |
| 导航标题字号/字重 | `18px/700` | `17px/500` |
| 主按钮高度 | `48px` | `40px` (lg) |

#### 颜色使用规则

```
#FF0F27（品牌红）→ 仅用于：选中态文字 / chip 选中时文字和边框 / 收藏星选中
#FF0007（操作红）→ 仅用于：主 CTA 按钮背景 / 价格 ¥ 符号和数字

🚫 绝对禁止：
  ✗ 蓝色系（#007AFF / #4169E1 / #1677FF / #2563EB / #3B82F6 等）用于按钮/图标/chip
  ✗ 紫色系（#6366F1 / #7C3AED / #8B5CF6 / #9333EA / #A855F7 / #C084FC 等）任何用途
  ✗ 渐变（linear-gradient / radial-gradient）用于按钮、背景、卡片
  ✗ 彩色阴影 / 高强度阴影（opacity > 0.15）

次级操作按钮正确配色 → bg:#F5F5F5  color:#111（不是紫色，不是蓝色）
```

---

### 3 · 字体规范

```css
--zz-font-cn:  "PingFang SC", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif
--zz-font-num: "Akrobat", "PingFang SC", -apple-system, sans-serif  /* 仅价格数字 */
```

- **PingFang SC** — 全部中文 UI 文字，可用字重：300 / 400 / 500 / 600
- **Akrobat** — 仅价格数字 20px（回退：PingFang SC 加粗）
- **禁止**：Inter / Roboto / Arial / Open Sans / SF Pro / system-ui 作为主字体

---

### 4 · 字号 / 字重 / 颜色对照表

| 场景 | 字号 | 字重 | 颜色 |
|---|---|---|---|
| 卖点标签文字 / 成色微标 | 10px | 300 | `#FF0F27` / `#111` / `#FFA628` |
| chip 文字（**任意状态**） | 12px | **300** | 默认`#666`，选中`#FF0F27` |
| ¥ 符号 | 12px | 500 | `#FF0007`（操作红） |
| 辅助文字 | 12px | 300 | `#999` |
| 商品标题（横版卡） | 13px | 500 | `#111` |
| Tab 未激活 | 13px | 300 | `#71727A` |
| 正文 / 表单标签 | 14px | 400 | `#111` / `#666` |
| Tab 激活 | 14px–16px | 500–700 | `#1F2024` |
| TwoLineChip 主标 | 14px | 400 | `#111`（默认）/ `#FF0F27`（选中） |
| TwoLineChip 副标 | 11px | 300 | `#999`（默认）/ `#FF0F27`（选中） |
| 空状态标题 | 18px | 500 | `#111` |
| 导航栏标题（TopNav） | **17px** | **500** | `#111` |
| **价格数字** | **20px** | **800（Akrobat）** | **`#FF0007`（操作红）** |

**行高：** 标签 `line-height:1`；正文 `20px`；Tab `16px`
**字间距：** 几乎为 0；英文型号标签 `letter-spacing:0.05em`；价格数字 `letter-spacing:0.01em`

---

### 5 · 间距系统

```css
--zz-space-1:  2px
--zz-space-2:  4px    /* 图标内边距 */
--zz-space-3:  6px
--zz-space-4:  8px    /* 标签间隙、图标-文字间距 */
--zz-space-5:  12px   /* 卡片内边距（紧凑）/ 列表内 padding */
--zz-space-6:  16px   /* 页面左右边距（标准） */
--zz-space-7:  18px
--zz-space-8:  24px   /* 模块间距 */
--zz-space-9:  32px
```

- 设计宽度：**375px**（Figma 原稿）
- 页面内容左右 padding：**16px**（可用宽度 375-32=343px）
- 横版商品卡图片：**90×90px**（Figma 原稿），图文 gap:12px，总高 120px
- feeds 双排：单卡宽 168px，间距 12px

---

### 6 · 圆角系统

```css
--zz-radius-1:   1px    /* 卖点标签（极小胶囊） */
--zz-radius-4:   4px    /* 商品图（横版）/ 品牌机型卡片 */
--zz-radius-6:   6px    /* Chip 选项按钮 */
--zz-radius-8:   8px    /* 商品图（feeds 双排）/ TwoLineChip */
--zz-radius-12:  12px   /* 弹层（配合项） */
--zz-radius-16:  16px   /* Sheet 弹层顶部圆角 */
--zz-radius-18:  18px   /* 搜索框 pill（h36） */
--zz-radius-20:  20px   /* 主按钮 pill（h40） */
--zz-radius-pill:999px
```

---

### 7 · 组件规格

#### 7.1 iOS 状态栏 & 设备框

```
IOSStatusBar 高度：约 62px（含 dynamic island 区域）
  包含：时间 + 信号/WiFi/电量 SVG
内容区 top offset（sticky 元素起始基准）：top:62
设备宽度参考：402px（Figma）；响应式实现按 375px 设计宽度
```

#### 7.2 TopNav（导航栏）

```
所有变体高度：44px，bg:#FFFFFF
sticky 定位：position:sticky, top:62, z-index:5

变体 A — StandardNav：
  左：back icon（20×20）
  中：绝对居中，17px/500/#111
  右：rightText 14px/400 或 rightIcon

变体 B — SearchNav（商详）：
  左：back icon 28×28 圆形容器
  中：小搜索 pill（h:26, radius:999, bg:#F8F8F8）
    icon 16×16 + 占位文字 10px/300/#BBB
  右：share/rent/more icon，28×28 rgba(255,255,255,0.8) 圆容器，gap:10

变体 C — ImmersiveNav（沉浸式，浮于商品图上）：
  背景：transparent

变体 D — TabsNav：内嵌 Tabs 组件
```

#### 7.3 按钮（Button）

```
全部 radius:20（pill）

size="lg"：h40, padding 0 16, font 16/500
  variant="strong"  → bg:#FF0007, color:#FFF, 无边框（主 CTA）
  variant="weak"    → bg:#FFF, color:#111, border:0.5px solid #111

size="md"：h36, padding 0 14, font 14/500
  variant="strong"  → bg:#FF0007, color:#FFF
  variant="weak"    → bg:#FFF, color:#111, border:0.5px solid #BBB

size="sm"：h28, padding 0 14, font 12/400
  variant="strong"  → bg:#FF0007, color:#FFF
  variant="weak"    → bg:#FFF, color:#111, border:0.5px solid #BBB

ButtonBar 容器（按钮行 + home indicator 安全区）：
  bg:#FFF, padding:8px 12px, gap:6px
  layout="single"   → 1个全宽 strong
  layout="equal"    → 2个等宽（weak + strong）
  layout="primary"  → 1个 120px weak + 1个 flex strong
  底部额外 34px home indicator 区
```

#### 7.4 Sheet 弹层

```
scrim：rgba(17,17,17,0.7)，全屏绝对定位，点击关闭
panel：
  position:absolute, left:0, right:0, bottom:0
  border-radius:16px 16px 0 0（仅顶部圆角）
  bg:#FFF，内部 padding:12px 0 0，gap:12

尺寸变体（基于 812px 视口高度）：
  size="50%"：h:406px
  size="60%"：h:487px
  size="70%"：h:568px
  size="80%"：h:650px
  size="auto"：内容驱动

结构（上→下）：
  1. SheetHeader（有 title 时渲染）：h44, 关闭 icon 在右
  2. 内容区：flex:1, overflow:auto, padding:0 16px
  3. 可选 ButtonBar（footer）
  4. Home indicator 区：h34, bg:#FFF，pill 134×5 #111（深色）
```

#### 7.5 Chip 选项按钮

```
h:约26px, radius:6px, bg:#F7F7F7（--zz-bg-soft）
font: 12px / 300 / #666（二级文字）

选中态：
  bg: #FFF2F2（极淡红）
  color: #FF0F27（品牌红）
  border: 0.5px solid #FF0F27

⚠️ 字重：300 恒定，任何状态不加粗（严禁 weight>300）
带下拉 chip：右侧实心三角 caret，打开时旋转 180°
```

#### 7.6 SortTabs 排序栏

```
高度：36px，共 4 个固定 tab：综合 / 价格 / 型号 / 筛选

综合 Tab：
  默认：#666 文字 + 灰色 caret-down
  下拉打开时：#FF0F27 文字 + 实心三角 caret-up
  任一下拉打开时，其他下拉必须自动关闭（互斥）

SortDropdown 浮层：
  position:absolute（浮层覆盖，不挤压列表）
  底部 border-radius:0 0 16px 16px
  内边距：32px 12px 16px，chips gap:12px
```

#### 7.7 商品卡片

**横版卡（ProductCardH）— list-search：**
```
总高：120px，左右 padding:16px，内部垂直 padding:12px
图片：90×90px，radius:4px，bg:#ECECEC
图文间距：gap:12px

文字区（上→下）：
  商品标题  13px/500/#111, 最多2行，line-clamp
  成色描述  10px/300/#999 + 11px/300/#666
  卖点标签  SellingTag（h14, radius:1px, 0.5px 描边，无背景填充，字 10px/300）
  价格行    ¥符号(12px/500/#FF0007) + 数字(20px/800/Akrobat/#FF0007) + 月售(11px/300/#999)
```

**feeds 双列卡（ProductCardFeeds）— 二奢：**
```
单卡宽：168px，gap:12px
图片 radius:8px，描边画在图片上（非整卡加边框）
标题直接落在页面背景上 —— 禁止给整卡加白底/灰底容器
无整卡 radius/阴影
```

**🚫 禁止：**
- ✗ 给商品卡整体加圆角 + 白底 + 阴影（feeds 模式严禁）
- ✗ 卡片内嵌套卡片（白底圆角框套白底圆角框）
- ✗ 商品图上加勾选/对勾标记

#### 7.8 卖点标签（SellingTag）

```
高度：14px（不是 16px）
radius：1px
border：0.5px colored（无填充色，bg:#FFF）
font：10px/300
padding：0 2px

颜色变体：
  red    → color:#FF0F27, border:#FF0F27（次日达）
  yellow → color:#FFA628, border:#FFA628（警示）
  gray   → color:#666, border:#BBB（普通）
  teal   → color:#2E6E89, border:#2E6E89（成色高）
  black  → color:#111, border:#111（已验机）
```

#### 7.9 搜索框

```
SearchHeader（顶部独立搜索页）：
  h:36px, radius:18px（pill）
  待输入态：bg:#F7F7F7, 无边框
  聚焦态：bg:#FFF + 1px solid #111（强描边）
  内部：搜索图标（16×16）+ 占位文字（10px/300/#BBB）

内嵌迷你搜索（SearchNav 用）：
  h:26px, radius:999, bg:#F8F8F8
  占位：10px/300/#BBB
```

#### 7.10 ChipRail 快捷筛选栏

```
高度：34px，横向滚动，chips gap:8px
隐藏滚动条，padding:0 16px
Chip 集合：次日达 / 促销 / 价格区间 / 成色 / 容量
```

#### 7.11 Toast

```
位置：屏幕底部距底部安全区上方 12px，水平居中
bg：rgba(17,17,17,0.85)，radius:8px，padding:10px 16px
font：14px/400/#FFF，最大宽度 343px
无图标（纯文字型），持续约 2s
```

---

### 8 · 页面架构 & Chrome 高度

```
状态栏（IOSStatusBar）：62px
TopNav（导航栏）：44px
排序栏（SortTabs）：36px
快捷 chip 栏（ChipRail）：34px
总 chrome：62 + 44 + 36 + 34 = 176px（内容区从 176px 开始）

底部安全区：
  Home Indicator overlay：34px（透明）
  ButtonBar 容器：button行 + 34px white home indicator 区

sticky 定位基准：
  TopNav → top:62
  SortTabs → top:106
  ChipRail → top:142
  ⚠️ 所有 sticky 元素必须是滚动容器的直接子元素
```

---

### 9 · 图标系统

- 使用 Lucide 图标时颜色必须显式设置（不依赖继承）
- 常用图标：search / cart / back / star / close / share / more / chevron-right / info
- 下拉箭头等极小图标以**内联 SVG**实现
- 禁止使用 emoji / unicode 字符替代图标（✕ ★ 等）

---

### 10 · 阴影与描边

```
卡片阴影：几乎无阴影（转转设计风格）
排序面板下拉：0 2px 8px rgba(137,138,141,0.14)（唯一合法阴影）
弹层浮起：0 6px 24px rgba(0,0,0,0.18)

描边规则：
  价格输入框：0.5px solid #D8D8D8
  搜索框聚焦：1px solid #111
  卖点标签：0.5px solid <color>
  chip 默认：无描边
  chip 选中：0.5px solid #FF0F27

分割线：1px solid #F0F0F0
```

---

### 11 · 容器风格规则（硬约束）

🚫 **绝对禁止混用卡片样式**（通栏 vs 圆角卡片，二选一）：
- ✗ 同一页面既出现通栏列表行（无圆角、无外边距、贴屏边）又出现圆角卡片
- ✓ 发布/表单类页面：统一用通栏列表行，section 间用 8px 灰色分隔块（bg:#F8F8F8）
- ✓ 首页/搜索结果类页面：统一用圆角卡片（radius:16px），卡片间距 8px，左右 margin 12px

🚫 **绝对禁止嵌套卡片**（卡中卡）：
- ✗ 卡片内出现带背景色 + 圆角 + 阴影的子容器
- ✗ box-shadow / border / background 同时出现在父子两层元素上
- ✓ 正确做法：用分割线（1px #F0F0F0）和间距/字号层级区分区域，不加背景框

---

### 12 · 严禁清单

```
✗ emoji（除非用户明确要求）
✗ 感叹号 / 营销 slogan / "发现好物" "为你精选" "百亿补贴"
✗ 渐变 / 毛玻璃 / backdrop-filter（工具型场景）
✗ Inter / Roboto / Arial / system-ui 作为主字体
✗ 价格用黑色（¥ 和数字必须 #FF0007 操作红）
✗ chip 字重 > 300（任何状态）
✗ chip 背景 #F5F5F5（必须 #F7F7F7）
✗ 综合 Tab 默认红色（必须灰色 #666，下拉时才变红）
✗ feeds/list-search 页面背景用 #F8F8F8（必须 #FFFFFF 白底）
✗ 整张卡片加白底 + 阴影 + 圆角（feeds 模式）
✗ 嵌套卡片（卡中卡）
✗ 混用通栏卡片和圆角卡片
✗ 蓝色/紫色用于交互按钮/图标/chip
✗ 高强度阴影（opacity > 0.15）/ 彩色阴影
✗ 商品图上加勾选/对勾标记
✗ 按钮高度 48px（主按钮必须 h40）
✗ 导航标题 18px/700（必须 17px/500）
✗ 非4px倍数的间距
```

---

### 13 · HTML 参考模板（来自 Figma 实现）

【横版商品卡】
```html
<div style="background:#fff;padding:12px 16px;display:flex;gap:12px;border-bottom:1px solid #F0F0F0;">
  <div style="width:90px;height:90px;border-radius:4px;background:#ECECEC;flex-shrink:0;"></div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;min-height:90px;">
    <div style="font-family:'PingFang SC',sans-serif;font-size:13px;font-weight:500;color:#111;line-height:20px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">Apple iPhone 15 256G 蓝色</div>
    <div style="display:flex;align-items:center;gap:4px;margin-top:4px;">
      <span style="font-size:10px;font-weight:300;color:#999;">99新</span>
      <span style="font-size:11px;font-weight:300;color:#666;">外观无划痕 功能完好</span>
    </div>
    <div style="display:flex;gap:4px;margin-top:4px;">
      <span style="height:14px;padding:0 2px;border-radius:1px;border:0.5px solid #FF0F27;font-size:10px;font-weight:300;color:#FF0F27;display:inline-flex;align-items:center;background:#fff;">次日达</span>
      <span style="height:14px;padding:0 2px;border-radius:1px;border:0.5px solid #111;font-size:10px;font-weight:300;color:#111;display:inline-flex;align-items:center;background:#fff;">已验机</span>
    </div>
    <div style="display:flex;align-items:baseline;gap:1px;margin-top:4px;">
      <span style="font-family:'PingFang SC',sans-serif;font-size:12px;font-weight:500;color:#FF0007;">¥</span>
      <span style="font-family:'Akrobat','PingFang SC',sans-serif;font-size:20px;font-weight:800;color:#FF0007;letter-spacing:0.01em;">4280</span>
      <span style="font-size:11px;font-weight:300;color:#999;margin-left:8px;">月售523件</span>
    </div>
  </div>
</div>
```

【主 CTA 按钮（操作红）】
```html
<button style="width:100%;height:40px;background:#FF0007;border:none;border-radius:20px;font-family:'PingFang SC',sans-serif;font-size:16px;font-weight:500;color:#fff;cursor:pointer;">立即购买</button>
```

【弱操作按钮】
```html
<button style="height:40px;padding:0 16px;background:#fff;border:0.5px solid #111;border-radius:20px;font-family:'PingFang SC',sans-serif;font-size:16px;font-weight:500;color:#111;cursor:pointer;">再想想</button>
```

【Chip 选项按钮】
```html
<!-- 未选中 -->
<span style="height:26px;padding:0 10px;border-radius:6px;background:#F7F7F7;display:inline-flex;align-items:center;font-family:'PingFang SC',sans-serif;font-size:12px;font-weight:300;color:#666;">次日达</span>
<!-- 选中 -->
<span style="height:26px;padding:0 10px;border-radius:6px;background:#FFF2F2;border:0.5px solid #FF0F27;display:inline-flex;align-items:center;font-family:'PingFang SC',sans-serif;font-size:12px;font-weight:300;color:#FF0F27;">次日达</span>
```

【Sheet 弹层（基础结构）】
```html
<!-- scrim -->
<div style="position:absolute;inset:0;background:rgba(17,17,17,0.7);"></div>
<!-- panel -->
<div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:16px 16px 0 0;display:flex;flex-direction:column;padding:12px 0 0;">
  <div style="height:44px;display:flex;align-items:center;justify-content:center;position:relative;padding:0 16px;">
    <span style="font-size:17px;font-weight:500;color:#111;">标题</span>
  </div>
  <div style="flex:1;overflow:auto;padding:0 16px;"><!-- 内容 --></div>
  <div style="height:34px;background:#fff;display:flex;align-items:center;justify-content:center;">
    <div style="width:134px;height:5px;border-radius:100px;background:#111;"></div>
  </div>
</div>
```

---

### 14 · 发布 / 表单类页面专用组件参考（直接抄这些片段）

> 适用页面类型：发布商品、填写信息、发起售后、多步骤表单。
> 这类页面统一用**通栏列表行**，section 间用 8px 灰色分隔块，禁止圆角卡片。

【步骤进度条 Stepper】
```html
<div style="padding:12px 20px 16px;background:#fff;">
  <div style="font-size:11px;font-weight:300;color:#999;margin-bottom:10px;">挂售流程</div>
  <div style="display:flex;align-items:flex-start;">
    <!-- 步骤1 当前 -->
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;position:relative;">
      <div style="width:26px;height:26px;border-radius:50%;background:#FF0007;color:#fff;font-size:13px;font-weight:500;display:flex;align-items:center;justify-content:center;font-family:'PingFang SC',sans-serif;position:relative;z-index:1;">1</div>
      <div style="font-size:11px;font-weight:400;color:#111;margin-top:6px;font-family:'PingFang SC',sans-serif;">发布商品</div>
      <!-- 连线（右） -->
      <div style="position:absolute;top:13px;left:calc(50% + 13px);right:calc(-50% + 13px);height:1px;background:#E8E8E8;"></div>
    </div>
    <!-- 步骤2 未到达 -->
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;position:relative;">
      <div style="width:26px;height:26px;border-radius:50%;background:#F0F0F0;color:#999;font-size:13px;font-weight:400;display:flex;align-items:center;justify-content:center;font-family:'PingFang SC',sans-serif;position:relative;z-index:1;">2</div>
      <div style="font-size:11px;font-weight:300;color:#999;margin-top:6px;font-family:'PingFang SC',sans-serif;">买家拍下</div>
      <div style="position:absolute;top:13px;left:calc(50% + 13px);right:calc(-50% + 13px);height:1px;background:#E8E8E8;"></div>
    </div>
    <!-- 步骤3 -->
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;position:relative;">
      <div style="width:26px;height:26px;border-radius:50%;background:#F0F0F0;color:#999;font-size:13px;font-weight:400;display:flex;align-items:center;justify-content:center;font-family:'PingFang SC',sans-serif;position:relative;z-index:1;">3</div>
      <div style="font-size:11px;font-weight:300;color:#999;margin-top:6px;font-family:'PingFang SC',sans-serif;">查验发货</div>
      <div style="position:absolute;top:13px;left:calc(50% + 13px);right:calc(-50% + 13px);height:1px;background:#E8E8E8;"></div>
    </div>
    <!-- 步骤4 最后，无连线 -->
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
      <div style="width:26px;height:26px;border-radius:50%;background:#F0F0F0;color:#999;font-size:13px;font-weight:400;display:flex;align-items:center;justify-content:center;font-family:'PingFang SC',sans-serif;">4</div>
      <div style="font-size:11px;font-weight:300;color:#999;margin-top:6px;font-family:'PingFang SC',sans-serif;">签收打款</div>
    </div>
  </div>
</div>
```

【区块标题行（带计数/操作）】
```html
<div style="padding:16px 16px 0;display:flex;align-items:center;justify-content:space-between;">
  <span style="font-size:16px;font-weight:600;color:#111;font-family:'PingFang SC',sans-serif;">实拍图</span>
  <span style="font-size:13px;font-weight:400;color:#FF0007;font-family:'PingFang SC',sans-serif;">已选 3/9</span>
</div>
<div style="padding:4px 16px 0;font-size:12px;font-weight:300;color:#999;font-family:'PingFang SC',sans-serif;">支持混合选择和拖拽排序</div>
```

【Tab 切换栏（带下划线指示器）】
```html
<div style="display:flex;border-bottom:0.5px solid #F0F0F0;padding:0 4px;margin-top:12px;">
  <!-- 激活态 -->
  <div style="padding:10px 16px;font-size:14px;font-weight:500;color:#FF0007;position:relative;cursor:pointer;font-family:'PingFang SC',sans-serif;">
    拍照
    <div style="position:absolute;bottom:0;left:16px;right:16px;height:2px;background:#FF0007;border-radius:1px;"></div>
  </div>
  <!-- 未激活态 -->
  <div style="padding:10px 16px;font-size:14px;font-weight:300;color:#999;cursor:pointer;font-family:'PingFang SC',sans-serif;">相册</div>
  <div style="padding:10px 16px;font-size:14px;font-weight:300;color:#999;cursor:pointer;font-family:'PingFang SC',sans-serif;">历史发布</div>
</div>
```

【图片选择格子（3列网格）】
```html
<div style="padding:12px 16px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">
  <!-- 已选中格：红色边框 + 红色对勾圆 -->
  <div style="aspect-ratio:1;border-radius:6px;background:#EFEFEF;position:relative;outline:2px solid #FF0007;outline-offset:-1px;cursor:pointer;">
    <div style="position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;background:#FF0007;display:flex;align-items:center;justify-content:center;">
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
  </div>
  <!-- 未选中格：灰色空心圆 -->
  <div style="aspect-ratio:1;border-radius:6px;background:#EFEFEF;position:relative;cursor:pointer;">
    <div style="position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.85);border:1.5px solid #CCCCCC;"></div>
  </div>
</div>
```

【通栏表单行（带右箭头）】
```html
<!-- 标准选择行 -->
<div style="padding:0 16px;background:#fff;display:flex;align-items:center;height:52px;border-bottom:0.5px solid #F0F0F0;cursor:pointer;">
  <span style="font-size:14px;font-weight:400;color:#111;flex:1;font-family:'PingFang SC',sans-serif;">商品分类</span>
  <span style="font-size:14px;font-weight:300;color:#999;font-family:'PingFang SC',sans-serif;">手机</span>
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style="margin-left:6px;"><path d="M1 1L6 6L1 11" stroke="#BBBBBB" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
</div>
<!-- 价格输入行 -->
<div style="padding:0 16px;background:#fff;display:flex;align-items:center;height:52px;border-bottom:0.5px solid #F0F0F0;">
  <span style="font-size:14px;font-weight:400;color:#111;font-family:'PingFang SC',sans-serif;">定价</span>
  <div style="flex:1;display:flex;align-items:center;justify-content:flex-end;gap:4px;">
    <span style="font-size:12px;font-weight:500;color:#FF0007;font-family:'PingFang SC',sans-serif;">¥</span>
    <input type="number" placeholder="请输入" style="border:none;outline:none;font-size:20px;font-weight:600;color:#FF0007;text-align:right;width:120px;font-family:'PingFang SC',sans-serif;background:transparent;">
  </div>
</div>
```

【8px 灰色 Section 分隔块】
```html
<div style="height:8px;background:#F8F8F8;"></div>
```

【底部操作栏（双按钮）】
```html
<div style="position:absolute;bottom:0;left:0;right:0;background:#fff;border-top:0.5px solid #F0F0F0;padding:12px 16px 34px;display:flex;gap:12px;">
  <button style="flex:1;height:44px;border-radius:999px;background:#fff;border:0.5px solid #D8D8D8;font-size:15px;font-weight:400;color:#333;font-family:'PingFang SC',sans-serif;cursor:pointer;">存草稿</button>
  <button style="flex:2;height:44px;border-radius:999px;background:#FF0007;border:none;font-size:16px;font-weight:500;color:#fff;font-family:'PingFang SC',sans-serif;cursor:pointer;">发布</button>
</div>
```

---

### 15 · 品质自查清单（生成后必须逐项核对）

```
□ 价格 ¥ 和数字都是 #FF0007（操作红），不是 #111 黑色？
□ 字体全用 PingFang SC（不是 Inter/Roboto/system-ui）？
□ chip 字重 300（任何状态）？chip 背景 #F7F7F7？chip radius 6px？
□ feeds / list-search 页面背景 #FFFFFF 白色（不是 #F8F8F8）？
□ 综合 Tab 默认灰色（#666），仅下拉打开时变红？
□ 卖点标签高度 14px / radius 1px / 0.5px 描边无填充？
□ 商品图：横版 90×90 radius 4px；feeds radius 8px？
□ 按钮：主 CTA h40 radius 20（不是 h48 radius 999/999px）？
□ 导航栏标题 17px/500（不是 18px/700）？
□ 没有整卡 radius+阴影+白底（feeds 模式）？
□ 没有嵌套卡片？没有混用通栏卡片和圆角卡片？
□ 没有 emoji / 渐变 / 毛玻璃 / banner？
□ 没有蓝色/紫色用于交互元素？
□ sticky 元素 top:62，是滚动容器直接子节点？
□ 所有间距是 4px 倍数？页面左右边距 16px？
```
"""


def get_design_spec() -> str:
    return DESIGN_SPEC
